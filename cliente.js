// ==========================================
// ROSÊ APP — cliente.js (Tela inicial da cliente)
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
    const params     = new URLSearchParams(window.location.search);
    const codigoSalao = params.get('b');

    if (codigoSalao) {
        try {
            const emailSalao = atob(codigoSalao);
            sessionStorage.setItem('barbeariaVisitada', emailSalao);
            buscarNomeDoSalao(emailSalao);
        } catch (e) {
            alert("Erro: Link de agendamento inválido.");
            document.getElementById('nome-barbearia-cliente').innerText = "Link Inválido";
        }
    } else {
        alert("Erro: Este link não pertence a nenhum salão cadastrado.");
        document.getElementById('nome-barbearia-cliente').innerText = "Salão não encontrado";
    }
};

async function buscarNomeDoSalao(email) {
    try {
        const resp = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ acao: 'buscarPerfil', email: email })
        });
        const res = await resp.json();

        if (res.status === 'sucesso') {
            document.getElementById('nome-barbearia-cliente').innerText = res.dados.nome;
            sessionStorage.setItem('whatsappBarbearia', res.dados.whatsapp);

            // Se o salão tiver logo, substitui a bolinha pela imagem
            if (res.dados.logo) {
                const areaLogo = document.getElementById('logo-cliente-tela');
                areaLogo.outerHTML = `
                    <img src="${res.dados.logo}"
                         style="width:80px; height:80px; border-radius:50%; object-fit:cover; margin:0 auto 18px auto; display:block; border:3px solid var(--cor-destaque); box-shadow: 0 4px 15px rgba(183,110,121,0.3);">`;
            }
        } else {
            document.getElementById('nome-barbearia-cliente').innerText = "Salão não encontrado";
        }
    } catch (e) {
        console.error("Erro ao buscar salão:", e);
        document.getElementById('nome-barbearia-cliente').innerText = "Erro de conexão";
    }
}

function irParaAgendamento() { window.location.href = 'agendar.html'; }
function irParaConsulta()    { window.location.href = 'consultar.html'; }
