// ==========================================
// ROSÊ APP — consultar.js
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

const emailSalaoAtual = sessionStorage.getItem('barbeariaVisitada');

window.onload = function() {
    if (!emailSalaoAtual) {
        alert("Erro: Salão não identificado. Acesse pelo link original.");
        window.history.back();
    }
};

function voltarAoInicio() {
    window.location.href = `cliente.html?b=${btoa(emailSalaoAtual)}`;
}

async function consultarMeusAgendamentos() {
    const whatsapp = document.getElementById('busca-whatsapp').value.trim();
    if (!whatsapp) { alert("Digite seu WhatsApp para buscar."); return; }

    const btn = document.getElementById('btn-buscar');
    btn.innerText = "BUSCANDO..."; btn.disabled = true;

    try {
        const resp = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({
                acao: 'buscarAgendamentosCliente',
                emailBarbearia: emailSalaoAtual,
                whatsapp: whatsapp
            })
        });
        const res = await resp.json();

        document.getElementById('area-resultados').style.display = 'block';
        const lista = document.getElementById('lista-meus-agendamentos');
        lista.innerHTML = '';

        if (res.status === 'sucesso') {
            renderizarMeusAgendamentos(res.dados);
        } else {
            lista.innerHTML = `<p style="text-align:center; color:#AAA; padding:20px;">${res.mensagem}</p>`;
        }
    } catch (e) {
        alert("Erro de conexão ao buscar horários.");
    } finally {
        btn.innerText = "BUSCAR MEUS HORÁRIOS"; btn.disabled = false;
    }
}

function renderizarMeusAgendamentos(agendamentos) {
    const lista = document.getElementById('lista-meus-agendamentos');
    agendamentos.forEach(ag => {
        lista.innerHTML += `
            <div class="cartao-resumo" id="ag-linha-${ag.linha}">
                <div class="detalhes-resumo">
                    <p><b>Data:</b> ${ag.data} às ${ag.horario}</p>
                    <p><b>Especialista:</b> ${ag.barbeiro}</p>
                    <p><b>Serviços:</b> ${ag.servicos}</p>
                    <p><b>Total:</b> R$ ${ag.valor}</p>
                </div>
                <button class="btn-cancelar-cliente" onclick="cancelarMeuAgendamento(${ag.linha})">
                    <span class="material-symbols-rounded" style="font-size:14px; vertical-align:middle;">cancel</span>
                    CANCELAR ESTE AGENDAMENTO
                </button>
            </div>`;
    });
}

async function cancelarMeuAgendamento(linha) {
    const confirmacao = await Swal.fire({
        title: 'Cancelar agendamento?',
        text: "Esta ação não pode ser desfeita.",
        icon: 'warning',
        background: '#1C1C1E', color: '#FFFFFF',
        showCancelButton: true,
        confirmButtonColor: '#FF6B6B', cancelButtonColor: '#555',
        confirmButtonText: 'Sim, cancelar', cancelButtonText: 'Voltar'
    });
    if (!confirmacao.isConfirmed) return;

    try {
        const resp = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ acao: 'cancelarAgendamento', linha: linha })
        });
        const res = await resp.json();
        if (res.status === 'sucesso') {
            Swal.fire({ title: 'Cancelado', text: 'Seu agendamento foi cancelado.', icon: 'success', background: '#1C1C1E', color: '#FFF', confirmButtonColor: '#B76E79' });
            document.getElementById(`ag-linha-${linha}`).style.display = 'none';
        } else { alert("Erro: " + res.mensagem); }
    } catch (e) { alert("Erro de conexão."); }
}
