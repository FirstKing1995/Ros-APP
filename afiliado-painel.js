// ==========================================
// ROSÊ APP — afiliado-painel.js
// ==========================================
const API_URL = 'SUA_URL_DO_GOOGLE_APPS_SCRIPT_AQUI';

window.alert = function(mensagem) {
    Swal.fire({ text: mensagem, background: '#1C1C1E', color: '#FFFFFF', confirmButtonColor: '#B76E79', customClass: { popup: 'borda-arredondada' }});
};

let fotoAfiliadoBase64 = "";
let graficoAfiliado = null;

window.onload = function() {
    const emailAfiliado = localStorage.getItem('afiliadoLogado');
    const codigo = localStorage.getItem('codigoAfiliado');

    if (!emailAfiliado) { window.location.href = 'afiliado-login.html'; return; }

    document.getElementById('perfil-email-afiliado').value = emailAfiliado;

    const urlSite = window.location.origin;
    document.getElementById('link-afiliado').value = `${urlSite}/cadastro.html?ref=${codigo}`;

    buscarDadosPainel(emailAfiliado);
    carregarChatAfiliado();

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS && !localStorage.getItem('popupInstalacaoMostrado')) setTimeout(mostrarPopupInstalacao, 3000);
};

async function buscarDadosPainel(email) {
    try {
        const resposta = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ acao: 'buscarDashboardAfiliado', email: email }) });
        const resultado = await resposta.json();

        if (resultado.status === 'sucesso') {
            document.getElementById('nome-afiliado').innerText = `Olá, ${resultado.dados.nome.split(' ')[0]}! 🌹`;
            document.getElementById('metrica-testes').innerText = resultado.dados.testes;
            document.getElementById('metrica-pagos').innerText = resultado.dados.pagos;
            document.getElementById('metrica-comissao-mes').innerText = `R$ ${resultado.dados.comissaoMes.toFixed(2).replace('.', ',')}`;
            document.getElementById('metrica-total-historico').innerText = `R$ ${resultado.dados.totalHistorico.toFixed(2).replace('.', ',')}`;
            document.getElementById('perfil-pix').value = resultado.dados.chavePix || "";

            if (resultado.dados.foto) {
                fotoAfiliadoBase64 = resultado.dados.foto;
                document.getElementById('preview-foto-afiliado').src = fotoAfiliadoBase64;
                document.getElementById('preview-foto-afiliado').style.display = 'block';
                document.getElementById('placeholder-foto-afiliado').style.display = 'none';
            }
            desenharGraficoAfiliado(resultado.dados.grafico);
        }
    } catch (erro) { console.error("Erro ao carregar dados", erro); }
}

function desenharGraficoAfiliado(dadosGrafico) {
    const ctx = document.getElementById('graficoAfiliado').getContext('2d');
    if (graficoAfiliado) graficoAfiliado.destroy();
    graficoAfiliado = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dadosGrafico.meses,
            datasets: [{
                label: 'Novas Indicadas',
                data: dadosGrafico.valores,
                borderColor: '#B76E79', backgroundColor: 'rgba(183, 110, 121, 0.2)',
                borderWidth: 2, tension: 0.4, fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, grid: { color: '#333' } }, x: { grid: { color: '#333' } } }
        }
    });
}

// COMPRESSOR DE FOTO
document.getElementById('input-foto-afiliado').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const MAX_SIZE = 150; let width = img.width; let height = img.height;
            if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } }
            else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
            canvas.width = width; canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            fotoAfiliadoBase64 = canvas.toDataURL('image/jpeg', 0.5);
            document.getElementById('preview-foto-afiliado').src = fotoAfiliadoBase64;
            document.getElementById('preview-foto-afiliado').style.display = 'block';
            document.getElementById('placeholder-foto-afiliado').style.display = 'none';
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
});

// SALVAR PERFIL
document.getElementById('form-perfil-afiliado').addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = document.querySelector('#form-perfil-afiliado .btn-principal');
    btn.innerText = "SALVANDO..."; btn.disabled = true;

    const dados = {
        acao: 'atualizarPerfilAfiliado',
        email: localStorage.getItem('afiliadoLogado'),
        pix: document.getElementById('perfil-pix').value,
        senha: document.getElementById('perfil-senha-afiliado').value,
        foto: fotoAfiliadoBase64
    };

    try {
        const resposta = await fetch(API_URL, { method: 'POST', body: JSON.stringify(dados) });
        const resultado = await resposta.json();
        if (resultado.status === 'sucesso') {
            Swal.fire({ title: 'Salvo! 🌹', text: 'Perfil atualizado com sucesso.', icon: 'success', background: '#1C1C1E', color: '#FFF', confirmButtonColor: '#B76E79' });
            document.getElementById('perfil-senha-afiliado').value = "";
        }
    } catch (erro) { alert("Erro de conexão."); } finally { btn.innerText = "SALVAR PERFIL"; btn.disabled = false; }
});

