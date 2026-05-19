// ==========================================
// ROSÊ APP — admin-painel.js
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

let meuGrafico = null;

window.onload = function() {
    if (localStorage.getItem('adminLogado') !== 'sim') {
        window.location.href = 'admin.html';
        return;
    }
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    document.getElementById('filtro-mes-admin').value = `${ano}-${mes}`;
    buscarDadosSaaS();

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS && !localStorage.getItem('popupInstalacaoMostrado')) setTimeout(mostrarPopupInstalacao, 3000);
};

async function buscarDadosSaaS() {
    const mesSelecionado = document.getElementById('filtro-mes-admin').value;
    try {
        const resposta = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ acao: 'buscarDashboardAdmin', mesFiltro: mesSelecionado })
        });
        const resultado = await resposta.json();
        if (resultado.status === 'sucesso') {
            document.getElementById('metrica-testes').innerText = resultado.dados.emTeste;
            document.getElementById('metrica-ativos').innerText = resultado.dados.ativos;
            document.getElementById('metrica-faturamento').innerText = `R$ ${resultado.dados.faturamento.toFixed(2).replace('.', ',')}`;
            document.getElementById('metrica-cancelamentos').innerText = resultado.dados.cancelamentos;
            desenharGrafico(resultado.dados.grafico);
        } else {
            alert("Erro ao carregar dados: " + resultado.mensagem);
        }
    } catch (erro) {
        console.error("Erro de conexão.", erro);
    }
}

function desenharGrafico(dadosGrafico) {
    const ctx = document.getElementById('graficoEvolucao').getContext('2d');
    if (meuGrafico) meuGrafico.destroy();
    meuGrafico = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dadosGrafico.labels,
            datasets: [{
                label: 'Salões Ativos',
                data: dadosGrafico.valores,
                borderColor: '#B76E79',
                backgroundColor: 'rgba(183, 110, 121, 0.2)',
                borderWidth: 2, tension: 0.4, fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: '#333' } },
                x: { grid: { color: '#333' } }
            }
        }
    });
}

function sairDoAdmin() {
    localStorage.removeItem('adminLogado');
    window.location.href = 'admin.html';
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
        title: '📱 Instale o Rosê APP',
        text: 'Adicione o painel admin à tela inicial para acesso rápido!',
        icon: 'info', background: '#1C1C1E', color: '#FFFFFF', showCancelButton: true,
        confirmButtonColor: '#B76E79', cancelButtonColor: '#555555',
        confirmButtonText: 'Instalar Agora', cancelButtonText: 'Talvez mais tarde'
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
