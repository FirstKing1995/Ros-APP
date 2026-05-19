// ==========================================
// ROSÊ APP — perfil.js
// ==========================================
const API_URL = 'SUA_URL_DO_GOOGLE_APPS_SCRIPT_AQUI';

window.alert = function(mensagem) {
    Swal.fire({
        text: mensagem,
        background: '#1C1C1E', color: '#FFFFFF',
        confirmButtonColor: '#B76E79', confirmButtonText: 'ENTENDIDO',
        customClass: { popup: 'borda-arredondada' }
    });
};

let logoBase64Atual = "";

window.onload = function() {
    const emailSalao = localStorage.getItem('usuarioLogado');
    if (!emailSalao) { window.location.href = 'index.html'; return; }

    document.getElementById('perfil-email').value = emailSalao;
    buscarDadosDoPerfil(emailSalao);
    carregarHistoricoChat();

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS && !localStorage.getItem('popupInstalacaoMostrado')) {
        setTimeout(mostrarPopupInstalacao, 2500);
    }
};

// ==========================================
// COMPRESSOR DE LOGO
// ==========================================
document.getElementById('input-logo').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas   = document.createElement('canvas');
            const MAX_SIZE = 150;
            let width  = img.width, height = img.height;
            if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } }
            else                { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
            canvas.width = width; canvas.height = height;
            canvas.getContext('2d').drawImage(img, 0, 0, width, height);
            logoBase64Atual = canvas.toDataURL('image/jpeg', 0.6);

            const preview = document.getElementById('preview-logo');
            preview.src   = logoBase64Atual;
            preview.style.display = 'block';
            document.getElementById('placeholder-logo').style.display = 'none';
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
});

// ==========================================
// BUSCAR DADOS DO PERFIL
// ==========================================
async function buscarDadosDoPerfil(email) {
    try {
        const resp = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ acao: 'buscarPerfil', email: email })
        });
        const res = await resp.json();
        if (res.status === 'sucesso') {
            const d = res.dados;
            document.getElementById('perfil-nome').value     = d.nome || '';
            document.getElementById('perfil-whatsapp').value = d.whatsapp || '';
            document.getElementById('dias-texto').innerText  = d.diasRestantes || '0';

            if (d.logo) {
                const preview = document.getElementById('preview-logo');
                preview.src   = d.logo;
                preview.style.display = 'block';
                document.getElementById('placeholder-logo').style.display = 'none';
            }
        }
    } catch (e) { console.error("Erro ao buscar perfil:", e); }
}

// ==========================================
// SALVAR ALTERAÇÕES DO PERFIL
// ==========================================
document.getElementById('form-editar-perfil').addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn  = document.querySelector('#form-editar-perfil .btn-principal');
    const orig = btn.innerText;
    btn.innerText = 'SALVANDO...'; btn.disabled = true;

    const dados = {
        acao:     'atualizarPerfil',
        email:    localStorage.getItem('usuarioLogado'),
        nome:     document.getElementById('perfil-nome').value,
        whatsapp: document.getElementById('perfil-whatsapp').value,
        senha:    document.getElementById('perfil-senha').value,
        logo:     logoBase64Atual
    };

    try {
        const resp = await fetch(API_URL, { method: 'POST', body: JSON.stringify(dados) });
        const res  = await resp.json();
        if (res.status === 'sucesso') {
            Swal.fire({ title: 'Salvo! 🌹', text: 'Perfil atualizado com sucesso.', icon: 'success', background: '#1C1C1E', color: '#FFF', confirmButtonColor: '#B76E79' });
        } else { alert("Erro: " + res.mensagem); }
    } catch (err) { alert("Erro de conexão."); }
    finally { btn.innerText = orig; btn.disabled = false; }
});

