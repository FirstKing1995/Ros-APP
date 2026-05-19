// ==========================================
// ROSÊ APP — link.js
// ==========================================
let linkExclusivoGerado = "";

window.alert = function(mensagem) {
    Swal.fire({
        text: mensagem,
        background: '#1C1C1E', color: '#FFFFFF',
        confirmButtonColor: '#B76E79', confirmButtonText: 'ENTENDIDO',
        customClass: { popup: 'borda-arredondada' }
    });
};

window.onload = function() {
    const emailSalao = localStorage.getItem('usuarioLogado');
    if (!emailSalao) { window.location.href = 'index.html'; return; }
    gerarLinkParaCliente(emailSalao);
};

function gerarLinkParaCliente(email) {
    const urlBase          = window.location.origin;
    const codigoSalao      = btoa(email);
    linkExclusivoGerado    = `${urlBase}/cliente.html?b=${codigoSalao}`;
    document.getElementById('texto-link').innerText = linkExclusivoGerado;
}

function copiarLink() {
    navigator.clipboard.writeText(linkExclusivoGerado).then(() => {
        const btn           = document.querySelector('.btn-copiar');
        const textoOriginal = btn.innerHTML;
        btn.innerHTML = `<span class="material-symbols-rounded">check</span> COPIADO!`;
        btn.style.background = '#4CAF50';
        setTimeout(() => {
            btn.innerHTML        = textoOriginal;
            btn.style.background = '';
        }, 2500);
    }).catch(() => {
        alert('Erro ao copiar. Selecione e copie o link manualmente.');
    });
}

function compartilharWhatsApp() {
    const mensagem = `Olá! 🌹 Agende um horário no nosso salão de forma prática e rápida pelo link: ${linkExclusivoGerado}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(mensagem)}`, '_blank');
}
