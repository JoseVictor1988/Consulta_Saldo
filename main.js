/**
 * Sistema de Consulta de Saldo
 * Script principal para gerenciar login, consultas e exibição de dados
 */

// Estado global da aplicação
const state = {
  dadosCompletos: [], // Guarda os dados completos vindos da consulta
  isLoading: false,    // Controle de carregamento
  loggedInUser: null, // Novo: Guarda os dados do usuário logado (usuario, cliente)
  logoutTimer: null // Novo: Para o timeout de inatividade
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
  // Novos elementos para Consulta de Descarte
  formularioConsultaBoleto: document.getElementById('formularioConsultaBoleto'),
  inputBoletoConsulta: document.getElementById('inputBoletoConsulta'),
  btnConsultarBoleto: document.getElementById('btnConsultarBoleto'),
  resultadoDescarte: document.getElementById('resultadoDescarte'),
  clienteDescarteNome: document.getElementById('clienteDescarteNome'),
  boletoNumeroDescarte: document.getElementById('boletoNumeroDescarte'),
  dataGeracaoDescarte: document.getElementById('dataGeracaoDescarte'),
  tabelaDescartes: document.getElementById('tabelaDescartes'),
  divBotaoConsultaDescarte: document.getElementById('divBotaoConsultaDescarte'),
  btnAcessarConsultaDescarte: document.getElementById('btnAcessarConsultaDescarte'),
  btnNovaConsultaDescarte: document.getElementById('btnNovaConsultaDescarte'),
  btnSair: document.getElementById('btnSair'), // Novo botão Sair
  btnVoltarConsultaBoleto: document.getElementById('btnVoltarConsultaBoleto') // Novo botão Voltar
};

// Inicializar eventos ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
  inicializarEventos();
});

// CORREÇÃO: Chama a função para inicializar os elementos do alerta de débito
if (window.alertaDebito && typeof window.alertaDebito.inicializar === 'function') {
  window.alertaDebito.inicializar();
} else {
  console.error("Módulo alertaDebito ou função inicializar não encontrados. Verifique se o script alerta-debito-popup.js foi carregado corretamente.");
}

// Função para inicializar os eventos
function inicializarEventos() {
  elements.btnConsultar.addEventListener('click', consultarSaldo);
  // Ação para o botão "Nova Consulta" na tela de saldo (agora apenas reinicia a consulta de saldo sem deslogar)
  if (elements.btnNovaConsulta) {
    elements.btnNovaConsulta.addEventListener('click', reiniciarConsultaSaldo);
  }
  elements.senha.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      consultarSaldo();
    }
  });

  // Novos eventos para a consulta de descarte
  if (elements.btnConsultarBoleto) {
    elements.btnConsultarBoleto.addEventListener('click', () => consultarDescartesPorBoleto());
    elements.inputBoletoConsulta.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        consultarDescartesPorBoleto();
      }
    });
  }

  if (elements.btnAcessarConsultaDescarte) {
    elements.btnAcessarConsultaDescarte.addEventListener('click', mostrarFormularioConsultaBoleto);
  }

  if (elements.btnNovaConsultaDescarte) {
    elements.btnNovaConsultaDescarte.addEventListener('click', novaConsultaDescarte);
  }

  // Novo evento para o botão Sair
  if (elements.btnSair) {
    elements.btnSair.addEventListener('click', logout);
  }

  // Novo evento para o botão Voltar na consulta de boleto
  if (elements.btnVoltarConsultaBoleto) {
    elements.btnVoltarConsultaBoleto.addEventListener('click', retornarAoSaldo);
  }

  // Eventos para detectar inatividade
  document.body.addEventListener('mousemove', resetLogoutTimer);
  document.body.addEventListener('keypress', resetLogoutTimer);
  document.body.addEventListener('click', resetLogoutTimer);

  // NOVO: Verifica se há usuário logado na sessão ao carregar a página
  loginPersistente();
}

/**
 * NOVO: Reinicia a consulta de saldo, mantendo o usuário logado.
 * Limpa os resultados exibidos e retorna para o estado inicial da consulta de saldo.
 */
