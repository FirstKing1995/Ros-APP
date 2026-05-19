// ==========================================
// ROSÊ APP — agendamentos.js
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

window.onload = function() {
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    if (!usuarioLogado) { window.location.href = 'index.html'; return; }

    configurarDataAtual();
    buscarAgendamentosDaPlanilha();
};

function configurarDataAtual() {
    const campoData = document.getElementById('filtro-data');
    const hoje      = new Date();
    const ano       = hoje.getFullYear();
    const mes       = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia       = String(hoje.getDate()).padStart(2, '0');
    campoData.value = `${ano}-${mes}-${dia}`;
}

document.getElementById('filtro-data').addEventListener('change', function() {
    buscarAgendamentosDaPlanilha();
});

async function buscarAgendamentosDaPlanilha() {
    const emailSalao  = localStorage.getItem('usuarioLogado');
    const dataFiltro  = document.getElementById('filtro-data').value;
    const lista       = document.getElementById('lista-agendamentos');

    lista.innerHTML = '<p style="text-align:center; padding: 20px; color: #AAA;">Carregando agenda... 🌹</p>';

    try {
        const resposta  = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ acao: 'buscarAgendamentos', email: emailSalao, dataFiltro: dataFiltro })
        });
        const resultado = await resposta.json();

        if (resultado.status === 'sucesso') {
            renderizarAgendamentos(resultado.dados, dataFiltro);
        } else {
            lista.innerHTML = `<p style="text-align:center; color: #FF6B6B; padding: 20px;">Erro: ${resultado.mensagem}</p>`;
        }
    } catch (erro) {
        lista.innerHTML = '<p style="text-align:center; color: #FF6B6B; padding: 20px;">Erro de conexão.</p>';
        console.error(erro);
    }
}

function renderizarAgendamentos(agendamentos, dataFiltro) {
    const lista = document.getElementById('lista-agendamentos');
    lista.innerHTML = '';

    if (agendamentos.length === 0) {
        lista.innerHTML = `
            <div style="text-align:center; padding: 40px 20px; background: #FFF; border-radius: var(--borda-raio); border: 1px solid #F5E8EA;">
                <span class="material-symbols-rounded" style="font-size: 40px; color: var(--cor-rose-claro);">calendar_today</span>
                <p style="color: #AAA; font-size: 14px; margin-top: 10px;">Nenhum agendamento para este dia.</p>
            </div>`;
        return;
    }

    const [, mesFiltro, diaFiltro] = dataFiltro.split('-');

    agendamentos.forEach(ag => {
        let isAniversario = false;
        if (ag.dataNascimento) {
            const [, mesNasc, diaNasc] = ag.dataNascimento.split('-');
            if (mesNasc === mesFiltro && diaNasc === diaFiltro) isAniversario = true;
        }

        const badgeAniversario = isAniversario ? `
            <div class="badge-aniversario">
                <span class="material-symbols-rounded">cake</span>
                Aniversariante hoje! 🎂
            </div>` : '';

        lista.innerHTML += `
            <div class="caixa-agendamento">
                <div class="cabecalho-agendamento">
                    <span class="horario-agendamento">${ag.horario}</span>
                    <span class="valor-agendamento">R$ ${ag.valor}</span>
                </div>
                <div class="corpo-agendamento">
                    <h3>${ag.cliente}
                        <span style="font-size: 12px; color: #AAA; font-weight: 400;">
                            (com ${ag.barbeiro})
                        </span>
                    </h3>
                    <div class="detalhes-servico">
                        <span>✨ ${ag.servicos}</span>
                        <span>⏳ ${ag.tempo}</span>
                    </div>
                    ${badgeAniversario}
                    <hr style="border: none; border-top: 1px solid #F5E8EA; margin: 12px 0 10px 0;">
                    <button class="btn-whatsapp-agenda"
                            onclick="chamarWhatsAppCliente('${ag.cliente}', '${ag.telefone}')">
                        <span class="material-symbols-rounded" style="font-size: 18px;">chat</span>
                        Enviar Lembrete no WhatsApp
                    </button>
                </div>
            </div>`;
    });
}

function chamarWhatsAppCliente(nome, telefone) {
    if (!telefone || telefone === "undefined" || telefone.trim() === "") {
        alert("Esta cliente não possui WhatsApp cadastrado no sistema.");
        return;
    }
    const numLimpo = telefone.replace(/\D/g, '');
    const msg      = encodeURIComponent(`Olá ${nome}! 🌹 Aqui é do seu salão. Passando para confirmar o seu horário com a gente hoje. Até logo!`);
    window.open(`https://api.whatsapp.com/send?phone=55${numLimpo}&text=${msg}`, '_blank');
}
