// ==========================================
// ROSÊ APP — barbeiros.js (Gestão de Profissionais)
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

let emailSalaoAtual             = localStorage.getItem('usuarioLogado');
let fotoBase64Atual             = "";
let servicosTemp                = [];
let horariosTemp                = [];
let listaEquipeEmMemoria        = [];

window.onload = function() {
    if (!emailSalaoAtual) { window.location.href = 'index.html'; return; }
    buscarEquipe();
};

function abrirModalNovo() {
    document.getElementById('modal-barbeiro').style.display    = 'flex';
    document.getElementById('form-novo-barbeiro').reset();
    document.getElementById('barbeiro-id').value               = "";
    document.getElementById('preview-foto').style.display      = 'none';
    document.getElementById('titulo-modal').innerText          = "Cadastrar Especialista";
    fotoBase64Atual = "";
    servicosTemp    = [];
    horariosTemp    = [];
    atualizarVisualServicos();
    atualizarVisualHorarios();
}

function fecharModal() {
    document.getElementById('modal-barbeiro').style.display = 'none';
}

// ==========================================
// COMPRESSOR DE IMAGEM (mantém foto pequena para a planilha)
// ==========================================
document.getElementById('barbeiro-foto').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas    = document.createElement('canvas');
            const MAX_SIZE  = 150;
            let width       = img.width;
            let height      = img.height;
            if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } }
            else                { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
            canvas.width  = width;
            canvas.height = height;
            canvas.getContext('2d').drawImage(img, 0, 0, width, height);
            fotoBase64Atual              = canvas.toDataURL('image/jpeg', 0.6);
            const preview                = document.getElementById('preview-foto');
            preview.src                  = fotoBase64Atual;
            preview.style.display        = 'block';
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
});

// ==========================================
// GERENCIAR SERVIÇOS E HORÁRIOS
// ==========================================
function addServico() {
    const nome  = document.getElementById('input-servico-nome').value.trim();
    const valor = document.getElementById('input-servico-valor').value.trim();
    const tempo = document.getElementById('input-servico-tempo').value.trim();
    if (!nome || !valor || !tempo) { alert("Preencha Nome, Valor e Duração do serviço."); return; }
    servicosTemp.push({ nome, valor, tempo });
    atualizarVisualServicos();
    document.getElementById('input-servico-nome').value  = '';
    document.getElementById('input-servico-valor').value = '';
    document.getElementById('input-servico-tempo').value = '';
}

function atualizarVisualServicos() {
    document.getElementById('lista-servicos-adicionados').innerHTML = servicosTemp.map((s, i) => `
        <div style="display:flex; justify-content:space-between; background:var(--cor-rose-claro); padding:8px 12px; border-radius:8px; margin-bottom:5px;">
            <span style="font-size:13px;">✨ ${s.nome} | R$${s.valor} | ⏳${s.tempo}</span>
            <span style="color:#FF6B6B; cursor:pointer; font-weight:700;" onclick="removerServico(${i})">✕</span>
        </div>`).join('');
}

function removerServico(i) { servicosTemp.splice(i, 1); atualizarVisualServicos(); }

function addHorario() {
    const dia    = document.getElementById('input-horario-dia').value;
    const inicio = document.getElementById('input-horario-inicio').value;
    const fim    = document.getElementById('input-horario-fim').value;
    if (!inicio || !fim) { alert("Preencha o horário de Início e Fim."); return; }
    horariosTemp.push({ dia, inicio, fim });
    atualizarVisualHorarios();
    document.getElementById('input-horario-inicio').value = '';
    document.getElementById('input-horario-fim').value    = '';
}

function atualizarVisualHorarios() {
    document.getElementById('lista-horarios-adicionados').innerHTML = horariosTemp.map((h, i) => `
        <div style="display:flex; justify-content:space-between; background:var(--cor-rose-claro); padding:8px 12px; border-radius:8px; margin-bottom:5px;">
            <span style="font-size:13px;">📅 ${h.dia}: ${h.inicio} → ${h.fim}</span>
            <span style="color:#FF6B6B; cursor:pointer; font-weight:700;" onclick="removerHorario(${i})">✕</span>
        </div>`).join('');
}

function removerHorario(i) { horariosTemp.splice(i, 1); atualizarVisualHorarios(); }

// ==========================================
// API — BUSCAR EQUIPE
// ==========================================
async function buscarEquipe() {
    const lista = document.getElementById('lista-equipe');
    lista.innerHTML = '<p style="text-align: center; color: #AAA; padding: 20px;">Buscando especialistas... 🌹</p>';
    try {
        const resp = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ acao: 'buscarBarbeiros', email: emailSalaoAtual })
        });
        const res = await resp.json();
        if (res.status === 'sucesso') renderizarEquipe(res.dados);
        else lista.innerHTML = `<p style="color:#FF6B6B; text-align:center; padding:20px;">Erro: ${res.mensagem}</p>`;
    } catch (e) {
        lista.innerHTML = '<p style="color:#FF6B6B; text-align:center; padding:20px;">Erro de conexão.</p>';
    }
}