function reiniciarConsultaSaldo() {
  elements.resultadoConsulta.classList.remove('fade-in'); // Remove fade-in para que reapplique
  elements.formularioConsultaBoleto.classList.add('hidden');
  elements.resultadoDescarte.classList.add('hidden');
  elements.divBotaoConsultaDescarte.classList.remove('hidden'); // Reexibe o botão de consultar descartes
  elements.btnSair.classList.remove('hidden'); // Garante que o botão Sair esteja visível

  // Limpar os dados da tabela de resultados e tentar recarregar se o usuário estiver logado
  elements.tabelaResultados.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-6 text-gray-500">
          <i class="fas fa-info-circle mr-2"></i> Nenhum resultado encontrado. Realize uma nova consulta ou clique em um boleto.
        </td>
      </tr>
  `;
  elements.saldoCacamba.textContent = '-';
  elements.saldoTonelada.textContent = '-';

  // Se o usuário estiver logado, tenta refazer a consulta de saldo
  if (state.loggedInUser) {
    consultarSaldo();
  }

  // Oculta o formulário de login e exibe a área de resultados
  elements.form.classList.add('hidden');
  elements.resultadoConsulta.classList.remove('hidden');
  elements.resultadoConsulta.classList.add('fade-in');

  // Mantém os dados do cliente e a data de geração, se o usuário já estiver logado
  if (state.loggedInUser) {
    elements.clienteNome.textContent = `Cliente: ${state.loggedInUser.cliente || '-'}`;
    elements.clienteUsuario.textContent = `Usuário: ${state.loggedInUser.usuario || '-'}`;
    const dataAtual = new Date();
    const options = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    elements.dataGeracao.textContent = `• Gerado em ${dataAtual.toLocaleDateString('pt-BR', options)}`;
  } else {
      // Caso não esteja logado, o que não deveria acontecer se esta função for chamada
      // após o login, mas como fallback, limpa.
      elements.clienteNome.textContent = `Cliente: -`;
      elements.clienteUsuario.textContent = `Usuário: -`;
      elements.dataGeracao.textContent = `• Gerado em -`;
  }
  resetLogoutTimer(); // Reseta o timer de inatividade
}

/**
 * NOVO: Realiza o logout do usuário.
 */
function logout() {
  sessionStorage.removeItem('loggedInUser');
  state.loggedInUser = null;
  clearTimeout(state.logoutTimer); // Limpa o timer de inatividade
  state.logoutTimer = null;

  elements.form.classList.remove('hidden');
  elements.resultadoConsulta.classList.add('hidden');
  elements.formularioConsultaBoleto.classList.add('hidden');
  elements.resultadoDescarte.classList.add('hidden');
  elements.divBotaoConsultaDescarte.classList.add('hidden');
  elements.btnSair.classList.add('hidden'); // Esconde o botão Sair

  elements.usuario.value = '';
  elements.senha.value = '';
  elements.usuario.focus();

  mostrarMensagem('Sessão encerrada com sucesso!', 'info');
}

/**
 * NOVO: Reseta o temporizador de inatividade.
 */
function resetLogoutTimer() {
  clearTimeout(state.logoutTimer);
  // Define o tempo para 10 minutos (600.000 milissegundos)
  state.logoutTimer = setTimeout(logout, 600000);
}

/**
 * NOVO: Tenta logar o usuário automaticamente se houver dados na sessionStorage.
 */
function loginPersistente() {
  const storedUser = sessionStorage.getItem('loggedInUser');
  if (storedUser) {
    try {
      const userData = JSON.parse(storedUser);
      state.loggedInUser = userData;
      // Assume que se há dados de usuário, ele já está logado
      elements.form.classList.add('hidden');
      elements.resultadoConsulta.classList.remove('hidden');
      elements.resultadoConsulta.classList.add('fade-in');
      elements.btnSair.classList.remove('hidden'); // Mostra o botão Sair
      elements.divBotaoConsultaDescarte.classList.remove('hidden'); // Mostra o botão de consulta de descarte

      // Preenche as informações do cliente na tela de saldo
      elements.clienteNome.textContent = `Cliente: ${state.loggedInUser.cliente || '-'}`;
      elements.clienteUsuario.textContent = `Usuário: ${state.loggedInUser.usuario || '-'}`;
      const dataAtual = new Date();
      const options = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };
      elements.dataGeracao.textContent = `• Gerado em ${dataAtual.toLocaleDateString('pt-BR', options)}`;

      // Inicia o temporizador de inatividade
      resetLogoutTimer();

      // Opcional: Se quiser que ele faça uma nova consulta de saldo automaticamente ao persistir o login
      // consultarSaldo(true); // Passe um flag para indicar que é uma consulta inicial sem credenciais de form

    } catch (e) {
      console.error('Erro ao parsear dados do usuário da sessionStorage:', e);
      sessionStorage.removeItem('loggedInUser'); // Limpa dados corrompidos
      logout();
    }
  } else {
    // Se não há usuário logado, garante que o formulário de login esteja visível
    elements.form.classList.remove('hidden');
    elements.resultadoConsulta.classList.add('hidden');
    elements.formularioConsultaBoleto.classList.add('hidden');
    elements.resultadoDescarte.classList.add('hidden');
    elements.divBotaoConsultaDescarte.classList.add('hidden');
    elements.btnSair.classList.add('hidden');
  }
}

/**
 * Função principal para consultar o saldo
 */
function consultarSaldo() {
  let usuario, senha;

  // Se já tem usuário logado, usa os dados da sessão
  if (state.loggedInUser) {
    usuario = state.loggedInUser.usuario;
    senha = state.loggedInUser.senha; // Assumindo que a senha também pode ser armazenada para reconsultas automáticas.
                                      // CUIDADO: Armazenar senha é sensível. Considere alternativas como tokens.
                                      // Para este exemplo, seguindo a lógica de 'continuar conectado', a manterei.
  } else {
    // Se não está logado, pega do formulário
    usuario = elements.usuario.value.trim();
    senha = elements.senha.value.trim();

    // Validação simples de preenchimento
    if (!usuario || !senha) {
      mostrarMensagem('Por favor, preencha todos os campos!', 'error');
      return;
    }
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
      // Se a consulta falhar, e for uma sessão persistente, deslogar.
      if (state.loggedInUser) {
        logout();
        mostrarMensagem('Sessão expirada ou credenciais inválidas. Por favor, faça login novamente.', 'error');
      } else {
        throw new Error(resultado.error || 'Credenciais inválidas ou erro na consulta');
      }
      return; // Retorna para evitar a execução do restante da função em caso de erro.
    }

    // Se o login for bem-sucedido ou a consulta for de uma sessão persistente
    if (!state.loggedInUser) { // Se ainda não está logado na sessão atual
      // Armazena informações do usuário logado na sessionStorage
      const userData = {
        usuario: resultado.data[0].usuario,
        cliente: resultado.data[0].cliente,
        senha: elements.senha.value.trim() // Armazena a senha para re-consultas. Considerar segurança!
      };
      sessionStorage.setItem('loggedInUser', JSON.stringify(userData));
      state.loggedInUser = userData;
    }

    // Atualiza estado com dados recebidos
    state.dadosCompletos = resultado.data;

    // Esconde o formulário e exibe a área de resultados
    elements.form.classList.add('hidden');
    elements.resultadoConsulta.classList.remove('hidden');
    elements.resultadoConsulta.classList.add('fade-in');
    elements.divBotaoConsultaDescarte.classList.remove('hidden'); // Mostrar o botão para consultar descartes após a consulta de saldo
    elements.btnSair.classList.remove('hidden'); // Mostrar o botão Sair

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

    // Inicia/reseta o timer de inatividade
    resetLogoutTimer();

    // Verificar débitos e exibir alertas se necessário
    setTimeout(() => {
      window.alertaDebito.verificar(state.dadosCompletos);
      // Exibir mensagem do sistema após login bem-sucedido
      console.log('Tentando exibir mensagem do sistema...');
      if (typeof window.exibirMensagem === 'function') {
        console.log('Função exibirMensagem encontrada, chamando...');
        window.exibirMensagem();
      } else {
        console.error('Função exibirMensagem não encontrada!');
      }
    }, 1000); // Aumentei o delay para 1 segundo para garantir que tudo esteja carregado

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

    // Adicionar a classe 'link-boleto' e atributo data-boleto para facilitar a captura do clique
    return `
      <tr class="border-b hover:bg-gray-50 transition-colors">
        <td class="px-4 py-3 font-medium text-blue-700 cursor-pointer link-boleto" data-boleto="${item.boleto || ''}">${item.boleto || '-'}</td>
        <td class="px-4 py-3 ${statusClass}">${statusIcon}${item.status || '-'}</td>
        <td class="px-4 py-3">${formatarData(item.dataEmissao) || '-'}</td>
        <td class="px-4 py-3 font-medium">${formatarValor(item.saldo)}</td>
        <td class="px-4 py-3 ${tipoClass}">${tipoIcon}${item.tipo || '-'}</td>
      </tr>
    `;
  }).join('');

  // Adiciona o event listener aos boletos na tabela de resultados
  elements.tabelaResultados.querySelectorAll('.link-boleto').forEach(link => {
    link.addEventListener('click', (event) => {
      const numeroBoleto = event.currentTarget.dataset.boleto;
      if (numeroBoleto) {
        consultarDescartesPorBoleto(numeroBoleto);
      }
    });
  });
}

/**
 * Mostra o formulário de consulta de boleto e esconde outras seções de conteúdo
 */
function mostrarFormularioConsultaBoleto() {
  elements.form.classList.add('hidden');
  elements.resultadoConsulta.classList.add('hidden');
  elements.resultadoDescarte.classList.add('hidden');
  elements.divBotaoConsultaDescarte.classList.add('hidden'); // Esconder o botão ao mudar de tela
  elements.formularioConsultaBoleto.classList.remove('hidden');
  elements.formularioConsultaBoleto.classList.add('fade-in');
  elements.inputBoletoConsulta.value = '';
  elements.inputBoletoConsulta.focus();
  resetLogoutTimer(); // Reseta o timer de inatividade
}

/**
 * Inicia uma nova consulta de descarte, voltando para o formulário de consulta de boleto
 */
function novaConsultaDescarte() {
  elements.resultadoDescarte.classList.add('hidden');
  elements.formularioConsultaBoleto.classList.remove('hidden');
  elements.formularioConsultaBoleto.classList.add('fade-in');
  elements.inputBoletoConsulta.value = '';
  elements.inputBoletoConsulta.focus();
  resetLogoutTimer(); // Reseta o timer de inatividade
}

/**
 * Função para consultar o histórico de descartes de um boleto específico
 */
function consultarDescartesPorBoleto(numeroBoleto = null) {
  if (!state.loggedInUser) {
    mostrarMensagem('Você precisa estar logado para consultar descartes!', 'error');
    logout(); // Redireciona para o login
    return;
  }

  let boleto = numeroBoleto;
  if (!boleto) {
    boleto = elements.inputBoletoConsulta.value.trim();
  }

  if (!boleto) {
    mostrarMensagem('Por favor, digite o número do boleto!', 'error');
    return;
  }

  iniciarCarregamento();

  try {
    // URL da API para consulta de descartes (VOCÊ PRECISA CONFIGURAR ESTE ENDPOINT!)
    const urlDescartes = `https://script.google.com/macros/s/AKfycbyTnvMqEjymi5A6QMqE-jmKapbx5obSkK34prPlAXL-VURf5ZTXgiIkK1opMUmv1HRn/exec`;

    const script = document.createElement('script');
    script.src = `${urlDescartes}?boleto=${encodeURIComponent(boleto)}&usuario=${encodeURIComponent(state.loggedInUser.usuario)}&callback=processarRespostaDescartes`;
    document.body.appendChild(script);

  } catch (error) {
    finalizarCarregamento();
    mostrarMensagem('Erro ao consultar descartes: ' + error.message, 'error');
  }
  resetLogoutTimer(); // Reseta o timer de inatividade
}

