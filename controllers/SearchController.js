/**
 * Controlador principal do sistema de busca
 * Implementa Dependency Inversion Principle e Single Responsibility Principle
 */
export class SearchController {
    constructor(config, stateManager, searchService, renderer) {
        this.config = config;
        this.stateManager = stateManager;
        this.searchService = searchService;
        this.renderer = renderer;
        
        this.init();
    }
    
    init() {
        // Verifica se este formulário está ativo na URL
        const isActiveForm = this.stateManager.isActiveForm(this.config.formName);
        
        let initialState = {};
        if (isActiveForm) {
            // Carrega estado da URL apenas se for o formulário ativo
            initialState = this.stateManager.getState(this.config.formName);
            
            // Se há estado inicial, marca como busca já realizada
            if (this.hasActiveSearch(initialState)) {
                console.log(`[${this.config.formName}] Carregando busca da URL:`, initialState);
                
                // Realiza a busca automaticamente
                this.performSearchOnLoad(initialState);
            }
        }
        
        // Define o estado interno do renderer
        this.renderer.setInternalState(initialState);
        
        // Renderiza o formulário
        this.renderer.render(
            this.config,
            this.handleFieldChange.bind(this),
            this.handleSubmit.bind(this),
            initialState
        );
    }
    
    async performSearchOnLoad(searchParams) {
        try {
            console.log(`[${this.config.formName}] Executando busca automática com parâmetros:`, searchParams);
            
            // Mostra indicador de carregamento
            this.showLoadingState();
            
            const results = await this.searchService.search(
                this.config.endpoint,
                searchParams
            );
            
            console.log(`[${this.config.formName}] Resultados da busca automática:`, results);
            
            // Remove indicador de carregamento
            this.hideLoadingState();
            
            // Emite evento com identificação do formulário
            this.onSearchResults(results, searchParams, true); // true = busca automática
            
        } catch (error) {
            console.error(`[${this.config.formName}] Erro na busca automática:`, error);
            this.hideLoadingState();
            this.showErrorState(error.message);
        }
    }
    
    handleFieldChange(fieldName, value) {
        // Apenas lida com a lógica interna, não atualiza URL
        if (fieldName === 'clear') {
            this.handleClear();
        }
        // Outros tratamentos se necessário, mas sem atualizar URL
    }
    
    handleClear() {
        // Limpa estado da URL e recarrega a página
        if (this.stateManager.isActiveForm(this.config.formName)) {
            console.log(`[${this.config.formName}] Limpando busca e recarregando página...`);
            this.stateManager.clearStateAndReload(this.config.formName);
        } else {
            // Se não é o formulário ativo, apenas limpa estado interno
            this.renderer.setInternalState({});
            this.renderer.updateFieldStates(this.config, {});
        }
    }
    
    async handleSubmit(searchParams) {
        if (!this.hasActiveSearch(searchParams)) {
            alert('Por favor, preencha pelo menos um campo para realizar a busca.');
            return;
        }
        
        console.log(`[${this.config.formName}] Submetendo busca e recarregando página...`, searchParams);
        
        // Mostra indicador de que a página vai recarregar
        this.showReloadingState();
        
        // Atualiza a URL e recarrega a página
        this.stateManager.updateStateAndReload(this.config.formName, searchParams);
        
        // Nota: O código abaixo nunca será executado pois a página recarregará
        // Mas mantemos para clareza do fluxo
    }
    
    async performSearch(searchParams) {
        // Este método não será mais usado para submits, apenas para buscas automáticas
        // Mantido para compatibilidade
        return this.performSearchOnLoad(searchParams);
    }
    
    hasActiveSearch(state) {
        return Object.values(state).some(value => value && value.trim() !== '');
    }
    
    onSearchResults(results, searchParams, isAutomatic = false) {
        // Emite evento com identificação do formulário
        const event = new CustomEvent('searchCompleted', {
            detail: { 
                formName: this.config.formName,
                isActiveForm: true,
                isAutomatic: isAutomatic,
                results, 
                searchParams 
            }
        });
        document.dispatchEvent(event);
    }
    
    showLoadingState() {
        const event = new CustomEvent('searchLoading', {
            detail: { 
                formName: this.config.formName,
                loading: true
            }
        });
        document.dispatchEvent(event);
    }
    
    hideLoadingState() {
        const event = new CustomEvent('searchLoading', {
            detail: { 
                formName: this.config.formName,
                loading: false
            }
        });
        document.dispatchEvent(event);
    }
    
    showReloadingState() {
        const event = new CustomEvent('pageReloading', {
            detail: { 
                formName: this.config.formName
            }
        });
        document.dispatchEvent(event);
    }
    
    showErrorState(message) {
        const event = new CustomEvent('searchError', {
            detail: { 
                formName: this.config.formName,
                error: message
            }
        });
        document.dispatchEvent(event);
    }
    
    // Método público para verificar se é o formulário ativo
    isActiveForm() {
        return this.stateManager.isActiveForm(this.config.formName);
    }
    
    // Método público para obter estado atual
    getCurrentState() {
        return this.renderer.getInternalState();
    }
    
    // Método público para definir estado programaticamente
    setState(state) {
        this.renderer.setInternalState(state);
        this.renderer.updateFieldStates(this.config, state);
    }
}