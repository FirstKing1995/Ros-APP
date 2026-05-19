// ==========================================
// ROSÊ APP — cadastro.js
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

// Pega o código de afiliado da URL (se vier de um link de indicação)
function pegarRefAfiliado() {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
        try { return atob(ref); } catch (e) { return ""; }
    }
    return "";
}

document.getElementById('form-cadastro').addEventListener('submit', async function(event) {
    event.preventDefault();

    const btn = document.querySelector('.btn-matador');
    const textoOriginal = btn.innerText;
    btn.innerText = 'CRIANDO SUA CONTA...';
    btn.disabled = true;

    const dados = {
        acao: 'cadastrarUsuario',
        nome:       document.getElementById('nome').value,
        email:      document.getElementById('email').value,
        whatsapp:   document.getElementById('whatsapp').value,
        senha:      document.getElementById('senha').value,
        afiliadoRef: pegarRefAfiliado()
    };

    try {
        const resposta = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(dados)
        });
        const resultado = await resposta.json();

        if (resultado.status === 'sucesso') {
            // Faz login automático após o cadastro
            localStorage.setItem('usuarioLogado', dados.email);
            fbq('track', 'CompleteRegistration');

            Swal.fire({
                title: 'Bem-vinda ao Rosê APP! 🌹',
                text: 'Sua conta foi criada. Você tem 7 dias grátis para explorar tudo!',
                icon: 'success',
                background: '#1C1C1E', color: '#FFF',
                confirmButtonColor: '#B76E79',
                confirmButtonText: 'IR PARA O PAINEL'
            }).then(() => {
                window.location.href = 'dashboard.html';
            });
        } else {
            alert(resultado.mensagem);
        }

    } catch (erro) {
        alert('Erro de conexão. Verifique sua internet e tente novamente.');
        console.error(erro);
    } finally {
        btn.innerText = textoOriginal;
        btn.disabled = false;
    }
});
