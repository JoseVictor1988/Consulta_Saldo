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
  loadingOverlay: document.getElementById('loadingOverlay'), // Tela de carregamento

  // Elementos do modal de solicitação
  btnSolicitarSaldo: document.getElementById('btnSolicitarSaldo'),
  modalSolicitacao: document.getElementById('modalSolicitacao'),
  btnFecharModal: document.getElementById('btnFecharModal'),
  btnCancelarSolicitacao: document.getElementById('btnCancelarSolicitacao'),
  formSolicitacao: document.getElementById('formSolicitacao'),

  // Campos do formulário de solicitação
  empresa: document.getElementById('empresa'),
  documento: document.getElementById('documento'),
  whatsapp: document.getElementById('whatsapp'),
  email: document.getElementById('email'),
  tipoSaldo: document.getElementById('tipoSaldo'),
  quantidade: document.getElementById('quantidade'),
  valor: document.getElementById('valor'),
  observacao: document.getElementById('observacao')
};

// Inicializar eventos ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
  inicializarEventos();
  inicializarEventosSolicitacao(); // Inicializa eventos do modal também
});

// Função para inicializar os eventos principais
function inicializarEventos() {
  if (elements.btnConsultar) {
    elements.btnConsultar.addEventListener('click', consultarSaldo);
  }
  if (elements.btnNovaConsulta) {
    elements.btnNovaConsulta.addEventListener('click', novaConsulta);
  }

  // Permitir consulta pressionando Enter no campo de senha
  if (elements.senha) {
    elements.senha.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        consultarSaldo();
      }
    });
  }
}

/**
 * Função principal para consultar o saldo
 */
function consultarSaldo() {
  const usuario = elements.usuario ? elements.usuario.value.trim() : '';
  const senha = elements.senha ? elements.senha.value.trim() : '';

  // Validação simples de preenchimento
  if (!usuario || !senha) {
    mostrarMensagem('Por favor, preencha todos os campos!', 'error');
    return;
  }

  iniciarCarregamento();

  try {
    const script = document.createElement('script');

    // URL da API (modifique aqui se mudar seu script do Google)
    // Certifique-se de que esta URL está correta e acessível
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
window.processarResposta = function(resultado) { // Expor a função globalmente para JSONP
  try {
    // Remove scripts antigos para evitar duplicações
    document.querySelectorAll('script[src*="script.google.com"]').forEach(el => el.remove());

    if (!resultado.success) {
      throw new Error(resultado.error || 'Credenciais inválidas ou erro na consulta');
    }

    // Atualiza estado com dados recebidos
    state.dadosCompletos = resultado.data;

    // Esconde o formulário e exibe a área de resultados
    if (elements.form) elements.form.classList.add('hidden');
    if (elements.resultadoConsulta) {
        elements.resultadoConsulta.classList.remove('hidden');
        elements.resultadoConsulta.classList.add('fade-in');
    }


    // Atualiza informações do cliente
    if (state.dadosCompletos && state.dadosCompletos.length > 0) {
        const cliente = state.dadosCompletos[0];
        if (elements.clienteNome) elements.clienteNome.textContent = `Cliente: ${cliente.cliente || '-'}`;
        if (elements.clienteUsuario) elements.clienteUsuario.textContent = `Usuário: ${cliente.usuario || '-'}`;
        // Preenche o campo empresa no modal com o nome do cliente
        if (elements.empresa) elements.empresa.value = cliente.cliente || '';
    }


    // Atualiza data de geração
    if (elements.dataGeracao) {
        const dataAtual = new Date();
        const options = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };
        elements.dataGeracao.textContent = `• Gerado em ${dataAtual.toLocaleDateString('pt-BR', options)}`;
    }


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

  if (dados && dados.length > 0) {
      dados.forEach(item => {
        // Garante que item.saldo é tratado como string antes de replace
        const valorSaldo = parseFloat(String(item.saldo).replace(',', '.'));

        if (!isNaN(valorSaldo)) {
          if (item.tipo?.toUpperCase().includes('CAÇAMBA')) {
            saldoCacamba += valorSaldo;
          } else if (item.tipo?.toUpperCase().includes('TONELADA')) {
            saldoTonelada += valorSaldo;
          }
        }
      });
  }


  if (elements.saldoCacamba) elements.saldoCacamba.textContent = formatarValor(saldoCacamba);
  if (elements.saldoTonelada) elements.saldoTonelada.textContent = formatarValor(saldoTonelada);
}

/**
 * Exibe os dados na tabela de resultados
 */
function exibirResultados(dados) {
  if (!elements.tabelaResultados) return; // Verifica se o elemento da tabela existe

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
  if (elements.form) elements.form.classList.remove('hidden');
  if (elements.resultadoConsulta) elements.resultadoConsulta.classList.add('hidden');
  if (elements.usuario) elements.usuario.value = '';
  if (elements.senha) elements.senha.value = '';
  if (elements.usuario) elements.usuario.focus();
}

/**
 * Exibe uma mensagem de alerta (Toast)
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
  alerta.className = `alert-message fixed top-4 right-4 p-4 rounded-lg shadow-lg border ${estilos[tipo]} fade-in z-50`; // Adicionado z-index
  alerta.innerHTML = `<div class="flex items-center">${icones[tipo]}<span>${mensagem}</span></div>`;

  document.body.appendChild(alerta);

  setTimeout(() => {
    alerta.style.opacity = '0';
    alerta.style.transition = 'opacity 0.5s ease';
    setTimeout(() => alerta.remove(), 500);
  }, 5000); // Mensagem desaparece após 5 segundos
}

/**
 * Inicia carregamento (overlay de loading)
 */
function iniciarCarregamento() {
  state.isLoading = true;
  if (elements.loadingOverlay) elements.loadingOverlay.classList.remove('hidden');
  if (elements.btnConsultar) {
    elements.btnConsultar.disabled = true;
    elements.btnConsultar.classList.add('btn-loading');
  }
}

/**
 * Finaliza carregamento
 */
function finalizarCarregamento() {
  state.isLoading = false;
  if (elements.loadingOverlay) elements.loadingOverlay.classList.add('hidden');
  if (elements.btnConsultar) {
    elements.btnConsultar.disabled = false;
    elements.btnConsultar.classList.remove('btn-loading');
  }
}

/**
 * Formata valor para formato brasileiro (R$ 0,00)
 */
function formatarValor(valor) {
  if (valor === null || valor === undefined) return '-';
  const valorNumerico = typeof valor === 'string' ? parseFloat(valor.replace(',', '.')) : valor;
  if (isNaN(valorNumerico)) return '-';
  // Formata para moeda brasileira
  return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
  }).format(valorNumerico);
}

