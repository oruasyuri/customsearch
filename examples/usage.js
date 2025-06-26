import { SearchFactory } from '../factories/SearchFactory.js';

// Configurações dos formulários
const userSearchConfig = {
    formName: 'userSearch',
    endpoint: 'https://api.exemplo.com/users',
    searchButtonText: 'Buscar Usuário',
    fields: [
        { name: 'email', placeholder: 'Email do usuário', type: 'email' },
        { name: 'username', placeholder: 'Nome de usuário', type: 'text' },
        { name: 'phone', placeholder: 'Telefone', type: 'tel' },
        { name: 'document', placeholder: 'CPF/CNPJ', type: 'text' }
    ],
    mutuallyExclusiveGroups: [
        ['email', 'username', 'phone', 'document']
    ]
};

const productSearchConfig = {
    formName: 'productSearch',
    endpoint: 'https://api.exemplo.com/products',
    searchButtonText: 'Buscar Produto',
    fields: [
        { name: 'sku', placeholder: 'Código SKU', type: 'text' },
        { name: 'barcode', placeholder: 'Código de barras', type: 'text' },
        { name: 'name', placeholder: 'Nome do produto', type: 'text' },
        { name: 'category', placeholder: 'Categoria', type: 'text' }
    ],
    mutuallyExclusiveGroups: [
        ['sku', 'barcode'],
        ['name', 'category']
    ]
};

const orderSearchConfig = {
    formName: 'orderSearch',
    endpoint: 'https://api.exemplo.com/orders',
    searchButtonText: 'Buscar Pedido',
    fields: [
        { name: 'orderId', placeholder: 'ID do Pedido', type: 'text' },
        { name: 'customerEmail', placeholder: 'Email do Cliente', type: 'email' },
        { name: 'status', placeholder: 'Status', type: 'text' }
    ],
    mutuallyExclusiveGroups: [
        ['orderId', 'customerEmail']
    ]
};

// Armazena as instâncias dos formulários
let searchInstances = {};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando sistema de busca com recarga de página...');
    
    // Verifica se há busca ativa na URL
    const currentURL = new URL(window.location);
    const activeForm = currentURL.searchParams.get('form');
    
    if (activeForm) {
        console.log(`📋 Busca ativa detectada na URL: ${activeForm}`);
        showPageLoadInfo(activeForm);
    }
    
    // Cria múltiplos sistemas de busca
    searchInstances.userSearch = SearchFactory.createSearchSystem(
        userSearchConfig, 
        'user-search-container'
    );
    
    searchInstances.productSearch = SearchFactory.createSearchSystem(
        productSearchConfig, 
        'product-search-container'
    );
    
    searchInstances.orderSearch = SearchFactory.createSearchSystem(
        orderSearchConfig, 
        'order-search-container'
    );
    
    // Event listeners
    setupEventListeners();
    
    // Atualiza indicadores visuais iniciais
    updateFormIndicators();
    
    console.log('✅ Sistema de busca inicializado com sucesso!');
});

function setupEventListeners() {
    // Escuta resultados das buscas (automáticas após reload)
    document.addEventListener('searchCompleted', (event) => {
        const { formName, results, searchParams, isAutomatic } = event.detail;
        
        if (isAutomatic) {
            console.log(`🔄 Busca automática executada após reload no formulário '${formName}':`, { results, searchParams });
        } else {
            console.log(`🔍 Busca manual concluída no formulário '${formName}':`, { results, searchParams });
        }
        
        displayResults(formName, results, searchParams, isAutomatic);
    });
    
    // Escuta estados de loading
    document.addEventListener('searchLoading', (event) => {
        const { formName, loading } = event.detail;
        console.log(`⏳ Loading ${formName}: ${loading}`);
        
        updateLoadingIndicator(formName, loading);
    });
    
    // Escuta quando a página vai recarregar
    document.addEventListener('pageReloading', (event) => {
        const { formName } = event.detail;
        console.log(`🔄 Página será recarregada devido ao submit do formulário '${formName}'`);
        
        showGlobalReloadingState();
    });
    
    // Escuta erros de busca
    document.addEventListener('searchError', (event) => {
        const { formName, error } = event.detail;
        console.error(`❌ Erro na busca do formulário '${formName}':`, error);
    });
}

