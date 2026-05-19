// ==========================================
// ROSÊ APP — dashboard.js
// ==========================================
const API_URL = 'https://script.google.com/macros/s/AKfycbzzYjT12l48onOPS3yYCA-CwsUsnTBmNWQEHs6YpQSLG7B6tkxvB8d7EPbnJhNa1noS1A/exec';

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
    const emailSalao = localStorage.getItem('usuarioLogado');
    if (!emailSalao) { window.location.href = 'index.html'; return; }

    carregarDashboard(emailSalao);

    // Pop-up de instalação para iPhone (iOS)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS && !localStorage.getItem('popupInstalacaoMostrado')) {
        setTimeout(mostrarPopupInstalacao, 3000);
    }
};

async function carregarDashboard(email) {
    const hoje = new Date();
    const ano  = hoje.getFullYear();
    const mes  = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia  = String(hoje.getDate()).padStart(2, '0');

    const dataHoje         = `${ano}-${mes}-${dia}`;
    const mesFiltro        = `${ano}-${mes}`;
    const horaAtualMinutos = (hoje.getHours() * 60) + hoje.getMinutes();

    const mesesTexto = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    document.getElementById('data-hoje-texto').innerText = `Hoje, ${dia} de ${mesesTexto[hoje.getMonth()]}`;

    try {
        // Busca perfil do salão
        const respPerfil = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ acao: 'buscarPerfil', email: email })
        });
        const resultadoPerfil = await respPerfil.json();

        if (resultadoPerfil.status === 'sucesso') {
            document.getElementById('saudacao-nome').innerText = `Olá, ${resultadoPerfil.dados.nome}! 🌹`;

            // Alerta de assinatura expirando
            const diasRestantes = parseInt(resultadoPerfil.dados.diasRestantes);
            if (diasRestantes <= 1) {
                Swal.fire({
                    title: '⚠️ Assinatura Expirando!',
                    text: 'Este é o último dia da sua assinatura. Renove agora para não perder nenhum agendamento.',
                    icon: 'warning',
                    background: '#1C1C1E', color: '#FFFFFF',
                    showCancelButton: true,
                    confirmButtonColor: '#B76E79', cancelButtonColor: '#555',
                    confirmButtonText: '🌹 Renovar Agora',
                    cancelButtonText: 'Mais tarde',
                    allowOutsideClick: false
                }).then((result) => {
                    if (result.isConfirmed) window.location.href = 'pagamento.html';
                });
            }
        }

        // Busca dados do dashboard completo
        const respDash = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({
                acao: 'buscarDashboardBarbearia',
                email: email,
                mesFiltro: mesFiltro,
                dataHoje: dataHoje,
                horaAtualMinutos: horaAtualMinutos
            })
        });
        const resultadoDash = await respDash.json();

        if (resultadoDash.status === 'sucesso') {
            const d = resultadoDash.dados;

            // Métricas
            document.getElementById('dash-fat-dia').innerText         = `R$ ${d.faturamentoDia.toFixed(2)}`;
            document.getElementById('dash-fat-mes').innerText         = `R$ ${d.faturamentoMes.toFixed(2)}`;
            document.getElementById('dash-cancelamentos').innerText   = d.cancelamentosMes;
            document.getElementById('dash-top-servico').innerText     = d.servicoTop;

            // Próximas clientes
            const divProximos = document.getElementById('lista-proximos-clientes');
            divProximos.innerHTML = '';
            if (d.proximos.length === 0) {
                divProximos.innerHTML = `
                    <p style="text-align: center; color: #AAA; font-size: 13px; padding: 20px; background: #FFF; border-radius: 12px;">
                        Nenhuma cliente agendada para as próximas horas.
                    </p>`;
            } else {
                d.proximos.forEach(cli => {
                    divProximos.innerHTML += `
                        <div class="item-proximo-cliente">
                            <div class="hora-proximo">${cli.horario}</div>
                            <div class="info-proximo-cliente">
                                <h4>${cli.cliente}</h4>
                                <p>${cli.servicos} com <b>${cli.barbeiro}</b></p>
                            </div>
                        </div>`;
                });
            }

            // Gráfico de atendimentos
            const ctx = document.getElementById('graficoAtendimentos').getContext('2d');
            if (meuGrafico) meuGrafico.destroy();
            meuGrafico = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: d.grafico.labels,
                    datasets: [{
                        label: 'Atendimentos',
                        data:  d.grafico.data,
                        backgroundColor: 'rgba(183, 110, 121, 0.6)',
                        borderColor:     '#B76E79',
                        borderWidth: 2,
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, ticks: { stepSize: 1 } }
                    }
                }
            });

            // Ranking da equipe
            const divRanking = document.getElementById('ranking-equipe');
            divRanking.innerHTML = '';
            if (!d.ranking || d.ranking.length === 0) {
                divRanking.innerHTML = `<p style="text-align:center; color:#AAA; padding:15px; font-size:13px;">Nenhum dado de equipe ainda.</p>`;
            } else {
                d.ranking.forEach((pro, i) => {
                    divRanking.innerHTML += `
                        <div class="linha-equipe">
                            <span class="nome-barbeiro-rank">${i + 1}. ${pro.nome}</span>
                            <span class="dados-barbeiro-rank">${pro.atendimentos} atend. · R$ ${pro.faturamento.toFixed(2)}</span>
                        </div>`;
                });
            }
        }

    } catch (erro) {
        console.error('Erro ao carregar dashboard:', erro);
        document.getElementById('saudacao-nome').innerText = 'Erro ao carregar dados';
    }
}

// ==========================================
// INSTALAÇÃO PWA
// ==========================================
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
});

async function acionarInstalacao() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS) {
        mostrarPopupInstalacao();
        return;
    }
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        deferredPrompt = null;
        if (outcome === 'accepted') {
            Swal.fire({ title: 'App Instalado! 🌹', icon: 'success', background: '#1C1C1E', color: '#FFF', confirmButtonColor: '#B76E79' });
        }
    } else {
        alert('Para instalar: abra o menu do seu navegador e toque em "Adicionar à tela inicial".');
    }
}

function mostrarPopupInstalacao() {
    localStorage.setItem('popupInstalacaoMostrado', 'true');
    Swal.fire({
        title: 'Instalar Rosê APP',
        html: `
            <p style="font-size: 14px; color: #CCC; line-height: 1.6;">
                Para instalar o app no iPhone:<br><br>
                1. Toque no ícone <b style="color:#B76E79;">Compartilhar</b> (□↑) na parte de baixo do Safari.<br>
                2. Role e toque em <b style="color:#B76E79;">"Adicionar à Tela de Início"</b>.<br>
                3. Toque em <b style="color:#B76E79;">Adicionar</b> no canto superior direito.
            </p>`,
        background: '#1C1C1E', color: '#FFF',
        confirmButtonColor: '#B76E79', confirmButtonText: 'ENTENDIDO'
    });
}
