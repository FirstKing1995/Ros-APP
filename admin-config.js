// ==========================================
// ROSÊ APP — admin-config.js
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
    if (localStorage.getItem('adminLogado') !== 'sim') {
        window.location.href = 'admin.html';
        return;
    }
    buscarConfiguracoes();
};

async function buscarConfiguracoes() {
    try {
        const resposta = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ acao: 'buscarConfigAdmin' })
        });
        const resultado = await resposta.json();
        if (resultado.status === 'sucesso') {
            document.getElementById('config-email').value = resultado.dados.email;
            document.getElementById('config-valor-mensal').value = resultado.dados.valorMensal;
            document.getElementById('config-valor-anual').value = resultado.dados.valorAnual;
        } else {
            alert("Erro ao carregar configurações: " + resultado.mensagem);
        }
    } catch (erro) {
        alert("Erro de conexão ao buscar dados.");
    }
}

document.getElementById('form-config-admin').addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = document.querySelector('#form-config-admin .btn-principal');
    btn.innerText = "SALVANDO..."; btn.disabled = true;

    const dados = {
        acao: 'salvarConfigAdmin',
        email: document.getElementById('config-email').value,
        senha: document.getElementById('config-senha').value,
        valorMensal: document.getElementById('config-valor-mensal').value,
        valorAnual: document.getElementById('config-valor-anual').value
    };

    try {
        const resposta = await fetch(API_URL, { method: 'POST', body: JSON.stringify(dados) });
        const resultado = await resposta.json();
        if (resultado.status === 'sucesso') {
            alert(resultado.mensagem);
            document.getElementById('config-senha').value = "";
        } else {
            alert("Erro: " + resultado.mensagem);
        }
    } catch (erro) {
        alert("Erro de conexão ao salvar.");
    } finally {
        btn.innerText = "SALVAR CONFIGURAÇÕES"; btn.disabled = false;
    }
});

function sairDoAdmin() {
    localStorage.removeItem('adminLogado');
    window.location.href = 'admin.html';
}
