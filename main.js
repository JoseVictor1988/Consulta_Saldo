/**
 * Sistema de Consulta de Saldo
 * Script principal para gerenciar login, consultas e exibição de dados
 */

// Estado global da aplicação
const state = {
  dadosCompletos: [], // Guarda os dados completos vindos da consulta
  isLoading: false    // Controle de carregamento
};

// Elementos do DOM (página HTML)
const elements = {
  form: document.getElementById('formularioLogin'),    // Formulário de login
  usuario: document.getElementById('usuario'),          // Campo de usuário
  senha: document.getElementById('senha'),              // Campo de senha
  btnConsultar: document.getElementById('btnConsultar'),// Botão consultar
  btnNovaConsulta: document.getElementById('btnNovaConsulta'), // Botão nova consulta
  resultadoConsulta: document.getElementById('resultadoConsulta'), // Área de resultado
  clienteNome: document.getElementById('clienteNome'),  // Nome do cliente
  clienteUsuario: document.getElementById('clienteUsuario'), // Usuário do cliente
  dataGeracao: document.getElementById('dataGeracao'),  // Data de geração do relatório
  saldoCacamba: document.getElementById('saldoCacamba'),// Saldo de caçambas
  saldoTonelada: document.getElementById('saldoTonelada'),// Saldo de toneladas
  tabelaResultados: document.getElementById('tabelaResultados'), // Tabela de resultados
  loadingOverlay: document.getElementById('loadingOverlay') // Tela de carregamento
};

// Inicializar eventos ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
  inicializarEventos();
});

// Função para inicializar os eventos
function inicializarEventos() {
  elements.btnConsultar.addEventListener('click', consultarSaldo);
  elements.btnNovaConsulta.addEventListener('click', novaConsulta);

  // Permitir consulta pressionando Enter no campo de senha
  elements.senha.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      consultarSaldo();
    }
  });
}

/**
 * Função principal para consultar o saldo
 */
function consultarSaldo() {
  const usuario = elements.usuario.value.trim();
  const senha = elements.senha.value.trim();

  // Validação simples de preenchimento
  if (!usuario || !senha) {
    mostrarMensagem('Por favor, preencha todos os campos!', 'error');
    return;
  }

  iniciarCarregamento();

  try {
    const script = document.createElement('script');

    // URL da API (modifique aqui se mudar seu script do Google)
    const url = 'https://script.google.com/macros/s/AKfycbwJ3YecbjccaGNuhaeBypN3xVFybZTaXy-hkXiMOgK8OoM9N1EX2t3qoVUWf1vjCGe5/exec';

    // Adiciona parâmetros de consulta
    script.src = `${url}?usuario=${encodeURIComponent(usuario)}&senha=${encodeURIComponent(senha)}&callback=processarResposta`;
    document.body.appendChild(script);

  } catch (error) {
    finalizarCarregamento();
    mostrarMensagem('Erro ao realizar consulta: ' + error.message, 'error');
  }
}

/**
 * Processa a resposta da API
 */
function processarResposta(resultado) {
  try {
    // Remove scripts antigos para evitar duplicações
    document.querySelectorAll('script[src*="script.google.com"]').forEach(el => el.remove());

    if (!resultado.success) {
      throw new Error(resultado.error || 'Credenciais inválidas ou erro na consulta');
    }

    // Atualiza estado com dados recebidos
    state.dadosCompletos = resultado.data;

    // Esconde o formulário e exibe a área de resultados
    elements.form.classList.add('hidden');
    elements.resultadoConsulta.classList.remove('hidden');
    elements.resultadoConsulta.classList.add('fade-in');

    // Atualiza informações do cliente
    const cliente = state.dadosCompletos[0];
    elements.clienteNome.textContent = `Cliente: ${cliente.cliente || '-'}`;
    elements.clienteUsuario.textContent = `Usuário: ${cliente.usuario || '-'}`;

    // Atualiza data de geração
    const dataAtual = new Date();
    const options = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    elements.dataGeracao.textContent = `• Gerado em ${dataAtual.toLocaleDateString('pt-BR', options)}`;

    calcularSaldos(state.dadosCompletos); // Calcula saldo
    exibirResultados(state.dadosCompletos); // Exibe na tabela

    finalizarCarregamento();

  } catch (error) {
    finalizarCarregamento();
    mostrarMensagem(error.message, 'error');
  }
}