function showPageLoadInfo(activeForm) {
    const infoElement = document.getElementById('page-load-info');
    if (infoElement) {
        infoElement.innerHTML = `
            <div class="alert alert-info">
                <strong>🔄 Página recarregada!</strong> 
                Executando busca automática do formulário <strong>${activeForm}</strong> 
                com base nos parâmetros da URL.
            </div>
        `;
        infoElement.style.display = 'block';
        
        // Remove a mensagem após alguns segundos
        setTimeout(() => {
            infoElement.style.display = 'none';
        }, 4000);
    }
}

function updateFormIndicators() {
    const currentURL = new URL(window.location);
    const activeForm = currentURL.searchParams.get('form');
    
    // Atualiza indicadores visuais
    Object.keys(searchInstances).forEach(formName => {
        const isActive = activeForm === formName;
        const container = document.querySelector(`#${formName.replace('Search', '')}-search-container`).parentElement;
        
        if (isActive) {
            container.classList.add('active-form');
            container.classList.remove('inactive-form');
        } else {
            container.classList.remove('active-form');
            container.classList.add('inactive-form');
        }
    });
    
    // Atualiza display da URL
    updateURLDisplay();
}

function updateLoadingIndicator(formName, loading) {
    const section = document.querySelector(`#${formName.replace('Search', '')}-section`);
    if (section) {
        if (loading) {
            section.classList.add('loading');
        } else {
            section.classList.remove('loading');
        }
    }
}

function showGlobalReloadingState() {
    const overlay = document.createElement('div');
    overlay.className = 'global-loading-overlay';
    overlay.innerHTML = `
        <div class="global-loading-content">
            <div class="global-loading-spinner"></div>
            <h3>Atualizando página...</h3>
            <p>Preparando resultados da busca</p>
        </div>
    `;
    
    document.body.appendChild(overlay);
}

function displayResults(formName, results, searchParams, isAutomatic) {
    const resultsContainer = document.getElementById(`${formName.replace('Search', '')}-results`);
    if (resultsContainer) {
        const formDisplayName = formName.replace('Search', '');
        const searchType = isAutomatic ? 'Automática (da URL)' : 'Manual';
        
        resultsContainer.innerHTML = `
            <h3>✅ Resultados da Busca de ${formDisplayName.charAt(0).toUpperCase() + formDisplayName.slice(1)}</h3>
            <div class="results-meta">
                <div class="search-info">
                    <span class="badge ${isAutomatic ? 'badge-info' : 'badge-success'}">
                        Busca ${searchType}
                    </span>
                    <small>📋 Total de resultados: ${Array.isArray(results) ? results.length : 'N/A'}</small>
                </div>
                <div class="search-params">
                    <strong>Parâmetros utilizados:</strong>
                    ${Object.entries(searchParams).map(([key, value]) => `<span class="param-tag">${key}: ${value}</span>`).join(' ')}
                </div>
            </div>
            <pre class="results-data">${JSON.stringify(results, null, 2)}</pre>
        `;
        resultsContainer.style.display = 'block';
        
        // Rola suavemente para os resultados
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function updateURLDisplay() {
    const urlElement = document.getElementById('current-url');
    if (urlElement) {
        urlElement.textContent = window.location.href;
    }
    
    const activeFormElement = document.getElementById('active-form');
    if (activeFormElement) {
        const currentURL = new URL(window.location);
        const activeForm = currentURL.searchParams.get('form');
        activeFormElement.textContent = activeForm || 'Nenhum';
    }
}

// Funções utilitárias públicas
window.searchUtils = {
    getActiveForm: () => {
        const currentURL = new URL(window.location);
        return currentURL.searchParams.get('form');
    },
    
    isFormActive: (formName) => {
        return window.searchUtils.getActiveForm() === formName;
    },
    
    getCurrentSearchParams: () => {
        const currentURL = new URL(window.location);
        const params = {};
        for (const [key, value] of currentURL.searchParams.entries()) {
            if (key !== 'form') {
                params[key] = value;
            }
        }
        return params;
    },
    
    reloadPage: () => {
        window.location.reload();
    }
};