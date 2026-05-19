// ==========================================
// ROSÊ APP — admin.js
// ==========================================
const API_URL = 'SUA_URL_DO_GOOGLE_APPS_SCRIPT_AQUI';

window.alert = function(mensagem) {
    Swal.fire({
        text: mensagem,
        background: '#1C1C1E',
        color: '#FFFFFF',
        confirmButtonColor: '#B76E79',
        confirmButtonText: 'ENTENDIDO',
        customClass: { popup: 'borda-arredondada' }
    });
};

document.getElementById('form-admin-login').addEventListener('submit', async function(event) {
    event.preventDefault();

    const btn = document.querySelector('.btn-principal');
    btn.innerText = 'AUTENTICANDO...';
    btn.disabled = true;

    const dados = {
        acao: 'loginAdmin',
        email: document.getElementById('admin-email').value,
        senha: document.getElementById('admin-senha').value
    };

    try {
        const resposta = await fetch(API_URL, { method: 'POST', body: JSON.stringify(dados) });
        const resultado = await resposta.json();

        if (resultado.status === 'sucesso') {
            localStorage.setItem('adminLogado', 'sim');
            window.location.href = 'admin-painel.html';
        } else {
            alert("Acesso Negado: " + resultado.mensagem);
        }
    } catch (erro) {
        alert('Erro de conexão com o servidor.');
    } finally {
        btn.innerText = 'ENTRAR NO SISTEMA';
        btn.disabled = false;
    }
});

// PWA
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
        text: 'Adicione o painel admin à tela inicial do seu celular para acesso rápido!',
        icon: 'info', background: '#1C1C1E', color: '#FFFFFF', showCancelButton: true,
        confirmButtonColor: '#B76E79', cancelButtonColor: '#555555',
        confirmButtonText: 'Instalar Agora', cancelButtonText: 'Talvez mais tarde'
    }).then((result) => { if (result.isConfirmed) acionarInstalacao(); });
}

async function acionarInstalacao() {
    if (eventoInstalacao) {
        eventoInstalacao.prompt();
        await eventoInstalacao.userChoice;
        eventoInstalacao = null;
    } else {
        Swal.fire({
            title: 'Como Instalar',
            html: `<div style="text-align:left;font-size:15px;">
                <p><b style="color:#B76E79;">🍎 iPhone (Safari):</b><br>1. Toque em <b>Compartilhar</b>.<br>2. Toque em <b>Adicionar à Tela de Início</b>.</p>
                <hr style="border-color:#333;">
                <p><b style="color:#B76E79;">🤖 Android (Chrome):</b><br>Toque nos <b>3 pontinhos</b> e depois em <b>Adicionar à Tela Inicial</b>.</p>
            </div>`,
            background: '#1C1C1E', color: '#FFFFFF', confirmButtonColor: '#B76E79', confirmButtonText: 'Entendi!'
        });
    }
}
