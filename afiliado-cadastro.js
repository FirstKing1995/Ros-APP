// ==========================================
// ROSÊ APP — afiliado-cadastro.js
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

document.getElementById('form-cadastro-afiliado').addEventListener('submit', async function(event) {
    event.preventDefault();

    const btn = document.querySelector('.btn-principal');
    const textoOriginal = btn.innerText;
    btn.innerText = 'CADASTRANDO...';
    btn.disabled = true;

    const dados = {
        acao: 'cadastrarAfiliado',
        nome: document.getElementById('nome').value,
        email: document.getElementById('email').value,
        whatsapp: document.getElementById('whatsapp').value,
        senha: document.getElementById('senha').value
    };

    try {
        const resposta = await fetch(API_URL, { method: 'POST', body: JSON.stringify(dados) });
        const resultado = await resposta.json();

        if (resultado.status === 'sucesso') {
            await Swal.fire({
                title: 'Bem-vinda, Parceira! 🌹',
                text: resultado.mensagem,
                icon: 'success',
                background: '#1C1C1E', color: '#FFFFFF', confirmButtonColor: '#B76E79'
            });
            localStorage.setItem('afiliadoLogado', dados.email.trim().toLowerCase());
            localStorage.setItem('codigoAfiliado', resultado.codigo);
            window.location.href = 'afiliado-painel.html';
        } else {
            alert('Aviso: ' + resultado.mensagem);
        }
    } catch (erro) {
        alert('Erro de conexão. Tente novamente.');
    } finally {
        btn.innerText = textoOriginal;
        btn.disabled = false;
    }
});
