// ==========================================
// ROSÊ APP — agendar.js (Fluxo de Agendamento da Cliente)
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

let emailSalaoAtual              = sessionStorage.getItem('barbeariaVisitada');
let clienteAtual                 = null;
let profissionalSelecionado      = null;
let servicosDaProfissional       = [];
let horariosDaProfissional       = [];
let servicosEscolhidos           = [];
let valorTotalCalculado          = 0;
let tempoTotalCalculado          = 0;
let dataSelecionada              = null;
let horarioSelecionado           = null;

window.onload = function() {
    if (!emailSalaoAtual) {
        alert("Erro: Salão não identificado. Acesse novamente pelo link original.");
        window.location.href = 'cliente.html';
    }
};

// ==========================================
// PASSO 1 — IDENTIFICAÇÃO
// ==========================================
function mostrarAreaCadastro() {
    document.getElementById('area-ja-tenho-cadastro').style.display = 'none';
    document.getElementById('area-novo-cadastro').style.display = 'block';
}

function mostrarAreaBusca() {
    document.getElementById('area-novo-cadastro').style.display = 'none';
    document.getElementById('area-ja-tenho-cadastro').style.display = 'block';
}

async function buscarCliente() {
    const whatsapp = document.getElementById('busca-whatsapp').value;
    if (!whatsapp) return;
    const btn = document.getElementById('btn-buscar-cliente');
    btn.innerText = "BUSCANDO..."; btn.disabled = true;
    try {
        const resp = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ acao: 'buscarCliente', emailBarbearia: emailSalaoAtual, whatsapp: whatsapp })
        });
        const res = await resp.json();
        if (res.status === 'sucesso') {
            clienteAtual = res.dados;
            avancarParaEscolherProfissional();
        } else {
            mostrarAreaCadastro();
            document.getElementById('cad-whatsapp').value = whatsapp;
        }
    } catch (e) { alert("Erro de conexão."); }
    finally { btn.innerText = "CONTINUAR"; btn.disabled = false; }
}

document.getElementById('form-cadastro-cliente').addEventListener('submit', async function(event) {
    event.preventDefault();
    const btn = document.getElementById('btn-salvar-cliente');
    btn.innerText = "CADASTRANDO..."; btn.disabled = true;
    const dados = {
        acao: 'cadastrarCliente',
        emailBarbearia: emailSalaoAtual,
        nome:           document.getElementById('cad-nome').value,
        whatsapp:       document.getElementById('cad-whatsapp').value,
        email:          document.getElementById('cad-email').value,
        dataNascimento: document.getElementById('cad-nascimento').value
    };
    try {
        const resp = await fetch(API_URL, { method: 'POST', body: JSON.stringify(dados) });
        const res  = await resp.json();
        if (res.status === 'sucesso') { clienteAtual = res.dados; avancarParaEscolherProfissional(); }
        else alert("Erro: " + res.mensagem);
    } catch (e) { alert("Erro de conexão."); }
    finally { btn.innerText = "CADASTRAR E CONTINUAR"; btn.disabled = false; }
});

// ==========================================
// PASSO 2 — ESCOLHER PROFISSIONAL
// ==========================================
function avancarParaEscolherProfissional() {
    document.getElementById('passo-1-identificacao').style.display = 'none';
    document.getElementById('passo-2-barbeiros').style.display    = 'block';
    document.getElementById('titulo-passo').innerText             = "2. Especialista";
    buscarProfissionaisParaCliente();
}

async function buscarProfissionaisParaCliente() {
    const lista = document.getElementById('lista-barbeiros-cliente');
    lista.innerHTML = '<p style="text-align:center; color:#AAA; padding:20px;">Carregando especialistas... 🌹</p>';
    try {
        const resp = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ acao: 'buscarBarbeiros', email: emailSalaoAtual })
        });
        const res = await resp.json();
        if (res.status === 'sucesso') renderizarProfissionaisCliente(res.dados);
        else lista.innerHTML = '<p style="color:#FF6B6B; text-align:center;">Erro ao carregar equipe.</p>';
    } catch (e) {
        lista.innerHTML = '<p style="color:#FF6B6B; text-align:center;">Erro de conexão.</p>';
    }
}

