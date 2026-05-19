// ==========================================
// ROSÊ APP — admin-suporte.js
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
    buscarChamadosSuporte();
};

async function buscarChamadosSuporte() {
    const listaHTML = document.getElementById('lista-chamados-admin');
    try {
        const resposta = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ acao: 'buscarSuporteAdmin' })
        });
        const resultado = await resposta.json();
        if (resultado.status === 'sucesso') {
            renderizarChamados(resultado.dados);
        } else {
            listaHTML.innerHTML = `<p style="color:red; text-align:center;">Erro: ${resultado.mensagem}</p>`;
        }
    } catch (erro) {
        listaHTML.innerHTML = '<p style="color:red; text-align:center;">Erro de conexão.</p>';
    }
}

function renderizarChamados(lista) {
    const container = document.getElementById('lista-chamados-admin');
    container.innerHTML = '';

    if (lista.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#888; padding:20px;">Caixa de entrada vazia. Nenhum chamado no momento. 🌹</p>';
        return;
    }

    lista.forEach(chamado => {
        let areaResposta = '';
        if (chamado.status === 'Aberto') {
            areaResposta = `
                <div class="area-resposta-admin" id="area-resp-${chamado.linha}">
                    <textarea id="texto-resp-${chamado.linha}" placeholder="Digite sua resposta para o salão..."></textarea>
                    <button class="btn-principal" onclick="enviarResposta(${chamado.linha})">
                        <span class="material-symbols-rounded" style="font-size:18px; vertical-align:middle;">send</span> ENVIAR RESPOSTA
                    </button>
                </div>`;
        } else {
            areaResposta = `
                <div class="resposta-enviada">
                    <b>Sua resposta:</b><br>${chamado.resposta}
                </div>`;
        }

        container.innerHTML += `
            <div class="cartao-suporte-admin">
                <div class="cabecalho-chamado">
                    <span class="remetente-chamado">${chamado.remetente}</span>
                    <span class="data-chamado">${chamado.data}</span>
                </div>
                <div class="mensagem-cliente-admin">" ${chamado.mensagem} "</div>
                ${areaResposta}
            </div>`;
    });
}

async function enviarResposta(linha) {
    const textoResposta = document.getElementById(`texto-resp-${linha}`).value.trim();
    if (!textoResposta) { alert("Por favor, digite uma resposta antes de enviar."); return; }

    try {
        const resposta = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ acao: 'responderSuporte', linha: linha, resposta: textoResposta })
        });
        const resultado = await resposta.json();
        if (resultado.status === 'sucesso') {
            alert("Resposta enviada com sucesso! 🌹");
            buscarChamadosSuporte();
        } else {
            alert("Erro: " + resultado.mensagem);
        }
    } catch (erro) {
        alert("Erro de conexão ao enviar resposta.");
    }
}
