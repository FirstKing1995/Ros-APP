// ==========================================
// ROSÊ APP — admin-afiliados.js
// ==========================================
const API_URL = 'https://script.google.com/macros/s/AKfycbzzYjT12l48onOPS3yYCA-CwsUsnTBmNWQEHs6YpQSLG7B6tkxvB8d7EPbnJhNa1noS1A/exec';

window.alert = function(mensagem) {
    Swal.fire({ text: mensagem, background: '#1C1C1E', color: '#FFFFFF', confirmButtonColor: '#B76E79', customClass: { popup: 'borda-arredondada' }});
};

window.onload = function() {
    if (localStorage.getItem('adminLogado') !== 'sim') {
        window.location.href = 'admin.html';
        return;
    }
    buscarDadosAdminAfiliados();
};

async function buscarDadosAdminAfiliados() {
    try {
        const resposta = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ acao: 'buscarAdminAfiliados' }) });
        const resultado = await resposta.json();

        if (resultado.status === 'sucesso') {
            const d = resultado.dados;

            // 1. RANKING
            const divRanking = document.getElementById('ranking-afiliados');
            divRanking.innerHTML = '';
            if (d.ranking.length === 0) {
                divRanking.innerHTML = '<p style="text-align:center; color:#888;">Nenhuma parceira ainda.</p>';
            }
            d.ranking.forEach((afi, index) => {
                let fotoHtml = afi.foto
                    ? `<img src="${afi.foto}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;border:2px solid var(--cor-destaque);">`
                    : `<div style="width:40px;height:40px;border-radius:50%;background:#333;display:flex;align-items:center;justify-content:center;color:var(--cor-destaque);font-weight:bold;">${afi.nome.charAt(0).toUpperCase()}</div>`;
                let medalha = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}º`;
                divRanking.innerHTML += `
                    <div class="linha-equipe" style="display:flex;align-items:center;gap:15px;">
                        <span style="font-size:20px;font-weight:bold;color:var(--cor-destaque);width:30px;text-align:center;">${medalha}</span>
                        ${fotoHtml}
                        <div style="flex:1;">
                            <span class="nome-barbeiro-rank" style="font-size:16px;">${afi.nome}</span>
                            <span class="dados-barbeiro-rank" style="font-size:12px;color:#AAA;">${afi.ativos} salões ativos</span>
                        </div>
                        <span style="font-size:14px;font-weight:bold;color:#4CAF50;">R$ ${afi.totalHistorico.toFixed(2).replace('.', ',')}</span>
                    </div>`;
            });

            // 2. FOLHA DE PAGAMENTO
            const divPagamentos = document.getElementById('lista-pagamento-afiliados');
            divPagamentos.innerHTML = '';
            if (d.pagamentos.length === 0) {
                divPagamentos.innerHTML = '<p style="text-align:center; color:#888;">Nenhum pagamento pendente.</p>';
            }
            d.pagamentos.forEach(pag => {
                let btnPagamento = "";
                if (pag.jaPago) {
                    btnPagamento = `<button disabled style="background:#25D366;color:#000;padding:8px 12px;border:none;border-radius:4px;font-weight:bold;display:flex;align-items:center;gap:5px;"><span class="material-symbols-rounded" style="font-size:18px;">check_circle</span> Mês Pago</button>`;
                } else if (pag.valor === 0) {
                    btnPagamento = `<button disabled style="background:#333;color:#888;padding:8px 12px;border:none;border-radius:4px;font-weight:bold;">Sem Saldo</button>`;
                } else {
                    btnPagamento = `<button onclick="pagarAfiliado('${pag.email}', ${pag.valor}, '${pag.nome}')" style="background:var(--cor-destaque);color:#fff;padding:8px 12px;border:none;border-radius:4px;font-weight:bold;cursor:pointer;display:flex;align-items:center;gap:5px;"><span class="material-symbols-rounded" style="font-size:18px;">payments</span> Pagar R$ ${pag.valor.toFixed(2).replace('.', ',')}</button>`;
                }
                divPagamentos.innerHTML += `
                    <div style="background:#222;border:1px solid #444;border-radius:8px;padding:15px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
                        <div>
                            <h4 style="color:#FFF;margin:0 0 5px 0;">${pag.nome}</h4>
                            <p style="color:#AAA;margin:0;font-size:12px;">PIX: <b style="color:#FFF;">${pag.pix || "Não cadastrado"}</b></p>
                        </div>
                        <div>${btnPagamento}</div>
                    </div>`;
            });

            // 3. CHAT SELECT
            const selectChat = document.getElementById('seletor-chat-afiliado');
            selectChat.innerHTML = '<option value="">Selecione uma parceira...</option>';
            d.chatLista.forEach(afi => {
                selectChat.innerHTML += `<option value="${afi.email}">${afi.nome}</option>`;
            });
        }
    } catch (erro) { console.error("Erro", erro); }
}

async function pagarAfiliado(email, valor, nome) {
    const confirmacao = await Swal.fire({
        title: `Pagar ${nome}?`,
        html: `Confirme se você já realizou o PIX no valor de <b>R$ ${valor.toFixed(2).replace('.', ',')}</b>.<br>Isso vai zerar o painel dela neste mês.`,
        icon: 'warning', background: '#1C1C1E', color: '#FFFFFF', showCancelButton: true,
        confirmButtonColor: '#B76E79', cancelButtonColor: '#555555',
        confirmButtonText: 'Sim, já paguei', cancelButtonText: 'Cancelar'
    });
    if (!confirmacao.isConfirmed) return;

    try {
        const resposta = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ acao: 'pagarAfiliado', emailAfiliado: email, valorPago: valor }) });
        const resultado = await resposta.json();
        if (resultado.status === 'sucesso') {
            await Swal.fire({ title: 'Sucesso! 🌹', text: resultado.mensagem, icon: 'success', background: '#1C1C1E', color: '#FFF', confirmButtonColor: '#B76E79' });
            buscarDadosAdminAfiliados();
        } else { alert("Erro: " + resultado.mensagem); }
    } catch (e) { alert("Erro de conexão."); }
}

async function carregarChatAfiliadoSelecionado() {
    const emailSelecionado = document.getElementById('seletor-chat-afiliado').value;
    const divChat = document.getElementById('historico-chat-admin-afiliado');
    const areaInput = document.getElementById('area-input-afiliado');

    if (!emailSelecionado) { divChat.style.display = 'none'; areaInput.style.display = 'none'; return; }
    divChat.style.display = 'block'; areaInput.style.display = 'flex';
    divChat.innerHTML = '<p style="text-align:center;color:#888;">Carregando conversa...</p>';

    try {
        const resp = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ acao: 'buscarChatAdminAfiliado', emailAfiliado: emailSelecionado }) });
        const res = await resp.json();
        if (res.status === 'sucesso') {
            divChat.innerHTML = '';
            if (res.dados.length === 0) divChat.innerHTML = '<p style="text-align:center;color:#888;">Nenhuma mensagem ainda.</p>';
            res.dados.forEach(item => {
                if (item.mensagem) divChat.innerHTML += `<div class="mensagem msg-barbeiro" style="border-left:3px solid var(--cor-destaque);"><p>${item.mensagem}</p></div>`;
                if (item.resposta) divChat.innerHTML += `<div class="mensagem msg-admin"><p>${item.resposta}</p></div>`;
            });
            divChat.scrollTop = divChat.scrollHeight;
        }
    } catch(e) { console.error(e); }
}

async function responderAfiliado() {
    const emailSelecionado = document.getElementById('seletor-chat-afiliado').value;
    const inputMsg = document.getElementById('nova-msg-admin-afiliado');
    const texto = inputMsg.value.trim();
    if (!emailSelecionado || texto === "") return;

    const btn = document.querySelector('#area-input-afiliado button');
    btn.disabled = true; inputMsg.value = '';

    try {
        await fetch(API_URL, { method: 'POST', body: JSON.stringify({ acao: 'responderAfiliadoAdmin', emailAfiliado: emailSelecionado, resposta: texto }) });
        carregarChatAfiliadoSelecionado();
    } catch(e) { alert("Erro ao enviar."); } finally { btn.disabled = false; }
}

function sairDoAdmin() { localStorage.removeItem('adminLogado'); window.location.href = 'admin.html'; }
