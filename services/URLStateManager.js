/**
 * Gerenciador de estado da URL
 */
export class URLStateManager {
    updateStateAndReload(formName, searchParams) {
        const url = new URL(window.location);
        const params = url.searchParams;
        
        // LIMPA TODOS os parâmetros existentes
        this._clearAllParameters(params);
        
        // Define qual formulário está ativo
        params.set('form', formName);
        
        // Adiciona os parâmetros da busca
        Object.keys(searchParams).forEach(fieldName => {
            const value = searchParams[fieldName];
            if (value && value.trim() !== '') {
                params.set(fieldName, value);
            }
        });
        
        // Recarrega a página com a nova URL
        window.location.href = url.toString();
    }
    
    getState(formName) {
        const url = new URL(window.location);
        const params = url.searchParams;
        const activeForm = params.get('form');
        
        // Se não é o formulário ativo, retorna vazio
        if (activeForm !== formName) {
            return {};
        }
        
        const state = {};
        
        // Extrai todos os parâmetros (exceto 'form')
        for (const [key, value] of params.entries()) {
            if (key !== 'form') {
                state[key] = value;
            }
        }
        
        return state;
    }
    
    clearStateAndReload(formName) {
        const url = new URL(window.location);
        const params = url.searchParams;
        
        // Só limpa se for o formulário ativo
        if (params.get('form') === formName) {
            this._clearAllParameters(params);
            window.location.href = url.toString();
        }
    }
    
    isActiveForm(formName) {
        const url = new URL(window.location);
        return url.searchParams.get('form') === formName;
    }
    
    _clearAllParameters(params) {
        const keysToDelete = Array.from(params.keys());
        keysToDelete.forEach(key => params.delete(key));
    }
}