function renderizarEquipe(profissionais) {
    const lista = document.getElementById('lista-equipe');
    lista.innerHTML = '';
    listaEquipeEmMemoria = profissionais;

    if (profissionais.length === 0) {
        lista.innerHTML = `
            <div style="text-align:center; padding:40px 20px; background:#FFF; border-radius:var(--borda-raio); border: 1px solid #F5E8EA;">
                <span class="material-symbols-rounded" style="font-size:40px; color:#F5E8EA;">spa</span>
                <p style="color:#AAA; font-size:14px; margin-top:12px;">Nenhuma especialista cadastrada ainda.</p>
                <p style="color:#CCC; font-size:12px;">Clique em "Cadastrar Nova Especialista" para começar!</p>
            </div>`;
        return;
    }

    profissionais.forEach(pro => {
        const imgTag = pro.foto && pro.foto.includes('data:image')
            ? `<img src="${pro.foto}" style="width:52px; height:52px; border-radius:50%; object-fit:cover; border:2px solid var(--cor-destaque);">`
            : `<div style="width:52px; height:52px; border-radius:50%; background:linear-gradient(135deg,#1C1C1E,#3D2B2F); color:var(--cor-destaque); display:flex; justify-content:center; align-items:center; flex-shrink:0;">
                   <span class="material-symbols-rounded">face</span>
               </div>`;

        lista.innerHTML += `
            <div class="cartao-barbeiro">
                <div class="cabecalho-barbeiro">
                    ${imgTag}
                    <div class="info-barbeiro" style="flex:1;">
                        <h3>${pro.nome}</h3>
                        <p>${pro.telefone || "Sem telefone cadastrado"}</p>
                    </div>
                    <div style="display:flex; gap:8px;">
                        <button style="background:none; border:none; color:var(--cor-destaque); cursor:pointer;" onclick="editarProfissional(${pro.id})">
                            <span class="material-symbols-rounded">edit</span>
                        </button>
                        <button style="background:none; border:none; color:#FF6B6B; cursor:pointer;" onclick="excluirProfissional(${pro.id})">
                            <span class="material-symbols-rounded">delete</span>
                        </button>
                    </div>
                </div>
                <button onclick="ativarNotificacoesProfissional('${pro.telefone}')"
                        style="background:#25D366; color:#000; width:100%; display:flex; align-items:center; justify-content:center; gap:6px; border:none; padding:11px; border-radius:var(--borda-raio); font-size:13px; font-weight:700; cursor:pointer;">
                    <span class="material-symbols-rounded" style="font-size:18px;">notifications_active</span>
                    Ativar Alertas neste Celular
                </button>
            </div>`;
    });
}

function editarProfissional(idPro) {
    const pro = listaEquipeEmMemoria.find(p => p.id === idPro);
    if (!pro) return;
    abrirModalNovo();
    document.getElementById('titulo-modal').innerText        = "Editar Especialista";
    document.getElementById('barbeiro-id').value             = pro.id;
    document.getElementById('barbeiro-nome').value           = pro.nome;
    document.getElementById('barbeiro-telefone').value       = pro.telefone || "";
    if (document.getElementById('barbeiro-especialidade')) {
        document.getElementById('barbeiro-especialidade').value = pro.especialidade || "";
    }
    if (pro.foto && pro.foto.includes('data:image')) {
        fotoBase64Atual = pro.foto;
        const preview   = document.getElementById('preview-foto');
        preview.src     = fotoBase64Atual;
        preview.style.display = 'block';
    }
    try { servicosTemp = JSON.parse(pro.servicos || "[]"); } catch (e) { servicosTemp = []; }
    try { horariosTemp = JSON.parse(pro.horarios || "[]"); } catch (e) { horariosTemp = []; }
    atualizarVisualServicos();
    atualizarVisualHorarios();
}

async function excluirProfissional(id) {
    const confirmacao = await Swal.fire({
        title: 'Remover especialista?',
        text: "Todos os dados dela serão apagados. Esta ação não pode ser desfeita.",
        icon: 'warning',
        background: '#1C1C1E', color: '#FFFFFF',
        showCancelButton: true,
        confirmButtonColor: '#FF6B6B', cancelButtonColor: '#555',
        confirmButtonText: 'Sim, remover', cancelButtonText: 'Cancelar'
    });
    if (!confirmacao.isConfirmed) return;
    try {
        const resp = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ acao: 'excluirBarbeiro', email: emailSalaoAtual, id: id })
        });
        const res = await resp.json();
        if (res.status === 'sucesso') buscarEquipe();
        else alert(res.mensagem);
    } catch (e) { alert("Erro ao remover."); }
}

// ==========================================
// SALVAR PROFISSIONAL (NOVO OU EDITADO)
// ==========================================
document.getElementById('form-novo-barbeiro').addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-salvar-form');
    btn.innerText = 'SALVANDO...'; btn.disabled = true;

    if (servicosTemp.length === 0 || horariosTemp.length === 0) {
        alert("Cadastre pelo menos 1 serviço e 1 horário de trabalho para esta profissional.");
        btn.innerText = 'SALVAR'; btn.disabled = false;
        return;
    }

    const dados = {
        acao:      'salvarBarbeiro',
        id:        document.getElementById('barbeiro-id').value,
        email:     emailSalaoAtual,
        nome:      document.getElementById('barbeiro-nome').value,
        telefone:  document.getElementById('barbeiro-telefone').value,
        foto:      fotoBase64Atual,
        servicos:  JSON.stringify(servicosTemp),
        horarios:  JSON.stringify(horariosTemp)
    };

    try {
        const resp = await fetch(API_URL, { method: 'POST', body: JSON.stringify(dados) });
        const res  = await resp.json();
        if (res.status === 'sucesso') {
            fecharModal();
            buscarEquipe();
            Swal.fire({ title: 'Salvo! 🌹', text: 'Especialista cadastrada com sucesso.', icon: 'success', background: '#1C1C1E', color: '#FFF', confirmButtonColor: '#B76E79' });
        } else {
            alert("Erro: " + res.mensagem);
        }
    } catch (e) { alert("Erro de conexão."); }
    finally { btn.innerText = 'SALVAR'; btn.disabled = false; }
});

