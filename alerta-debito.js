/**
 * Módulo de Alertas de Débito
 * Verifica e exibe alertas para clientes com saldo negativo
 */

// Elementos do DOM para os alertas
const elementosAlerta = {
  overlayAlerta: document.createElement('div'),
  popupAlerta: document.createElement('div'),
  tituloAlerta: document.createElement('div'),
  conteudoAlerta: document.createElement('div'),
  botoesAlerta: document.createElement('div'),
  btnConfirmar: document.createElement('button')
};

// Configurações do alerta
const configAlerta = {
  whatsappAtendimento: '556235243410', // Número do WhatsApp do Aterro Sanitário
  iconeAlerta: '<i class="fas fa-exclamation-triangle text-yellow-500 text-3xl mb-3"></i>',
  iconeAviso: '<i class="fas fa-bell text-blue-500 text-3xl mb-3"></i>'
};

/**
 * Inicializa os elementos de alerta no DOM
 */
function inicializarAlertasDebito() {
  // Estilizar o overlay (fundo escuro)
  Object.assign(elementosAlerta.overlayAlerta.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'none',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: '1000'
  });
  elementosAlerta.overlayAlerta.className = 'alerta-debito-overlay';
  
  // Estilizar o popup
  elementosAlerta.popupAlerta.className = 'max-w-md w-full bg-white rounded-xl shadow-2xl overflow-hidden border-t-4 border-yellow-500 mx-4';
  
  // Botão de confirmar
  elementosAlerta.btnConfirmar.className = 'green-button text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2';
  elementosAlerta.btnConfirmar.innerHTML = '<i class="fas fa-check-circle mr-2"></i> Estou Ciente';
  
  // Adicionar ao DOM
  elementosAlerta.botoesAlerta.appendChild(elementosAlerta.btnConfirmar);
  elementosAlerta.popupAlerta.appendChild(elementosAlerta.tituloAlerta);
  elementosAlerta.popupAlerta.appendChild(elementosAlerta.conteudoAlerta);
  elementosAlerta.popupAlerta.appendChild(elementosAlerta.botoesAlerta);
  elementosAlerta.overlayAlerta.appendChild(elementosAlerta.popupAlerta);
  document.body.appendChild(elementosAlerta.overlayAlerta);
}

/**
 * Verifica se há débitos e exibe os alertas correspondentes
 * @param {Array} dados - Os dados do cliente
 */
function verificarDebitos(dados) {
  if (!dados || dados.length === 0) return;
  
  // Calcular saldos para verificar se existe débito
  let saldoCacamba = 0;
  let saldoTonelada = 0;
  let temBoletoNegativo = false;
  let boletoNegativo = null;
  
  // Percorrer os dados para calcular saldos e verificar boletos negativos
  dados.forEach(item => {
    const valorSaldo = parseFloat(String(item.saldo).replace(',', '.'));
    
    if (!isNaN(valorSaldo)) {
      if (item.tipo?.toUpperCase().includes('CAÇAMBA')) {
        saldoCacamba += valorSaldo;
      } else if (item.tipo?.toUpperCase().includes('TONELADA')) {
        saldoTonelada += valorSaldo;
      }
      
      // Verificar se o boleto individual tem saldo negativo
      if (valorSaldo < 0 && (!boletoNegativo || valorSaldo < parseFloat(String(boletoNegativo.saldo).replace(',', '.')))) {
        temBoletoNegativo = true;
        boletoNegativo = item;
      }
    }
  });
  
  // Obter o nome do cliente a partir dos dados
  const nomeCliente = elements.clienteNome.textContent.replace('Cliente: ', '').trim();
  
  // Verificar se o saldo total está negativo
  if (saldoCacamba < 0 || saldoTonelada < 0) {
    // Situação 1: Saldo total negativo
    mostrarAlertaDebito({
      tipo: 'saldoNegativo',
      cliente: nomeCliente,
      saldoCacamba,
      saldoTonelada
    });
  } 
  // Senão, verificar se tem algum boleto com saldo negativo
  else if (temBoletoNegativo && boletoNegativo) {
    // Situação 2: Boleto específico com saldo negativo
    mostrarAlertaDebito({
      tipo: 'boletoNegativo',
      cliente: nomeCliente,
      boleto: boletoNegativo
    });
  }
}

/**
 * Exibe o alerta de débito correspondente à situação
 * @param {Object} info - Informações para o alerta
 */
