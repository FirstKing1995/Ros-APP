// ==========================================
// ROSÊ APP — admin-usuarios.js
// ==========================================
const API_URL = 'https://script.google.com/macros/s/AKfycbzzYjT12l48onOPS3yYCA-CwsUsnTBmNWQEHs6YpQSLG7B6tkxvB8d7EPbnJhNa1noS1A/exec';

let todosUsuarios = [];

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
    buscarUsuariosDoSistema();
};

async function buscarUsuariosDoSistema() {
    const listaHTML = document.getElementById('lista-usuarios-admin');
    try {
        const resposta = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ acao: 'buscarUsuariosAdmin' })
        });
        const resultado = await resposta.json();
        if (resultado.status === 'sucesso') {
            todosUsuarios = resultado.dados;
            renderizarUsuarios(todosUsuarios);
        } else {
            listaHTML.innerHTML = `<p style="color:red; text-align:center;">Erro: ${resultado.mensagem}</p>`;
        }
    } catch (erro) {
        listaHTML.innerHTML = '<p style="color:red; text-align:center;">Erro de conexão com o servidor.</p>';
    }
}

function renderizarUsuarios(lista) {
    const container = document.getElementById('lista-usuarios-admin');
    container.innerHTML = '';

    if (lista.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#888; padding:20px;">Nenhum salão encontrado.</p>';
        return;
    }

    lista.forEach(user => {
        const isAtivo = (user.status === "Ativo");
        const classeCartao = isAtivo ? "ativo" : "inativo";
        const classeBadge = isAtivo ? "bg-ativo" : "bg-inativo";
        const textoBadge = isAtivo ? "ATIVA" : "SUSPENSA";

        const isPro = (user.plano === "Plano PRO");
        const badgePlano = isPro
            ? `<span style="background: var(--cor-destaque); color: #fff; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 12px; margin-left: 10px; vertical-align: middle;">🌹 PRO</span>`
            : `<span style="background: #444; color: #FFF; font-size: 10px; font-weight: 600; padding: 3px 8px; border-radius: 12px; margin-left: 10px; vertical-align: middle;">⏳ TESTE</span>`;

        let botoesHTML = isAtivo
            ? `<button class="btn-acao-admin btn-admin-vermelho" onclick="alterarStatus(${user.linha}, 'Inativo')">SUSPENDER ACESSO</button>`
            : `<button class="btn-acao-admin btn-admin-verde" onclick="alterarStatus(${user.linha}, 'Ativo')">ATIVAR / APROVAR</button>`;

        const btnWhatsApp = `
            <button class="btn-acao-admin" style="background-color: #25D366; color: #000; margin-top: 8px; display: flex; align-items: center; justify-content: center; gap: 5px;" onclick="enviarBoasVindasWhatsApp('${user.nome}', '${user.whatsapp}')">
                <span class="material-symbols-rounded">chat</span> BOAS-VINDAS (WHATSAPP)
            </button>`;

        container.innerHTML += `
            <div class="cartao-usuario-admin ${classeCartao}">
                <div class="cabecalho-user-admin">
                    <div>
                        <h3 style="display:flex; align-items:center;">${user.nome} ${badgePlano}</h3>
                        <p>ID: #${user.id} | Cadastro: ${user.dataCadastro}</p>
                    </div>
                    <span class="badge-status-admin ${classeBadge}">${textoBadge}</span>
                </div>
                <div class="dados-user-admin">
                    <p><span class="material-symbols-rounded" style="font-size:16px; color:var(--cor-destaque);">mail</span> ${user.email}</p>
                    <p><span class="material-symbols-rounded" style="font-size:16px; color:#25D366;">call</span> ${user.whatsapp}</p>
                </div>
                <div class="acoes-user-admin" style="display:flex; flex-direction:column;">
                    ${botoesHTML}
                    ${btnWhatsApp}
                </div>
            </div>`;
    });
}

function filtrarUsuarios() {
    const termo = document.getElementById('pesquisa-barbearia').value.toLowerCase();
    const listaFiltrada = todosUsuarios.filter(u =>
        u.nome.toLowerCase().includes(termo) ||
        u.email.toLowerCase().includes(termo)
    );
    renderizarUsuarios(listaFiltrada);
}

async function alterarStatus(linha, novoStatus) {
    const confirmacao = await Swal.fire({
        title: 'Confirmar Ação',
        text: `Deseja mudar o status deste salão para "${novoStatus}"?`,
        icon: 'question', background: '#1C1C1E', color: '#FFFFFF', showCancelButton: true,
        confirmButtonColor: novoStatus === 'Ativo' ? '#4CAF50' : '#FF4D4D',
        cancelButtonColor: '#555',
        confirmButtonText: 'Sim, confirmar', cancelButtonText: 'Cancelar'
    });
    if (!confirmacao.isConfirmed) return;

    try {
        const resposta = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ acao: 'mudarStatusUsuario', linha: linha, novoStatus: novoStatus })
        });
        const resultado = await resposta.json();
        if (resultado.status === 'sucesso') {
            buscarUsuariosDoSistema();
        } else {
            alert("Erro: " + resultado.mensagem);
        }
    } catch (erro) {
        alert("Erro de conexão.");
    }
}

function enviarBoasVindasWhatsApp(nomeDono, numeroWhatsApp) {
    if (!numeroWhatsApp || numeroWhatsApp.trim() === "") {
        alert("Este salão não tem número de WhatsApp cadastrado.");
        return;
    }
    let numeroLimpo = numeroWhatsApp.replace(/\D/g, '');
    if (numeroLimpo.length <= 11) numeroLimpo = '55' + numeroLimpo;

    const mensagem = `Olá, ${nomeDono}! Bem-vinda ao *Rosê APP* 🌹✨\n\nAqui estão seus links de acesso:\n📲 *Acesso ao sistema:* ${window.location.origin}/\n\nQualquer dúvida sobre o uso do app, estou à disposição por aqui!`;
    window.open(`https://api.whatsapp.com/send?phone=${numeroLimpo}&text=${encodeURIComponent(mensagem)}`, '_blank');
}