/**
 * Calcula saldos de caçambas e toneladas
 */
function calcularSaldos(dados) {
  let saldoCacamba = 0;
  let saldoTonelada = 0;

  dados.forEach(item => {
    const valorSaldo = parseFloat(String(item.saldo).replace(',', '.'));

    if (!isNaN(valorSaldo)) {
      if (item.tipo?.toUpperCase().includes('CAÇAMBA')) {
        saldoCacamba += valorSaldo;
      } else if (item.tipo?.toUpperCase().includes('TONELADA')) {
        saldoTonelada += valorSaldo;
      }
    }
  });

  elements.saldoCacamba.textContent = formatarValor(saldoCacamba);
  elements.saldoTonelada.textContent = formatarValor(saldoTonelada);
}

/**
 * Exibe os dados na tabela de resultados
 */
function exibirResultados(dados) {
  if (!dados || dados.length === 0) {
    elements.tabelaResultados.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-6 text-gray-500">
          <i class="fas fa-info-circle mr-2"></i> Nenhum resultado encontrado
        </td>
      </tr>
    `;
    return;
  }

  // Ordena por data de emissão (mais recentes primeiro)
  const dadosOrdenados = [...dados].sort((a, b) => {
    const dataA = converterParaData(a.dataEmissao);
    const dataB = converterParaData(b.dataEmissao);
    return dataB - dataA;
  });

  elements.tabelaResultados.innerHTML = dadosOrdenados.map(item => {
    const tipoClass = item.tipo?.toUpperCase().includes('CAÇAMBA')
      ? 'text-green-700'
      : item.tipo?.toUpperCase().includes('TONELADA')
        ? 'text-orange-600'
        : '';

    const statusUpper = (item.status || '').toUpperCase();
    const statusClass = statusUpper === 'LIQUIDADO'
      ? 'text-green-600 font-semibold'
      : statusUpper === 'EM ABERTO'
        ? 'text-red-600 font-semibold'
        : 'text-gray-600';

    const statusIcon = statusUpper === 'LIQUIDADO'
      ? '<i class="fas fa-check-circle mr-1 text-green-600"></i>'
      : statusUpper === 'EM ABERTO'
        ? '<i class="fas fa-exclamation-circle mr-1 text-red-600"></i>'
        : '';

    const tipoIcon = item.tipo?.toUpperCase().includes('CAÇAMBA')
      ? '<i class="fas fa-dumpster mr-1"></i>'
      : item.tipo?.toUpperCase().includes('TONELADA')
        ? '<i class="fas fa-weight mr-1"></i>'
        : '';

    return `
      <tr class="border-b hover:bg-gray-50 transition-colors">
        <td class="px-4 py-3 font-medium text-blue-700">${item.boleto || '-'}</td>
        <td class="px-4 py-3 ${statusClass}">${statusIcon}${item.status || '-'}</td>
        <td class="px-4 py-3">${formatarData(item.dataEmissao) || '-'}</td>
        <td class="px-4 py-3 font-medium">${formatarValor(item.saldo)}</td>
        <td class="px-4 py-3 ${tipoClass}">${tipoIcon}${item.tipo || '-'}</td>
      </tr>
    `;
  }).join('');
}

/**
 * Inicia uma nova consulta
 */
function novaConsulta() {
  elements.form.classList.remove('hidden');
  elements.resultadoConsulta.classList.add('hidden');
  elements.usuario.value = '';
  elements.senha.value = '';
  elements.usuario.focus();
}

/**
 * Exibe uma mensagem de alerta
 */
function mostrarMensagem(mensagem, tipo = 'info') {
  const alertasAntigos = document.querySelectorAll('.alert-message');
  alertasAntigos.forEach(alerta => alerta.remove());

  const estilos = {
    error: 'bg-red-100 text-red-700 border-red-200',
    success: 'bg-green-100 text-green-700 border-green-200',
    info: 'bg-blue-100 text-blue-700 border-blue-200'
  };

  const icones = {
    error: '<i class="fas fa-exclamation-circle mr-2"></i>',
    success: '<i class="fas fa-check-circle mr-2"></i>',
    info: '<i class="fas fa-info-circle mr-2"></i>'
  };

  const alerta = document.createElement('div');
  alerta.className = `alert-message fixed top-4 right-4 p-4 rounded-lg shadow-lg border ${estilos[tipo]} fade-in`;
  alerta.innerHTML = `<div class="flex items-center">${icones[tipo]}<span>${mensagem}</span></div>`;

  document.body.appendChild(alerta);

  setTimeout(() => {
    alerta.style.opacity = '0';
    alerta.style.transition = 'opacity 0.5s ease';
    setTimeout(() => alerta.remove(), 500);
  }, 5000);
}

/**
 * Inicia carregamento (overlay de loading)
 */
function iniciarCarregamento() {
  state.isLoading = true;
  elements.loadingOverlay.classList.remove('hidden');
  elements.btnConsultar.disabled = true;
  elements.btnConsultar.classList.add('btn-loading');
}

/**
 * Finaliza carregamento
 */
function finalizarCarregamento() {
  state.isLoading = false;
  elements.loadingOverlay.classList.add('hidden');
  elements.btnConsultar.disabled = false;
  elements.btnConsultar.classList.remove('btn-loading');
}

/**
 * Formata valor para formato brasileiro
 */
function formatarValor(valor) {
  if (valor === null || valor === undefined) return '-';
  const valorNumerico = typeof valor === 'string' ? parseFloat(valor.replace(',', '.')) : valor;
  if (isNaN(valorNumerico)) return '-';
  return valorNumerico.toFixed(2).replace('.', ',');
}

/**
 * Formata datas para formato brasileiro
 */
function formatarData(data) {
  if (!data) return '-';
  try {
    const dataObj = converterParaData(data);
    if (isNaN(dataObj)) return data;
    return dataObj.toLocaleDateString('pt-BR');
  } catch (e) {
    return data;
  }
}

/**
 * Converte string de data em objeto Date
 */
function converterParaData(dataString) {
  if (!dataString) return new Date(NaN);
  const formatos = [
    (str) => {
      const partes = str.split('/');
      if (partes.length === 3) {
        return new Date(partes[2], partes[1] - 1, partes[0]);
      }
      return null;
    },
    (str) => new Date(str)
  ];
  for (const formatoFn of formatos) {
    const data = formatoFn(dataString);
    if (data && !isNaN(data)) return data;
  }
  return new Date(NaN);
}

// Expor função para JSONP
window.processarResposta = processarResposta;

/**
 * Configurações para solicitação de saldo
 */
const configSolicitacao = {
  // Preços por tipo de serviço
  precos: {
    'RCC-CAÇAMBA': 99.00,  // R$ 99,00 por caçamba
    'RSU-TONELADA': 102.91   // R$ 102,91,00 por tonelada
  },
  // Número de WhatsApp do atendimento (para onde será enviada a solicitação)
  whatsappAtendimento: '5562994114870', // Substitua pelo número real
  // Email de atendimento (alternativa)
  emailAtendimento: 'Sem definição ainda'// Substitua pelo email real
};

/**
 * Elementos do DOM para o formulário de solicitação
 */
const elementosSolicitacao = {
  btnSolicitarSaldo: document.getElementById('btnSolicitarSaldo'),
  modalSolicitacao: document.getElementById('modalSolicitacao'),
  btnFecharModal: document.getElementById('btnFecharModal'),
  btnCancelarSolicitacao: document.getElementById('btnCancelarSolicitacao'),
  formSolicitacao: document.getElementById('formSolicitacao'),
  
  // Campos do formulário
  empresa: document.getElementById('empresa'),
  documento: document.getElementById('documento'),
  whatsapp: document.getElementById('whatsapp'),
  email: document.getElementById('email'),
  tipoSaldo: document.getElementById('tipoSaldo'),
  quantidade: document.getElementById('quantidade'),
  valor: document.getElementById('valor'),
  observacao: document.getElementById('observacao')
};

/**
 * Inicializa eventos para o formulário de solicitação
 */
function inicializarEventosSolicitacao() {
  // Botão para abrir o modal de solicitação
  elementosSolicitacao.btnSolicitarSaldo.addEventListener('click', abrirModalSolicitacao);
  
  // Botões para fechar o modal
  elementosSolicitacao.btnFecharModal.addEventListener('click', fecharModalSolicitacao);
  elementosSolicitacao.btnCancelarSolicitacao.addEventListener('click', fecharModalSolicitacao);
  
  // Cálculo automático do valor quando muda o tipo ou quantidade
  elementosSolicitacao.tipoSaldo.addEventListener('change', calcularValorSolicitacao);
  elementosSolicitacao.quantidade.addEventListener('input', calcularValorSolicitacao);
  
  // Validação de dados no formulário
  elementosSolicitacao.whatsapp.addEventListener('input', formatarWhatsapp);
  elementosSolicitacao.documento.addEventListener('input', formatarDocumento);
  
  // Submit do formulário
  elementosSolicitacao.formSolicitacao.addEventListener('submit', enviarSolicitacao);
}

/**
 * Abre o modal de solicitação e preenche dados conhecidos
 */
function abrirModalSolicitacao() {
  // Preenche o nome da empresa a partir dos dados já carregados
  const nomeCliente = elements.clienteNome.textContent.replace('Cliente: ', '').trim();
  elementosSolicitacao.empresa.value = nomeCliente;
  
  // Limpa outros campos
  elementosSolicitacao.documento.value = '';
  elementosSolicitacao.whatsapp.value = '';
  elementosSolicitacao.email.value = '';
  elementosSolicitacao.tipoSaldo.value = '';
  elementosSolicitacao.quantidade.value = '';
  elementosSolicitacao.valor.value = '';
  elementosSolicitacao.observacao.value = '';
  
  // Exibe o modal com animação
  elementosSolicitacao.modalSolicitacao.classList.remove('hidden');
  setTimeout(() => {
    elementosSolicitacao.modalSolicitacao.classList.add('modal-open');
  }, 10);
}

/**
 * Fecha o modal de solicitação
 */
function fecharModalSolicitacao() {
  elementosSolicitacao.modalSolicitacao.classList.remove('modal-open');
  setTimeout(() => {
    elementosSolicitacao.modalSolicitacao.classList.add('hidden');
  }, 300);
}

/**
 * Calcula o valor total com base no tipo e quantidade
 */
function calcularValorSolicitacao() {
  const tipo = elementosSolicitacao.tipoSaldo.value;
  const quantidade = parseInt(elementosSolicitacao.quantidade.value) || 0;
  
  if (tipo && quantidade > 0) {
    const valorUnitario = configSolicitacao.precos[tipo] || 0;
    const valorTotal = valorUnitario * quantidade;
    
    elementosSolicitacao.valor.value = `R$ ${valorTotal.toFixed(2).replace('.', ',')}`;
  } else {
    elementosSolicitacao.valor.value = '';
  }
}

/**
 * Formata o número de WhatsApp conforme digitado
 */
function formatarWhatsapp() {
  let valor = elementosSolicitacao.whatsapp.value.replace(/\D/g, '');
  
  if (valor.length > 11) {
    valor = valor.substring(0, 11);
  }
  
  if (valor.length > 2) {
    if (valor.length > 7) {
      valor = `(${valor.substring(0, 2)}) ${valor.substring(2, 7)}-${valor.substring(7)}`;
    } else {
      valor = `(${valor.substring(0, 2)}) ${valor.substring(2)}`;
    }
  }
  
  elementosSolicitacao.whatsapp.value = valor;
}

/**
 * Formata o documento (CPF/CNPJ) conforme digitado
 */
function formatarDocumento() {
  let valor = elementosSolicitacao.documento.value.replace(/\D/g, '');
  
  if (valor.length > 14) {
    valor = valor.substring(0, 14);
  }
  
  // Formatação de CNPJ
  if (valor.length > 11) {
    valor = valor.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  } 
  // Formatação de CPF
  else if (valor.length > 9) {
    valor = valor.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }
  
  elementosSolicitacao.documento.value = valor;
}

/**
 * Envia a solicitação via WhatsApp ou Email
 */
function enviarSolicitacao(event) {
  event.preventDefault();
  
  // Validação básica
  const campos = [
    {campo: elementosSolicitacao.documento, nome: 'CNPJ/CPF'},
    {campo: elementosSolicitacao.whatsapp, nome: 'WhatsApp'},
    {campo: elementosSolicitacao.email, nome: 'E-mail'},
    {campo: elementosSolicitacao.tipoSaldo, nome: 'Tipo de Saldo'},
    {campo: elementosSolicitacao.quantidade, nome: 'Quantidade'}
  ];
  
  for (const {campo, nome} of campos) {
    if (!campo.value.trim()) {
      mostrarMensagem(`Por favor, preencha o campo ${nome}`, 'error');
      campo.focus();
      return;
    }
  }
  
  // Valida formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(elementosSolicitacao.email.value)) {
    mostrarMensagem('Por favor, insira um e-mail válido', 'error');
    elementosSolicitacao.email.focus();
    return;
  }
  
  // Prepara o texto da mensagem
  const mensagem = criarMensagemSolicitacao();
  
  // Envia para WhatsApp (abrir link)
  enviarParaWhatsApp(mensagem);
  
  // Fecha o modal e exibe confirmação
  fecharModalSolicitacao();
  mostrarMensagem('Solicitação enviada com sucesso! Redirecionando para WhatsApp...', 'success');
}

/**
 * Cria a mensagem formatada para WhatsApp/Email
 */
function criarMensagemSolicitacao() {
  const tipoTexto = elementosSolicitacao.tipoSaldo.value;
  const quantidade = elementosSolicitacao.quantidade.value;
  const valorTotal = elementosSolicitacao.valor.value;
  
  return `*NOVA SOLICITAÇÃO DE SALDO*
----------------------------
*Empresa:* ${elementosSolicitacao.empresa.value}
*CNPJ/CPF:* ${elementosSolicitacao.documento.value}
*WhatsApp:* ${elementosSolicitacao.whatsapp.value}
*E-mail:* ${elementosSolicitacao.email.value}
----------------------------
*Detalhes do Pedido:*
*Tipo:* ${tipoTexto}
*Quantidade:* ${quantidade}
*Valor Total:* ${valorTotal}
----------------------------
*Observação:* ${elementosSolicitacao.observacao.value || 'Nenhuma observação.'}
----------------------------
*Gerado em:* ${new Date().toLocaleString('pt-BR')}`;
}

/**
 * Envia a mensagem para o WhatsApp via link
 */
function enviarParaWhatsApp(mensagem) {
  const mensagemCodificada = encodeURIComponent(mensagem);
  const whatsappLink = `https://wa.me/${configSolicitacao.whatsappAtendimento}?text=${mensagemCodificada}`;
  
  // Abre o link do WhatsApp em uma nova janela
  window.open(whatsappLink, '_blank');
}

// Adiciona a inicialização dos eventos de solicitação
document.addEventListener('DOMContentLoaded', () => {
  // Mantém a inicialização de eventos existente e adiciona a nova
  inicializarEventos();
  inicializarEventosSolicitacao();
  
  // Substitui a badge "PROCESSADO" pelo botão (caso o DOM já esteja carregado)
  const statusBadge = document.querySelector('.status-badge');
  if (statusBadge) {
    statusBadge.style.display = 'none';
  }
});