/**
 * Formata datas para formato brasileiro (dd/mm/yyyy)
 */
function formatarData(data) {
  if (!data) return '-';
  try {
    const dataObj = converterParaData(data);
    if (isNaN(dataObj.getTime())) return data; // Verifica se a data é válida
    return dataObj.toLocaleDateString('pt-BR');
  } catch (e) {
    console.error("Erro ao formatar data:", e);
    return data; // Retorna a string original em caso de erro
  }
}

/**
 * Converte string de data em objeto Date (tentando diferentes formatos)
 */
function converterParaData(dataString) {
  if (!dataString) return new Date(NaN); // Retorna data inválida se a string for vazia

  // Tenta o formato DD/MM/YYYY
  const partes = dataString.split('/');
  if (partes.length === 3) {
    const dia = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10) - 1; // Mês é baseado em zero
    const ano = parseInt(partes[2], 10);
    const data = new Date(ano, mes, dia);
    // Verifica se a data criada corresponde aos valores originais (evita datas inválidas como 31/02)
    if (data.getDate() === dia && data.getMonth() === mes && data.getFullYear() === ano) {
        return data;
    }
  }

  // Tenta outros formatos que o construtor Date pode entender
  try {
      const data = new Date(dataString);
      if (!isNaN(data.getTime())) {
          return data;
      }
  } catch (e) {
      console.error("Erro ao tentar converter data:", e);
  }


  return new Date(NaN); // Retorna data inválida se nenhum formato funcionar
}


/**
 * Configurações para solicitação de saldo
 */
const configSolicitacao = {
  // Preços por tipo de serviço
  precos: {
    'RCC-CAÇAMBA': 99.00,  // R$ 99,00 por caçamba
    'RSU-TONELADA': 102.91   // R$ 102,91 por tonelada
  },
  // Número de WhatsApp do atendimento (para onde será enviada a solicitação)
  whatsappAtendimento: '556235243410', // Substitua pelo número real
  // Email de atendimento (alternativa) - Não utilizado no envio via WhatsApp, mas mantido
  emailAtendimento: 'Sem definição ainda'// Substitua pelo email real
};