function renderizarProfissionaisCliente(profissionais) {
    const lista = document.getElementById('lista-barbeiros-cliente');
    lista.innerHTML = '';
    profissionais.forEach(pro => {
        const imgTag = pro.foto && pro.foto.includes('data:image')
            ? `<img src="${pro.foto}" style="width:52px; height:52px; border-radius:50%; object-fit:cover; border:2px solid var(--cor-destaque);">`
            : `<div class="foto-selecao"><span class="material-symbols-rounded">face</span></div>`;

        const svcCod = encodeURIComponent(pro.servicos || "[]");
        const horCod = encodeURIComponent(pro.horarios || "[]");

        lista.innerHTML += `
            <div class="cartao-selecao-barbeiro"
                 onclick="selecionarProfissional(${pro.id}, '${pro.nome}', '${svcCod}', '${horCod}', '${pro.telefone || ""}')">
                ${imgTag}
                <div class="info-selecao">
                    <h3>${pro.nome}</h3>
                    <p>Toque para selecionar</p>
                </div>
                <span class="material-symbols-rounded" style="margin-left:auto; color:var(--cor-destaque);">chevron_right</span>
            </div>`;
    });
}

function selecionarProfissional(id, nome, svcCod, horCod, telefone) {
    profissionalSelecionado = { id, nome, telefone };
    try { servicosDaProfissional = JSON.parse(decodeURIComponent(svcCod)); } catch (e) { servicosDaProfissional = []; }
    try { horariosDaProfissional = JSON.parse(decodeURIComponent(horCod)); } catch (e) { horariosDaProfissional = []; }
    avancarParaEscolherServicos();
}

// ==========================================
// PASSO 3 — SERVIÇOS
// ==========================================
function avancarParaEscolherServicos() {
    document.getElementById('passo-2-barbeiros').style.display = 'none';
    document.getElementById('passo-3-servicos').style.display  = 'block';
    document.getElementById('titulo-passo').innerText          = "3. Serviços";

    const lista = document.getElementById('lista-servicos-cliente');
    lista.innerHTML = '';
    servicosDaProfissional.forEach((svc, i) => {
        const val = parseFloat(svc.valor) || 0;
        const tmp = parseInt(svc.tempo)   || 0;
        lista.innerHTML += `
            <div class="cartao-servico" id="card-srv-${i}"
                 onclick="alternarServico(${i}, '${svc.nome}', ${val}, ${tmp})">
                <div class="info-servico">
                    <h4>${svc.nome}</h4>
                    <p>⏳ ${tmp} min</p>
                </div>
                <div style="display:flex; align-items:center; gap:15px;">
                    <span class="preco-servico">R$ ${val.toFixed(2)}</span>
                    <div class="check-servico"><span class="material-symbols-rounded" style="font-size:16px;">check</span></div>
                </div>
            </div>`;
    });
}

function alternarServico(i, nome, valor, tempo) {
    const card = document.getElementById(`card-srv-${i}`);
    if (card.classList.contains('selecionado')) {
        card.classList.remove('selecionado');
        servicosEscolhidos      = servicosEscolhidos.filter(s => s.nome !== nome);
        valorTotalCalculado    -= valor;
        tempoTotalCalculado    -= tempo;
    } else {
        card.classList.add('selecionado');
        servicosEscolhidos.push({ nome, valor, tempo });
        valorTotalCalculado    += valor;
        tempoTotalCalculado    += tempo;
    }
    atualizarRodapeTotal();
}

function atualizarRodapeTotal() {
    const rodape = document.getElementById('rodape-total');
    if (servicosEscolhidos.length > 0) {
        rodape.style.display = 'flex';
        document.getElementById('valor-total-tela').innerText = `R$ ${valorTotalCalculado.toFixed(2)}`;
        let textoTempo = `${tempoTotalCalculado} min`;
        if (tempoTotalCalculado >= 60) {
            const h = Math.floor(tempoTotalCalculado / 60);
            const m = tempoTotalCalculado % 60;
            textoTempo = m > 0 ? `${h}h ${m} min` : `${h}h`;
        }
        document.getElementById('tempo-total-tela').innerText = `Duração: ${textoTempo}`;
    } else {
        rodape.style.display = 'none';
    }
}