function mostrarAlertaDebito(info) {
  // Configurar o título, conteúdo e botões de acordo com o tipo de alerta
  if (info.tipo === 'saldoNegativo') {
    // Título do alerta
    elementosAlerta.tituloAlerta.className = 'bg-yellow-100 text-yellow-800 p-5 border-b border-yellow-200';
    elementosAlerta.tituloAlerta.innerHTML = `
      <div class="flex items-start">
        ${configAlerta.iconeAlerta}
        <div class="ml-3">
          <h3 class="text-lg font-bold">Atenção ${info.cliente}</h3>
        </div>
      </div>
    `;
    
    // Conteúdo do alerta
    elementosAlerta.conteudoAlerta.className = 'p-5 text-gray-700';
    elementosAlerta.conteudoAlerta.innerHTML = `
      <p class="mb-3">Identificamos saldo negativo em seu cadastro.</p>
      <p class="mb-3">Por favor, regularize seu(s) débito(s) para continuar realizando descartes de resíduos no Aterro Sanitário de Goiânia.</p>
      <p class="mb-3">📞 Mais informações: <span class="font-semibold">WhatsApp ${formatarTelefone(configAlerta.whatsappAtendimento)}</span></p>
    `;
  } else if (info.tipo === 'boletoNegativo') {
    // Formatar o valor negativo do saldo
    const valorNegativo = parseFloat(String(info.boleto.saldo).replace(',', '.'));
    const valorFormatado = Math.abs(valorNegativo).toFixed(2).replace('.', ',');
    
    // Título do alerta
    elementosAlerta.tituloAlerta.className = 'bg-blue-100 text-blue-800 p-5 border-b border-blue-200';
    elementosAlerta.tituloAlerta.innerHTML = `
      <div class="flex items-start">
        ${configAlerta.iconeAviso}
        <div class="ml-3">
          <h3 class="text-lg font-bold">Aviso Importante</h3>
        </div>
      </div>
    `;
    
    // Conteúdo do alerta
    elementosAlerta.conteudoAlerta.className = 'p-5 text-gray-700';
    elementosAlerta.conteudoAlerta.innerHTML = `
      <p class="mb-3">Foi identificado um débito pendente vinculado ao boleto Nº ${info.boleto.boleto}</p>
      <p class="mb-2">📌 Tipo: ${info.boleto.tipo}</p>
      <p class="mb-2">📉 Quantidade: -${valorFormatado}</p>
      <p class="mb-3">Este valor será automaticamente compensado assim que houver saldo suficiente.</p>
      <p class="mb-3">📞 Dúvidas ou mais informações:</p>
      <p span class="font-semibold"><i class="fab fa-whatsapp" style="color: #00e061;"></i>  WhatsApp ${formatarTelefone(configAlerta.whatsappAtendimento)}</p>
    `;
  }
  
  // Configurar os botões
  elementosAlerta.botoesAlerta.className = 'p-5 bg-gray-50 border-t border-gray-200 flex justify-end';
  
  // Exibir o overlay e aplicar animação
  elementosAlerta.overlayAlerta.style.display = 'flex';
  setTimeout(() => {
    elementosAlerta.overlayAlerta.style.opacity = '1';
    elementosAlerta.popupAlerta.classList.add('fade-in');
  }, 10);
  
  // Configurar evento do botão de confirmação
  elementosAlerta.btnConfirmar.onclick = () => {
    confirmarCienciaDebito(info);
  };
}

/**
 * Confirma ciência do débito e envia mensagem por WhatsApp
 * @param {Object} info - Informações do alerta
 */
function confirmarCienciaDebito(info) {
  // Criar a mensagem para o WhatsApp
  let mensagem = '';
  
  if (info.tipo === 'saldoNegativo') {
    mensagem = `*CONFIRMAÇÃO DE CIÊNCIA - SALDO NEGATIVO*\n
Cliente: ${info.cliente}
Confirmação: Estou ciente do saldo negativo em minha conta e irei regularizar a situação.
Data/Hora: ${new Date().toLocaleString('pt-BR')}`;
  } else if (info.tipo === 'boletoNegativo') {
    mensagem = `*CONFIRMAÇÃO DE CIÊNCIA - DÉBITO EM BOLETO*\n
Cliente: ${info.cliente}
Boleto: ${info.boleto.boleto}
Tipo: ${info.boleto.tipo}
Saldo: ${info.boleto.saldo}
Confirmação: Estou ciente do débito pendente e que este será compensado automaticamente quando houver saldo disponível.
Data/Hora: ${new Date().toLocaleString('pt-BR')}`;
  }
  
  // Abrir WhatsApp com a mensagem
  if (mensagem) {
    const mensagemCodificada = encodeURIComponent(mensagem);
    const whatsappLink = `https://wa.me/${configAlerta.whatsappAtendimento}?text=${mensagemCodificada}`;
    window.open(whatsappLink, '_blank');
  }
  
  // Fechar o alerta
  fecharAlertaDebito();
}

/**
 * Fecha o alerta de débito
 */
function fecharAlertaDebito() {
  elementosAlerta.overlayAlerta.style.opacity = '0';
  setTimeout(() => {
    elementosAlerta.overlayAlerta.style.display = 'none';
  }, 300);
}

/**
 * Formata um número de telefone para exibição
 * @param {string} telefone - Número de telefone (apenas dígitos)
 * @return {string} - Telefone formatado
 */
function formatarTelefone(telefone) {
  if (!telefone) return '';
  
  // Remover caracteres não numéricos
  let numeros = telefone.replace(/\D/g, '');

  // Remover código do país (55) se existir
  if (numeros.startsWith('55')) {
    numeros = numeros.substring(2);
  }

  // Verifica se tem DDD e número com 8 ou 9 dígitos
  if (numeros.length === 10 || numeros.length === 11) {
    const ddd = numeros.substring(0, 2);
    const parte1 = numeros.length === 10
      ? numeros.substring(2, 6)  // ex: 3524
      : numeros.substring(2, 7); // ex: 93524
    const parte2 = numeros.length === 10
      ? numeros.substring(6)
      : numeros.substring(7);
    
    return `(${ddd}) ${parte1}-${parte2}`;
  }

  return telefone; // Se não corresponder a nenhum padrão
}


// Exportar funções para uso no arquivo principal
window.alertaDebito = {
  inicializar: inicializarAlertasDebito,
  verificar: verificarDebitos
};