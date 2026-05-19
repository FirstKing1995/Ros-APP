// ==========================================
// ROSÊ APP — app.js (Login)
// ⚠️ SUBSTITUA pela URL da sua API no Google Apps Script
// ==========================================
const API_URL = 'SUA_URL_DO_GOOGLE_APPS_SCRIPT_AQUI';

// Substitui os alertas feios do navegador por pop-ups elegantes
window.alert = function(mensagem) {
    Swal.fire({
        text: mensagem,
        background: '#1C1C1E',
        color: '#FFFFFF',
        confirmButtonColor: '#B76E79',
        confirmButtonText: 'ENTENDIDO',
        customClass: { popup: 'borda-arredondada' }
    });
};

// Listener do formulário de login
document.getElementById('form-login').addEventListener('submit', async function(event) {
    event.preventDefault();

    const emailDigitado = document.getElementById('email').value;
    const senhaDigitada = document.getElementById('senha').value;

    const btn = document.querySelector('.btn-principal');
    const textoOriginal = btn.innerText;
    btn.innerText = 'ENTRANDO...';
    btn.disabled = true;

    const dados = {
        acao: 'login',
        email: emailDigitado,
        senha: senhaDigitada
    };

    try {
        const resposta = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(dados)
        });
        const resultado = await resposta.json();

        if (resultado.status === 'sucesso') {
            localStorage.setItem('usuarioLogado', emailDigitado);

            const statusApp = resultado.dados.statusAssinatura.toUpperCase();

            // Deixa entrar quem está ATIVO ou CANCELADO (ainda tem dias de acesso)
            if (statusApp === 'ATIVO' || statusApp === 'CANCELADO') {
                window.location.href = 'dashboard.html';
            } else {
                // INATIVO, VENCIDO ou SUSPENSO → tela de pagamento
                window.location.href = 'pagamento.html';
            }
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

// ==========================================
// RECUPERAÇÃO DE SENHA
// ==========================================
async function esqueciMinhaSenha(tipoOrigem) {
    const { value: emailDigitado } = await Swal.fire({
        title: 'Recuperar Senha',
        text: 'Digite o e-mail cadastrado na sua conta:',
        input: 'email',
        inputPlaceholder: 'seu@email.com',
        background: '#1C1C1E',
        color: '#FFF',
        confirmButtonColor: '#B76E79',
        showCancelButton: true,
        cancelButtonColor: '#555',
        cancelButtonText: 'Cancelar',
        confirmButtonText: 'Recuperar Senha',
        customClass: { popup: 'borda-arredondada' }
    });

    if (emailDigitado) {
        Swal.fire({
            title: 'Enviando...',
            text: 'Buscando seus dados no sistema.',
            background: '#1C1C1E', color: '#FFF',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        try {
            const resposta = await fetch(API_URL, {
                method: 'POST',
                body: JSON.stringify({
                    acao: 'recuperarSenha',
                    email: emailDigitado,
                    tipo: tipoOrigem
                })
            });
            const res = await resposta.json();

            if (res.status === 'sucesso') {
                Swal.fire({ title: 'Enviado!', text: res.mensagem, icon: 'success', background: '#1C1C1E', color: '#FFF', confirmButtonColor: '#B76E79' });
            } else {
                Swal.fire({ title: 'Ops...', text: res.mensagem, icon: 'error', background: '#1C1C1E', color: '#FFF', confirmButtonColor: '#B76E79' });
            }
        } catch (e) {
            Swal.fire({ title: 'Erro', text: 'Falha na conexão com o servidor.', icon: 'error', background: '#1C1C1E', color: '#FFF', confirmButtonColor: '#B76E79' });
        }
    }
}