/**
 * Processa a resposta da API de consulta de descartes
 */
function processarRespostaDescartes(resultado) {
  console.log("processarRespostaDescartes: Resultado recebido", resultado); // LOG AQUI
  try {
    document.querySelectorAll('script[src*="script.google.com"]').forEach(el => el.remove());

    if (!resultado.success) {
      console.error("processarRespostaDescartes: Erro no resultado da API", resultado.error); // LOG AQUI
      throw new Error(resultado.error || 'Nenhum descarte encontrado para este boleto ou credenciais inválidas.');
    }

    // Validação de segurança: garantir que o boleto pertence ao cliente logado
    const usuarioLogado = state.loggedInUser.usuario; // Pega do estado da aplicação
    const descartesDoCliente = resultado.data.filter(item => String(item.usuario).trim() === usuarioLogado);
    console.log("processarRespostaDescartes: Dados filtrados por usuário logado", descartesDoCliente); // LOG AQUI

    if (descartesDoCliente.length === 0) {
        mostrarMensagem('Nenhum descarte encontrado para este boleto ou ele não pertence à sua conta.', 'info');
        finalizarCarregamento();
        mostrarFormularioConsultaBoleto();
        return;
    }

    elements.form.classList.add('hidden');
    elements.resultadoConsulta.classList.add('hidden');
    elements.formularioConsultaBoleto.classList.add('hidden');
    elements.divBotaoConsultaDescarte.classList.add('hidden');
    elements.resultadoDescarte.classList.remove('hidden');
    elements.resultadoDescarte.classList.add('fade-in');
    elements.btnSair.classList.remove('hidden'); // Mostra o botão Sair

    // Atualiza informações do descarte
    const primeiroDescarte = descartesDoCliente[0];
    elements.clienteDescarteNome.textContent = `Cliente: ${primeiroDescarte.cliente || '-'}`;
    elements.boletoNumeroDescarte.textContent = `Nº do Boleto: ${primeiroDescarte.boleto || '-'}`;
    const dataAtual = new Date();
    const options = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    elements.dataGeracaoDescarte.textContent = `• Gerado em ${dataAtual.toLocaleDateString('pt-BR', options)}`;

    exibirDescartes(descartesDoCliente);
    console.log("processarRespostaDescartes: Chamando exibirDescartes com", descartesDoCliente); // LOG AQUI

    finalizarCarregamento();
    resetLogoutTimer(); // Reseta o timer de inatividade

  } catch (error) {
    console.error("processarRespostaDescartes: Erro geral", error); // LOG AQUI
    finalizarCarregamento();
    mostrarMensagem(error.message, 'error');
  }
}