/**
 * Inicializa eventos para o formulário de solicitação
 */
function inicializarEventosSolicitacao() {
  // Botão para abrir o modal de solicitação
  if (elements.btnSolicitarSaldo) {
    elements.btnSolicitarSaldo.addEventListener('click', abrirModalSolicitacao);
  }

  // Botões para fechar o modal
  if (elements.btnFecharModal) {
    elements.btnFecharModal.addEventListener('click', fecharModalSolicitacao);
  }
  if (elements.btnCancelarSolicitacao) {
    elements.btnCancelarSolicitacao.addEventListener('click', fecharModalSolicitacao);
  }

  // Cálculo automático do valor quando muda o tipo ou quantidade
  if (elements.tipoSaldo) {
    elements.tipoSaldo.addEventListener('change', calcularValorSolicitacao);
  }
  if (elements.quantidade) {
    elements.quantidade.addEventListener('input', calcularValorSolicitacao);
  }


  // Validação e formatação de dados no formulário
  if (elements.whatsapp) {
    elements.whatsapp.addEventListener('input', formatarWhatsapp);
  }
  if (elements.documento) {
    elements.documento.addEventListener('input', formatarDocumento);
  }


  // Submit do formulário
  if (elements.formSolicitacao) {
    elements.formSolicitacao.addEventListener('submit', enviarSolicitacao);
  }

  // Fechar modal ao clicar fora dele
  if (elements.modalSolicitacao) {
      elements.modalSolicitacao.addEventListener('click', (event) => {
          // Verifica se o clique foi diretamente no overlay do modal e não dentro do conteúdo
          if (event.target === elements.modalSolicitacao) {
              fecharModalSolicitacao();
          }
      });
  }
}

/**
 * Abre o modal de solicitação e preenche dados conhecidos
 */
function abrirModalSolicitacao() {
  if (!elements.modalSolicitacao) return; // Verifica se o modal existe

  // Preenche o nome da empresa a partir dos dados já carregados
  // Usa o valor atual do campo clienteNome
  const nomeCliente = elements.clienteNome ? elements.clienteNome.textContent.replace('Cliente: ', '').trim() : '';
  if (elements.empresa) elements.empresa.value = nomeCliente;

  // Limpa outros campos
  if (elements.documento) elements.documento.value = '';
  if (elements.whatsapp) elements.whatsapp.value = '';
  if (elements.email) elements.email.value = '';
  if (elements.tipoSaldo) elements.tipoSaldo.value = '';
  if (elements.quantidade) elements.quantidade.value = '';
  if (elements.valor) elements.valor.value = '';
  if (elements.observacao) elements.observacao.value = '';

  // Exibe o modal com animação
  elements.modalSolicitacao.classList.remove('hidden');
  // Pequeno delay para permitir que a classe hidden seja removida antes de adicionar a de animação
  setTimeout(() => {
    elements.modalSolicitacao.classList.add('modal-open');
  }, 10);
}

/**
 * Fecha o modal de solicitação
 */
function fecharModalSolicitacao() {
  if (!elements.modalSolicitacao) return; // Verifica se o modal existe

  elements.modalSolicitacao.classList.remove('modal-open');
  // Delay para permitir que a animação de fechamento ocorra antes de esconder
  setTimeout(() => {
    elements.modalSolicitacao.classList.add('hidden');
  }, 300); // Tempo deve ser igual ou maior que a duração da animação CSS
}

/**
 * Calcula o valor total com base no tipo e quantidade
 */
function calcularValorSolicitacao() {
  if (!elements.tipoSaldo || !elements.quantidade || !elements.valor) return; // Verifica se os elementos existem

  const tipo = elements.tipoSaldo.value;
  const quantidade = parseInt(elements.quantidade.value) || 0;

  if (tipo && quantidade > 0) {
    const valorUnitario = configSolicitacao.precos[tipo] || 0;
    const valorTotal = valorUnitario * quantidade;

    // Formata o valor para moeda brasileira
    elements.valor.value = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(valorTotal);

  } else {
    elements.valor.value = ''; // Limpa o campo se tipo ou quantidade forem inválidos
  }
}

/**
 * Formata o número de WhatsApp conforme digitado (Ex: (62) 99999-9999)
 */
