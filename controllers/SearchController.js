/**
 * Controlador principal do sistema de busca
 */
export class SearchController {
    constructor(config, stateManager, searchService, connector) {
        this.config = config;
        this.stateManager = stateManager;
        this.searchService = searchService;
        this.connector = connector;
        
        this.init();
    }
    
    init() {
        const isActiveForm = this.stateManager.isActiveForm(this.config.formName);
        
        let initialState = {};
        if (isActiveForm) {
            initialState = this.stateManager.getState(this.config.formName);
            
            // Se há busca na URL, executa automaticamente
            if (this.hasActiveSearch(initialState)) {
                this.performAutoSearch(initialState);
            }
        }
        
        // Conecta ao formulário
        this.connector.connect(
            this.config,
            this.handleFieldChange.bind(this),
            this.handleSubmit.bind(this),
            initialState
        );
    }
    
    async performAutoSearch(searchParams) {
        try {
            console.log(`[${this.config.formName}] Busca automática:`, searchParams);
            
            const results = await this.searchService.search(this.config.endpoint, searchParams);
            
            console.log(`[${this.config.formName}] Resultados:`, results);
            
            // Dispara evento apenas para busca automática (pode ser útil para exibir resultados)
            this.emitSearchCompleted(results, searchParams, true);
            
        } catch (error) {
            console.error(`[${this.config.formName}] Erro na busca:`, error);
            this.showError(error.message);
        }
    }
    
    handleFieldChange(fieldName, value) {
        if (fieldName === 'clear') {
            this.handleClear();
        }
        // Outros tratamentos apenas internos
    }
    
    handleClear() {
        if (this.stateManager.isActiveForm(this.config.formName)) {
            console.log(`[${this.config.formName}] Limpando e recarregando...`);
            this.stateManager.clearStateAndReload(this.config.formName);
        }
    }
    
    async handleSubmit(searchParams) {
        if (!this.hasActiveSearch(searchParams)) {
            alert('Preencha pelo menos um campo para buscar.');
            return;
        }
        
        console.log(`[${this.config.formName}] Submetendo busca:`, searchParams);
        
        // Atualiza URL e recarrega
        this.stateManager.updateStateAndReload(this.config.formName, searchParams);
    }
    
    hasActiveSearch(state) {
        return Object.values(state).some(value => value && value.trim() !== '');
    }
    
    emitSearchCompleted(results, searchParams, isAutomatic = false) {
        // Evento útil para exibir resultados na página
        const event = new CustomEvent('searchCompleted', {
            detail: { 
                formName: this.config.formName,
                results, 
                searchParams,
                isAutomatic
            }
        });
        document.dispatchEvent(event);
    }
    
    showError(message) {
        // Método simples para mostrar erro
        alert(`Erro na busca: ${message}`);
    }
    
    getCurrentState() {
        return this.connector.getInternalState();
    }
}