/**
 * Exibe os dados de descarte na tabela de resultados
 */
function exibirDescartes(dados) {
  console.log("exibirDescartes: Dados para exibição", dados); // LOG AQUI
  if (!dados || dados.length === 0) {
    console.log("exibirDescartes: Nenhum dado para exibir ou dados vazios."); // LOG AQUI
    elements.tabelaDescartes.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-6 text-gray-500">
          <i class="fas fa-info-circle mr-2"></i> Nenhum descarte encontrado para este boleto.
        </td>
      </tr>
    `;
    return;
  }

  // Ordena por data (mais recentes primeiro)
  const dadosOrdenados = [...dados].sort((a, b) => {
    // Ajuste para combinar data e hora para ordenação precisa
    const dataA = converterParaData(`${String(a.data).split('T')[0]}T${String(a.horario).split('T')[1]}`);
    const dataB = converterParaData(`${String(b.data).split('T')[0]}T${String(b.horario).split('T')[1]}`);
    return dataB - dataA;
  });
  console.log("exibirDescartes: Dados ordenados", dadosOrdenados); // LOG AQUI

  elements.tabelaDescartes.innerHTML = dadosOrdenados.map(item => {
    // LOG do item sendo mapeado para ver a estrutura dos dados
    console.log("exibirDescartes: Mapeando item", item);
    return `
      <tr class="border-b hover:bg-gray-50 transition-colors">
        <td class="px-4 py-3">${formatarData(item.data) || '-'}</td>
        <td class="px-4 py-3">${formatarHora(item.horario) || '-'}</td>
        <td class="px-4 py-3">${item.placa_prefixo || '-'}</td>
        <td class="px-4 py-3">${item.n_mtr || '-'}</td>
        <td class="px-4 py-3 font-medium">${formatarValor(item.descarte)}</td>
      </tr>
    `;
  }).join('');
  console.log("exibirDescartes: HTML da tabela atualizado."); // LOG AQUI
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

/**
 * NOVO: Formata uma string ISO de data/hora (como a de Google Sheets para horas) para exibir apenas a hora.
 */
function formatarHora(isoString) {
  if (!isoString) return '-';
  try {
    const date = new Date(isoString);
    // Assegura que é uma data válida antes de formatar
    if (isNaN(date.getTime())) return '-';

    const options = { hour: '2-digit', minute: '2-digit', hour12: false };
    return date.toLocaleTimeString('pt-BR', options);
  } catch (e) {
    console.error("Erro ao formatar hora: ", e);
    return '-';
  }
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
  whatsappAtendimento: '556235243410', // Substitua pelo número real
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
  elementosSolicitacao.modalSolicitacao.classList.remove('hidden');
  elementosSolicitacao.modalSolicitacao.classList.add('modal-open');
  document.body.style.overflow = 'hidden'; // trava o fundo

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
}

/**
 * Fecha o modal de solicitação
 */
function fecharModalSolicitacao() {
  elementosSolicitacao.modalSolicitacao.classList.add('hidden');
  elementosSolicitacao.modalSolicitacao.classList.remove('modal-open');
  document.body.style.overflow = '';
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
    { campo: elementosSolicitacao.documento, nome: 'CNPJ/CPF' },
    { campo: elementosSolicitacao.whatsapp, nome: 'WhatsApp' },
    { campo: elementosSolicitacao.email, nome: 'E-mail' },
    { campo: elementosSolicitacao.tipoSaldo, nome: 'Tipo de Saldo' },
    { campo: elementosSolicitacao.quantidade, nome: 'Quantidade' }
  ];

  for (const { campo, nome } of campos) {
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

/**
 * NOVO: Retorna à tela de consulta de saldo, mantendo o usuário logado.
 */
function retornarAoSaldo() {
  elements.formularioConsultaBoleto.classList.add('hidden'); // Esconde o formulário de boleto
  elements.resultadoDescarte.classList.add('hidden'); // Esconde o resultado de descarte se estiver visível
  elements.resultadoConsulta.classList.remove('hidden'); // Mostra a tela de saldo
  elements.resultadoConsulta.classList.add('fade-in');
  elements.divBotaoConsultaDescarte.classList.remove('hidden'); // Mostra o botão para consultar descartes
  elements.btnSair.classList.remove('hidden'); // Garante que o botão Sair esteja visível

  // Se houver dados de saldo em cache, exibe-os. Caso contrário, a tela ficará vazia (o que é esperado para uma "nova consulta").
  if (state.dadosCompletos.length > 0) {
      calcularSaldos(state.dadosCompletos);
      exibirResultados(state.dadosCompletos);
  } else if (state.loggedInUser) { // Se está logado mas sem dados, tenta consultar saldo novamente
      consultarSaldo(); // Tenta carregar os dados do saldo novamente
  } else {
      // Caso não haja dados em cache e não esteja logado, reseta a exibição para o estado inicial de "nenhum resultado"
      elements.saldoCacamba.textContent = '-';
      elements.saldoTonelada.textContent = '-';
      elements.tabelaResultados.innerHTML = `
          <tr>
            <td colspan="5" class="text-center py-6 text-gray-500">
              <i class="fas fa-info-circle mr-2"></i> Nenhum resultado encontrado. Realize uma nova consulta ou clique em um boleto.
            </td>
          </tr>
      `;
  }

  resetLogoutTimer(); // Reseta o timer de inatividade
}