function formatarWhatsapp() {
  if (!elements.whatsapp) return; // Verifica se o elemento existe

  let valor = elements.whatsapp.value.replace(/\D/g, ''); // Remove tudo que não é dígito

  if (valor.length > 11) {
    valor = valor.substring(0, 11); // Limita a 11 dígitos (DDD + 9 dígitos)
  }

  // Aplica a máscara
  if (valor.length > 2) {
    if (valor.length > 7) {
      valor = `(${valor.substring(0, 2)}) ${valor.substring(2, 7)}-${valor.substring(7)}`;
    } else {
      valor = `(${valor.substring(0, 2)}) ${valor.substring(2)}`;
    }
  }

  elements.whatsapp.value = valor;
}

/**
 * Formata o documento (CPF/CNPJ) conforme digitado
 */
function formatarDocumento() {
  if (!elements.documento) return; // Verifica se o elemento existe

  let valor = elements.documento.value.replace(/\D/g, ''); // Remove tudo que não é dígito

  if (valor.length > 14) {
    valor = valor.substring(0, 14); // Limita a 14 dígitos (CNPJ)
  }

  // Formatação de CNPJ (14 dígitos)
  if (valor.length === 14) {
    valor = valor.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }
  // Formatação de CPF (11 dígitos)
  else if (valor.length === 11) {
    valor = valor.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }
  // Se não tem 11 nem 14 dígitos, não aplica máscara completa, apenas remove não-dígitos

  elements.documento.value = valor;
}

/**
 * Envia a solicitação via WhatsApp
 */
function enviarSolicitacao(event) {
  event.preventDefault(); // Impede o envio padrão do formulário

  // Validação básica dos campos obrigatórios
  const campos = [
    {campo: elements.documento, nome: 'CNPJ/CPF'},
    {campo: elements.whatsapp, nome: 'WhatsApp'},
    {campo: elements.email, nome: 'E-mail'},
    {campo: elements.tipoSaldo, nome: 'Tipo de Saldo'},
    {campo: elements.quantidade, nome: 'Quantidade'}
  ];

  for (const {campo, nome} of campos) {
    if (!campo || !campo.value.trim()) { // Verifica se o campo existe e está preenchido
      mostrarMensagem(`Por favor, preencha o campo ${nome}`, 'error');
      if (campo) campo.focus(); // Foca no campo se ele existir
      return;
    }
  }

  // Valida formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (elements.email && !emailRegex.test(elements.email.value)) {
    mostrarMensagem('Por favor, insira um e-mail válido', 'error');
    elements.email.focus();
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
 * Cria a mensagem formatada para WhatsApp
 */
function criarMensagemSolicitacao() {
  // Usa o valor atual dos campos do modal
  const empresa = elements.empresa ? elements.empresa.value : '-';
  const documento = elements.documento ? elements.documento.value : '-';
  const whatsapp = elements.whatsapp ? elements.whatsapp.value : '-';
  const email = elements.email ? elements.email.value : '-';
  const tipoTexto = elements.tipoSaldo ? elements.tipoSaldo.value : '-';
  const quantidade = elements.quantidade ? elements.quantidade.value : '-';
  const valorTotal = elements.valor ? elements.valor.value : '-';
  const observacao = elements.observacao ? elements.observacao.value || 'Nenhuma observação.' : 'Nenhuma observação.';


  return `*NOVA SOLICITAÇÃO DE SALDO*
----------------------------
*Empresa:* ${empresa}
*CNPJ/CPF:* ${documento}
*WhatsApp:* ${whatsapp}
*E-mail:* ${email}
----------------------------
*Detalhes do Pedido:*
*Tipo:* ${tipoTexto}
*Quantidade:* ${quantidade}
*Valor Total:* ${valorTotal}
----------------------------
*Observação:* ${observacao}
----------------------------
*Gerado em:* ${new Date().toLocaleString('pt-BR')}`;
}

/**
 * Envia a mensagem para o WhatsApp via link
 */
function enviarParaWhatsApp(mensagem) {
  const mensagemCodificada = encodeURIComponent(mensagem);
  // Verifica se o número de atendimento está configurado
  if (configSolicitacao.whatsappAtendimento) {
      const whatsappLink = `https://wa.me/${configSolicitacao.whatsappAtendimento}?text=${mensagemCodificada}`;
      // Abre o link do WhatsApp em uma nova janela
      window.open(whatsappLink, '_blank');
  } else {
      mostrarMensagem('Número de WhatsApp para atendimento não configurado.', 'error');
  }
}