// ==========================================
// CANCELAR ASSINATURA
// ==========================================
async function cancelarAssinatura() {
    const confirmacao = await Swal.fire({
        title: 'Cancelar Assinatura?',
        text: "Seu salão deixará de receber novos agendamentos ao final do período pago.",
        icon: 'question',
        background: '#1C1C1E', color: '#FFFFFF',
        showCancelButton: true,
        confirmButtonColor: '#FF6B6B', cancelButtonColor: '#555',
        confirmButtonText: 'Sim, cancelar', cancelButtonText: 'Voltar'
    });
    if (!confirmacao.isConfirmed) return;

    try {
        const resp = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ acao: 'cancelarAssinatura', email: localStorage.getItem('usuarioLogado') })
        });
        const res = await resp.json();
        if (res.status === 'sucesso') {
            await Swal.fire({ title: 'Cancelado', text: res.mensagem, icon: 'success', background: '#1C1C1E', color: '#FFF', confirmButtonColor: '#B76E79' });
            location.reload();
        } else { alert("Erro: " + res.mensagem); }
    } catch (e) { alert("Erro de conexão."); }
}

function sairDoApp() {
    localStorage.removeItem('usuarioLogado');
    window.location.href = 'index.html';
}

// ==========================================
// CHAT DE SUPORTE
// ==========================================
async function carregarHistoricoChat() {
    const email = localStorage.getItem('usuarioLogado');
    try {
        const resp = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ acao: 'buscarMensagens', email: email }) });
        const res  = await resp.json();
        if (res.status === 'sucesso' && res.dados.length > 0) {
            const historico = document.getElementById('historico-mensagens');
            res.dados.forEach(msg => {
                const classe = msg.tipo === 'admin' ? 'msg-admin' : 'msg-barbeiro';
                historico.innerHTML += `<div class="mensagem ${classe}"><p>${msg.texto}</p></div>`;
            });
            historico.scrollTop = historico.scrollHeight;
        }
    } catch (e) { /* Chat carrega vazio se der erro */ }
}

async function enviarMensagem() {
    const input = document.getElementById('nova-mensagem');
    const texto = input.value.trim();
    if (!texto) return;

    const email    = localStorage.getItem('usuarioLogado');
    const historico = document.getElementById('historico-mensagens');

    // Adiciona visualmente na hora
    historico.innerHTML += `<div class="mensagem msg-barbeiro"><p>${texto}</p></div>`;
    historico.scrollTop  = historico.scrollHeight;
    input.value = '';

    try {
        await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ acao: 'enviarMensagem', email: email, texto: texto, tipo: 'usuario' })
        });
    } catch (e) { /* mensagem fica visualmente mas pode não ter salvo */ }
}

// ==========================================
// INSTALAÇÃO PWA
// ==========================================
let eventoInstalacao = null;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    eventoInstalacao = e;
    if (!localStorage.getItem('popupInstalacaoMostrado')) setTimeout(mostrarPopupInstalacao, 2000);
});

function mostrarPopupInstalacao() {
    localStorage.setItem('popupInstalacaoMostrado', 'sim');
    Swal.fire({
        title: '📱 Instale o Rosê APP',
        text: 'Adicione o app à tela inicial do seu celular para acesso rápido e completo.',
        icon: 'info', background: '#1C1C1E', color: '#FFF',
        showCancelButton: true,
        confirmButtonColor: '#B76E79', cancelButtonColor: '#555',
        confirmButtonText: 'Instalar Agora', cancelButtonText: 'Depois'
    }).then(r => { if (r.isConfirmed) acionarInstalacao(); });
}

async function acionarInstalacao() {
    if (eventoInstalacao) {
        eventoInstalacao.prompt();
        const { outcome } = await eventoInstalacao.userChoice;
        eventoInstalacao = null;
        if (outcome === 'accepted') {
            Swal.fire({ title: 'App Instalado! 🌹', icon: 'success', background: '#1C1C1E', color: '#FFF', confirmButtonColor: '#B76E79' });
        }
    } else {
        Swal.fire({
            title: 'Como Instalar o Rosê APP',
            html: `<div style="text-align:left; font-size:14px; color:#CCC; line-height:1.8;">
                <p><b style="color:#B76E79;">🍎 iPhone (Safari):</b><br>
                1. Toque no ícone Compartilhar (□↑)<br>2. Role e toque em "Adicionar à Tela de Início"</p>
                <hr style="border-color:#333; margin:12px 0;">
                <p><b style="color:#B76E79;">🤖 Android (Chrome):</b><br>
                Toque nos 3 pontinhos → "Adicionar à Tela Inicial"</p></div>`,
            background: '#1C1C1E', color: '#FFF',
            confirmButtonColor: '#B76E79', confirmButtonText: 'Entendi!'
        });
    }
}
