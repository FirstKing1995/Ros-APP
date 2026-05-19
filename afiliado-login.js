// ==========================================
// ROSÊ APP — afiliado-login.js
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
    if (localStorage.getItem('afiliadoLogado')) {
        window.location.href = 'afiliado-painel.html';
    }
};

document.getElementById('form-login-afiliado').addEventListener('submit', async function(event) {
    event.preventDefault();

    const btn = document.querySelector('.btn-principal');
    const textoOriginal = btn.innerText;
    btn.innerText = 'ACESSANDO...';
    btn.disabled = true;

    const dados = {
        acao: 'loginAfiliado',
        email: document.getElementById('email').value,
        senha: document.getElementById('senha').value
    };

    try {
        const resposta = await fetch(API_URL, { method: 'POST', body: JSON.stringify(dados) });
        const resultado = await resposta.json();

        if (resultado.status === 'sucesso') {
            localStorage.setItem('afiliadoLogado', resultado.dados.email);
            localStorage.setItem('codigoAfiliado', resultado.dados.codigo);
            window.location.href = 'afiliado-painel.html';
        } else {
            alert(resultado.mensagem);
        }
    } catch (erro) {
        alert('Erro de conexão. Verifique sua internet.');
    } finally {
        btn.innerText = textoOriginal;
        btn.disabled = false;
    }
});

// ==========================================
// RECUPERAÇÃO DE SENHA
// ==========================================
async function esqueciMinhaSenha(tipoOrigem) {
    const { value: emailDigitado } = await Swal.fire({
        title: 'Recuperar Senha',
        text: 'Digite o e-mail cadastrado na sua conta:',
        input: 'email',
        inputPlaceholder: 'seu@email.com',
        background: '#1C1C1E', color: '#FFF', confirmButtonColor: '#B76E79',
        showCancelButton: true, cancelButtonColor: '#555',
        cancelButtonText: 'Cancelar', confirmButtonText: 'Enviar Senha',
        customClass: { popup: 'borda-arredondada' }
    });

    if (emailDigitado) {
        Swal.fire({
            title: 'Enviando...', text: 'Buscando sua senha no sistema.',
            background: '#1C1C1E', color: '#FFF', allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        try {
            const resposta = await fetch(API_URL, {
                method: 'POST',
                body: JSON.stringify({ acao: 'recuperarSenha', email: emailDigitado, tipo: tipoOrigem })
            });
            const res = await resposta.json();
            if (res.status === 'sucesso') {
                Swal.fire({ title: 'Enviado! 🌹', text: res.mensagem, icon: 'success', background: '#1C1C1E', color: '#FFF', confirmButtonColor: '#B76E79' });
            } else {
                Swal.fire({ title: 'Ops...', text: res.mensagem, icon: 'error', background: '#1C1C1E', color: '#FFF', confirmButtonColor: '#B76E79' });
            }
        } catch(e) {
            Swal.fire({ title: 'Erro', text: 'Falha na conexão com o servidor.', icon: 'error', background: '#1C1C1E', color: '#FFF', confirmButtonColor: '#B76E79' });
        }
    }
}
