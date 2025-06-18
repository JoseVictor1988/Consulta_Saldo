// URL do script do Google Apps Script
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyw96xc_i7CB2IL4w47DZ4s2Obn3OdkmK_zSidlkceOpiN51Sv6VS2ww23IqhLV1F1C/exec';

// Função para buscar mensagens da planilha usando JSONP
function buscarMensagens() {
    console.log('Iniciando busca de mensagens...');
    return new Promise((resolve, reject) => {
        // Criar elemento script para JSONP
        const script = document.createElement('script');
        
        // Função de callback para processar os dados
        window.processarMensagens = function(mensagens) {
            console.log('Mensagens recebidas:', mensagens);
            try {
                // Limpar o callback e o script
                delete window.processarMensagens;
                document.body.removeChild(script);
                
                // Basta passar a mensagem diretamente, sem decodificar
                resolve(mensagens);
            } catch (error) {
                console.error('Erro ao processar mensagens:', error);
                reject(error);
            }
        };

        // Adicionar o script ao documento com tratamento de erro
        script.onerror = function() {
            console.error('Erro ao carregar o script');
            reject(new Error('Erro ao carregar o script'));
        };

        script.src = SCRIPT_URL;
        document.body.appendChild(script);
    });
}

// Função para criar o modal de mensagem
function criarModalMensagem(mensagem, nomeCliente) {
    console.log('Criando modal de mensagem...', { mensagem, nomeCliente });
    
    // Criar elementos do modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.id = 'modalMensagem';

    const modalContent = document.createElement('div');
    modalContent.className = 'bg-white rounded-lg shadow-lg w-full max-w-2xl mx-auto flex flex-col max-h-[90vh]';

    // Cabeçalho do modal
    const header = document.createElement('div');
    header.className = 'flex justify-between items-center p-4 border-b sticky top-0 bg-white rounded-t-lg';
    header.innerHTML = `
        <h3 class="text-xl font-bold header-text-gradient flex items-center">
            <i class="fas fa-bell mr-2"></i>Mensagem Importante
        </h3>
        <button id="btnFecharMensagem" class="text-gray-500 hover:text-gray-800 transition-colors">
            <i class="fas fa-times text-xl"></i>
        </button>
    `;

    // Conteúdo da mensagem
    const content = document.createElement('div');
    content.className = 'p-4 text-base leading-relaxed whitespace-pre-line overflow-y-auto flex-grow';
    
    // Personalizar mensagem com o nome do cliente
    let mensagemPersonalizada = mensagem;
    if (mensagem.includes('[NOME]')) {
        mensagemPersonalizada = mensagem.replace(/\[NOME\]/g, nomeCliente);
    } else if (mensagem.includes('Prezado')) {
        mensagemPersonalizada = mensagem.replace(/Prezado,?\s*/i, `Prezado ${nomeCliente},\n`);
    }
    
    console.log('Mensagem personalizada:', mensagemPersonalizada);
    
    // Processar links de WhatsApp e localização
    const mensagemFormatada = processarLinks(mensagemPersonalizada);
    content.innerHTML = mensagemFormatada;

    // Botão de confirmação
    const footer = document.createElement('div');
    footer.className = 'flex justify-end p-4 border-t sticky bottom-0 bg-white rounded-b-lg';
    footer.innerHTML = `
        <button id="btnConfirmarMensagem" class="green-button text-white font-semibold px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center">
            <i class="fas fa-check mr-2"></i> Li e Entendi
        </button>
    `;

    // Montar modal
    modalContent.appendChild(header);
    modalContent.appendChild(content);
    modalContent.appendChild(footer);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Event listeners
    document.getElementById('btnFecharMensagem').addEventListener('click', () => {
        modal.remove();
    });

    document.getElementById('btnConfirmarMensagem').addEventListener('click', () => {
        modal.remove();
    });
}

// Função para processar links na mensagem
function processarLinks(texto) {
    // Processar links de WhatsApp (números de telefone)
    texto = texto.replace(/(\b\d{10,11}\b)/g, (match) => {
        return `<a href="https://wa.me/55${match}" target="_blank" class="text-green-600 hover:text-green-800 font-semibold underline">WhatsApp - 3524-3410</a>`;
    });

    // Processar links de localização (Google Maps - formato curto)
    texto = texto.replace(/(https:\/\/maps\.app\.goo\.gl\/[^\s]+)/g, (match) => {
        return `<a href="${match}" target="_blank" class="text-blue-600 hover:text-blue-800 font-semibold underline">Abrir localização</a>`;
    });

    // Converter quebras de linha
    texto = texto.replace(/\\n/g, '<br>');

    return texto;
}

// Função para marcar mensagem como lida (comentada para uso futuro)
/*
async function marcarMensagemComoLida(mensagemId) {
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'marcarComoLida',
                mensagemId: mensagemId
            })
        });
        
        if (!response.ok) {
            throw new Error('Erro ao marcar mensagem como lida');
        }
        
        console.log('Mensagem marcada como lida com sucesso');
    } catch (error) {
        console.error('Erro ao marcar mensagem como lida:', error);
    }
}
*/

// Função principal para exibir mensagem
async function exibirMensagem() {
    console.log('Função exibirMensagem chamada');
    // Sempre exibe a mensagem, sem verificar leitura
    try {
        const mensagens = await buscarMensagens();
        console.log('Mensagens recebidas na função principal:', mensagens);
        
        if (mensagens && mensagens.length > 0) {
            const mensagem = mensagens[0]; // Primeira mensagem da planilha
            const nomeCliente = document.getElementById('clienteNome').textContent.replace('Cliente: ', '');
            console.log('Nome do cliente:', nomeCliente);
            criarModalMensagem(mensagem, nomeCliente);
        } else {
            console.log('Nenhuma mensagem encontrada');
        }
    } catch (error) {
        console.error('Erro ao buscar mensagens:', error);
    }
}

// Exportar função principal
window.exibirMensagem = exibirMensagem; 