// ==========================================
// PASSO 4 — DATA E HORA
// ==========================================
function avancarParaEscolherDataHora() {
    if (servicosEscolhidos.length === 0) { alert("Selecione pelo menos um serviço."); return; }
    document.getElementById('passo-3-servicos').style.display    = 'none';
    document.getElementById('passo-4-data-hora').style.display   = 'block';
    document.getElementById('titulo-passo').innerText            = "4. Data e Hora";
    document.getElementById('rodape-total').style.display        = 'none';
    const hoje = new Date();
    document.getElementById('data-agendamento').min = `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,'0')}-${String(hoje.getDate()).padStart(2,'0')}`;
}

async function buscarHorariosDisponiveis() {
    dataSelecionada = document.getElementById('data-agendamento').value;
    if (!dataSelecionada) return;

    const areaHorarios = document.getElementById('area-horarios');
    const lista        = document.getElementById('lista-horarios');
    areaHorarios.style.display = 'block';
    lista.innerHTML = '<p style="grid-column:span 4; text-align:center; color:#AAA;">Verificando horários... 🌹</p>';
    document.getElementById('btn-continuar-resumo').style.display = 'none';

    const nomeDia       = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'][new Date(dataSelecionada + 'T12:00:00').getDay()];
    const turnosDeTrabalho = horariosDaProfissional.filter(h => h.dia === nomeDia);

    if (turnosDeTrabalho.length === 0) {
        lista.innerHTML = '<p style="grid-column:span 4; text-align:center; color:#AAA;">Esta profissional não atende neste dia.</p>';
        return;
    }

    const hoje       = new Date();
    const isHoje     = dataSelecionada === `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,'0')}-${String(hoje.getDate()).padStart(2,'0')}`;
    const minutosAtuais = isHoje ? (hoje.getHours() * 60) + hoje.getMinutes() : 0;

    try {
        const resp = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ acao: 'buscarHorariosOcupados', emailBarbearia: emailSalaoAtual, idBarbeiro: profissionalSelecionado.id, data: dataSelecionada })
        });
        const res  = await resp.json();
        const agendamentosDoDia = (res.status === 'sucesso') ? res.dados : [];

        lista.innerHTML = '';
        let achouHorario = false;

        turnosDeTrabalho.forEach(turno => {
            const inicioTurno = converterHoraParaMinutos(turno.inicio);
            const fimTurno    = converterHoraParaMinutos(turno.fim);
            let tempoAtual    = inicioTurno;

            while (tempoAtual < fimTurno) {
                const inicioBotao = tempoAtual;
                const fimBotao    = tempoAtual + tempoTotalCalculado;
                const passaDaHora = fimBotao > fimTurno;
                const conflito    = agendamentosDoDia.some(ag => (inicioBotao < ag.fim) && (fimBotao > ag.inicio));
                const jaPassou    = isHoje && (inicioBotao <= minutosAtuais);
                const horaFmt     = converterMinutosParaHora(inicioBotao);

                if (passaDaHora || conflito || jaPassou) {
                    lista.innerHTML += `<button class="btn-horario" disabled style="opacity:0.45; text-decoration:line-through;">${horaFmt}</button>`;
                } else {
                    lista.innerHTML += `<button class="btn-horario" id="btn-hora-${horaFmt.replace(':','')}" onclick="selecionarHorario('${horaFmt}')">${horaFmt}</button>`;
                    achouHorario = true;
                }
                tempoAtual += 30;
            }
        });

        if (!achouHorario) {
            lista.innerHTML = '<p style="grid-column:span 4; text-align:center; color:#AAA; padding:15px;">Nenhum horário disponível para este dia.</p>';
        }
    } catch (e) {
        lista.innerHTML = '<p style="grid-column:span 4; text-align:center; color:#FF6B6B;">Erro ao verificar agenda.</p>';
    }
}

function converterHoraParaMinutos(h) { const [hr, mn] = h.split(':').map(Number); return (hr * 60) + mn; }
function converterMinutosParaHora(m) { return `${Math.floor(m/60).toString().padStart(2,'0')}:${(m%60).toString().padStart(2,'0')}`; }

