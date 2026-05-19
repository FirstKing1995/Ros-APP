// ==========================================
// ROSÊ APP — pagamento.js
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

window.onload = function() {
    if (!localStorage.getItem('usuarioLogado')) { window.location.href = 'index.html'; return; }
    buscarPrecosPlanos();
};

async function buscarPrecosPlanos() {
    try {
        const resp = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ acao: 'buscarPrecosSaaS' })
        });
        const res = await resp.json();
        if (res.status === 'sucesso') {
            document.getElementById('valor-mensal-tela').innerText = res.dados.mensal.replace('.', ',');
        }
    } catch (e) { console.error("Erro ao carregar preços.", e); }
}

async function iniciarPagamento(tipoPlano) {
    const emailSalao = localStorage.getItem('usuarioLogado');
    if (!emailSalao) return;

    const botoes = document.querySelectorAll('.btn-pagar');
    botoes.forEach(btn => {
        btn.innerHTML = '<span class="material-symbols-rounded">sync</span> GERANDO LINK...';
        btn.disabled  = true;
    });

    try {
        const resp = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ acao: 'gerarPagamento', email: emailSalao, plano: 'mensal' })
        });
        const res = await resp.json();

        if (res.status === 'sucesso') {
            window.location.href = res.linkCheckout;
        } else {
            alert("Erro ao gerar pagamento: " + res.mensagem);
            botoes.forEach(btn => {
                btn.innerHTML = '<span class="material-symbols-rounded">lock_open</span> Tentar Novamente';
                btn.disabled  = false;
            });
        }
    } catch (e) {
        alert("Erro de conexão.");
        botoes.forEach(btn => {
            btn.innerHTML = '<span class="material-symbols-rounded">lock_open</span> Tentar Novamente';
            btn.disabled  = false;
        });
    }
}

function sairDoApp() {
    localStorage.removeItem('usuarioLogado');
    window.location.href = 'index.html';
}
