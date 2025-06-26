import { IStateManager } from '../interfaces/IStateManager.js';

/**
 * Gerenciador de estado da URL
 * Implementa Single Responsibility Principle
 */
export class URLStateManager extends IStateManager {
    updateStateAndReload(formName, searchParams) {
        const url = new URL(window.location);
        const params = url.searchParams;
        
        // LIMPA TODOS os parâmetros de busca existentes
        this._clearAllSearchParameters(params);
        
        // Define qual formulário está ativo
        params.set('form', formName);
        
        // Adiciona apenas os parâmetros do formulário atual
        Object.keys(searchParams).forEach(fieldName => {
            const value = searchParams[fieldName];
            if (value && value.trim() !== '') {
                params.set(fieldName, value);
            }
        });
        
        // Recarrega a página com a nova URL
        window.location.href = url.toString();
    }
    
    updateState(formName, searchParams) {
        // Método mantido para compatibilidade, mas agora delega para updateStateAndReload
        this.updateStateAndReload(formName, searchParams);
    }
    
    getState(formName) {
        const url = new URL(window.location);
        const params = url.searchParams;
        const activeForm = params.get('form');
        
        // Se não há formulário ativo na URL ou é um formulário diferente, retorna vazio
        if (!activeForm || activeForm !== formName) {
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
        const activeForm = params.get('form');
        
        // Só limpa se for o formulário ativo
        if (activeForm === formName) {
            // Remove todos os parâmetros
            params.forEach((value, key) => {
                params.delete(key);
            });
            
            // Recarrega a página limpa
            window.location.href = url.toString();
        }
    }
    
    clearState(formName) {
        // Método mantido para compatibilidade, mas agora delega para clearStateAndReload
        this.clearStateAndReload(formName);
    }
    
    isActiveForm(formName) {
        const url = new URL(window.location);
        const activeForm = url.searchParams.get('form');
        return activeForm === formName;
    }
    
    _clearAllSearchParameters(params) {
        const keysToDelete = [];
        for (const key of params.keys()) {
            keysToDelete.push(key);
        }
        keysToDelete.forEach(key => params.delete(key));
    }
}