// CHAT
async function carregarChatAfiliado() {
    try {
        const resposta = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ acao: 'buscarSuporteAfiliado', email: localStorage.getItem('afiliadoLogado') }) });
        const resultado = await resposta.json();
        if (resultado.status === 'sucesso') {
            const chat = document.getElementById('historico-chat-afiliado');
            chat.innerHTML = `<div class="mensagem msg-admin"><p>Olá! Equipe Rosê APP aqui. 🌹 Precisa de ajuda com suas vendas ou pagamentos?</p></div>`;
            resultado.dados.forEach(item => {
                chat.innerHTML += `<div class="mensagem msg-barbeiro"><p>${item.mensagem}</p></div>`;
                if (item.resposta) chat.innerHTML += `<div class="mensagem msg-admin"><p>${item.resposta}</p></div>`;
            });
            chat.scrollTop = chat.scrollHeight;
        }
    } catch (e) { console.error("Erro no chat", e); }
}

async function enviarMensagemAfiliado() {
    const inputMsg = document.getElementById('nova-msg-afiliado');
    const texto = inputMsg.value.trim();
    if (texto === "") return;
    inputMsg.value = '';
    try {
        await fetch(API_URL, { method: 'POST', body: JSON.stringify({ acao: 'enviarMensagemAfiliado', email: localStorage.getItem('afiliadoLogado'), mensagem: texto }) });
        carregarChatAfiliado();
    } catch (erro) { alert("Erro ao enviar mensagem."); }
}

function copiarLink() {
    const inputLink = document.getElementById('link-afiliado');
    inputLink.select(); inputLink.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(inputLink.value);
    Swal.fire({ title: 'Link Copiado! 🌹', text: 'Agora é só compartilhar e faturar!', icon: 'success', background: '#1C1C1E', color: '#FFF', confirmButtonColor: '#B76E79', timer: 2000, showConfirmButton: false });
}

function sairAfiliado() {
    localStorage.removeItem('afiliadoLogado');
    localStorage.removeItem('codigoAfiliado');
    window.location.href = 'afiliado-login.html';
}

// PWA
let eventoInstalacao = null;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); eventoInstalacao = e;
    if (!localStorage.getItem('popupInstalacaoMostrado')) setTimeout(mostrarPopupInstalacao, 2000);
});

function mostrarPopupInstalacao() {
    localStorage.setItem('popupInstalacaoMostrado', 'sim');
    Swal.fire({
        title: '📱 Instale o Painel',
        text: 'Acompanhe suas comissões direto da tela do seu celular!',
        icon: 'info', background: '#1C1C1E', color: '#FFFFFF', showCancelButton: true,
        confirmButtonColor: '#B76E79', cancelButtonColor: '#555555',
        confirmButtonText: 'Instalar Agora', cancelButtonText: 'Mais tarde'
    }).then((result) => { if (result.isConfirmed) acionarInstalacao(); });
}

async function acionarInstalacao() {
    if (eventoInstalacao) {
        eventoInstalacao.prompt(); await eventoInstalacao.userChoice; eventoInstalacao = null;
    } else {
        Swal.fire({
            title: 'Como Instalar',
            html: `<div style="text-align:left;font-size:15px;">
                <p><b style="color:#B76E79;">🍎 iPhone (Safari):</b><br>1. Toque em <b>Compartilhar</b>.<br>2. Toque em <b>Adicionar à Tela de Início</b>.</p>
                <hr style="border-color:#333;">
                <p><b style="color:#B76E79;">🤖 Android (Chrome):</b><br>Toque nos <b>3 pontinhos</b> e em <b>Adicionar à Tela Inicial</b>.</p>
            </div>`,
            background: '#1C1C1E', color: '#FFFFFF', confirmButtonColor: '#B76E79', confirmButtonText: 'Entendi!'
        });
    }
}

