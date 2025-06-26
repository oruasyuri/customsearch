import { SearchFactory } from '../factories/SearchFactory.js';

// Configurações simples
const userSearchConfig = {
    formName: 'userSearch', // Nome do formulário: <form name="userSearch">
    endpoint: 'https://api.exemplo.com/users',
    fields: [
        { name: 'email' },    // Campo: <input name="email">
        { name: 'username' }, // Campo: <input name="username">
        { name: 'phone' },    // Campo: <input name="phone">
        { name: 'document' }  // Campo: <input name="document">
    ],
    mutuallyExclusiveGroups: [
        ['email', 'username', 'phone', 'document'] // Apenas um pode estar ativo
    ]
};

const productSearchConfig = {
    formName: 'productSearch',
    endpoint: 'https://api.exemplo.com/products',
    fields: [
        { name: 'sku' },
        { name: 'barcode' },
        { name: 'name' },
        { name: 'category' }
    ],
    mutuallyExclusiveGroups: [
        ['sku', 'barcode'],     // Códigos são exclusivos
        ['name', 'category']    // Descritivos são exclusivos
    ]
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Conectando aos formulários...');
    
    try {
        // Conecta aos formulários usando document.forms
        const userSearch = SearchFactory.connectToForm(userSearchConfig);
        const productSearch = SearchFactory.connectToForm(productSearchConfig);
        
        console.log('✅ Formulários conectados com sucesso!');
        
        // Escuta resultados (opcional - apenas para exibir dados na página)
        document.addEventListener('searchCompleted', (event) => {
            const { formName, results, searchParams, isAutomatic } = event.detail;
            
            if (isAutomatic) {
                console.log(`📊 Exibindo resultados de '${formName}':`, results);
                displayResults(formName, results);
            }
        });
        
    } catch (error) {
        console.error('❌ Erro ao conectar formulários:', error);
        alert(`Erro: ${error.message}`);
    }
});

function displayResults(formName, results) {
    // Encontra container de resultados e exibe
    const container = document.getElementById(`${formName}-results`);
    if (container) {
        container.innerHTML = `
            <h3>Resultados de ${formName}</h3>
            <pre>${JSON.stringify(results, null, 2)}</pre>
        `;
        container.style.display = 'block';
    }
}