function selecionarHorario(hora) {
    horarioSelecionado = hora;
    document.querySelectorAll('.btn-horario').forEach(b => b.classList.remove('selecionado'));
    document.getElementById(`btn-hora-${hora.replace(':','')}`).classList.add('selecionado');
    document.getElementById('btn-continuar-resumo').style.display = 'block';
}

// ==========================================
// PASSO 5 — RESUMO E CONFIRMAÇÃO
// ==========================================
function avancarParaResumo() {
    document.getElementById('passo-4-data-hora').style.display = 'none';
    document.getElementById('passo-5-resumo').style.display    = 'block';
    document.getElementById('titulo-passo').innerText          = "5. Resumo";

    const [ano, mes, dia] = dataSelecionada.split('-');
    document.getElementById('resumo-barbeiro').innerText  = profissionalSelecionado.nome;
    document.getElementById('resumo-data').innerText      = `${dia}/${mes}/${ano}`;
    document.getElementById('resumo-hora').innerText      = horarioSelecionado;
    document.getElementById('resumo-servicos').innerText  = servicosEscolhidos.map(s => s.nome).join(', ');
    document.getElementById('resumo-valor').innerText     = `R$ ${valorTotalCalculado.toFixed(2)}`;
}

async function confirmarAgendamento() {
    const btn = document.getElementById('btn-confirmar-final');
    btn.innerText = "CONFIRMANDO..."; btn.disabled = true;

    let textoTempo = `${tempoTotalCalculado} min`;
    if (tempoTotalCalculado >= 60) {
        const h = Math.floor(tempoTotalCalculado / 60);
        const m = tempoTotalCalculado % 60;
        textoTempo = m > 0 ? `${h}h ${m} min` : `${h}h`;
    }

    const dados = {
        acao:                   'novoAgendamento',
        emailBarbearia:         emailSalaoAtual,
        nomeBarbeiro:           profissionalSelecionado.nome,
        telefoneBarbeiro:       profissionalSelecionado.telefone,
        nomeCliente:            clienteAtual.nome,
        telefoneCliente:        clienteAtual.whatsapp,
        servicos:               servicosEscolhidos.map(s => s.nome).join(', '),
        valorTotal:             valorTotalCalculado.toFixed(2),
        dataAgendamento:        dataSelecionada,
        horario:                horarioSelecionado,
        tempoTotal:             textoTempo,
        dataNascimentoCliente:  clienteAtual.dataNascimento || ""
    };

    try {
        const resp = await fetch(API_URL, { method: 'POST', body: JSON.stringify(dados) });
        const res  = await resp.json();
        if (res.status === 'sucesso') {
            document.getElementById('passo-5-resumo').style.display  = 'none';
            document.getElementById('passo-6-sucesso').style.display = 'block';
            document.getElementById('titulo-passo').innerText        = "✨ Confirmado!";
        } else {
            alert("Erro: " + res.mensagem);
            btn.innerText = "TENTAR NOVAMENTE"; btn.disabled = false;
        }
    } catch (e) {
        alert("Erro de conexão.");
        btn.innerText = "TENTAR NOVAMENTE"; btn.disabled = false;
    }
}

// ==========================================
// PASSO 6 — SUCESSO
// ==========================================
function enviarWhatsAppProfissional() {
    const dataFmt  = dataSelecionada.split('-').reverse().join('/');
    const mensagem = `Olá! 🌹 Acabei de agendar um horário no salão.\n\n👤 Cliente: ${clienteAtual.nome}\n✨ Profissional: ${profissionalSelecionado.nome}\n📅 Data: ${dataFmt} às ${horarioSelecionado}\n💅 Serviços: ${servicosEscolhidos.map(s => s.nome).join(', ')}\n💰 Total: R$ ${valorTotalCalculado.toFixed(2)}`;
    const numero   = (profissionalSelecionado.telefone || sessionStorage.getItem('whatsappBarbearia') || '').replace(/\D/g, '');
    window.open(`https://api.whatsapp.com/send?phone=55${numero}&text=${encodeURIComponent(mensagem)}`, '_blank');
}

function voltarAoInicioCliente() {
    window.location.href = `cliente.html?b=${btoa(emailSalaoAtual)}`;
}
