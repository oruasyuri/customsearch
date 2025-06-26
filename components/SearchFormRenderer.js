/**
 * Renderizador do formulário de busca
 * Implementa Single Responsibility Principle
 */
export class SearchFormRenderer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error(`Container com ID '${containerId}' não encontrado`);
        }
        
        // Estado interno do formulário (não sincronizado com URL)
        this.internalState = {};
    }
    
    render(config, onFieldChange, onSubmit, initialState = {}) {
        this.internalState = { ...initialState };
        this.container.innerHTML = this._generateFormHTML(config, initialState);
        this._attachEventListeners(config, onFieldChange, onSubmit);
        
        // Se há estado inicial, indica que é um carregamento de busca
        if (Object.keys(initialState).length > 0) {
            this._showFormAsActive(config);
        }
    }
    
    _generateFormHTML(config, initialState) {
        const hasInitialState = Object.keys(initialState).length > 0;
        
        const fieldsHTML = config.fields.map(field => {
            const value = initialState[field.name] || '';
            const isDisabled = this._shouldFieldBeDisabled(field.name, initialState, config);
            
            return `
                <div class="form-group">
                    <label for="${config.formName}_${field.name}">
                        ${field.placeholder || field.name}
                        ${config.isFieldInMutuallyExclusiveGroup(field.name) ? '<span class="exclusive-indicator">*</span>' : ''}
                    </label>
                    <input 
                        type="${field.type || 'text'}"
                        id="${config.formName}_${field.name}"
                        name="${field.name}"
                        placeholder="${field.placeholder || ''}"
                        value="${value}"
                        ${isDisabled ? 'disabled' : ''}
                        class="form-control ${isDisabled ? 'disabled' : ''}"
                    />
                </div>
            `;
        }).join('');
        
        const exclusiveGroupsInfo = this._generateExclusiveGroupsInfo(config);
        const formStatusInfo = this._generateFormStatusInfo(config, hasInitialState);
        const loadingIndicator = this._generateLoadingIndicator(config);
        
        return `
            <div class="search-form-wrapper">
                ${formStatusInfo}
                ${loadingIndicator}
                <form id="${config.formName}" class="search-form">
                    ${fieldsHTML}
                    ${exclusiveGroupsInfo}
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary" id="${config.formName}_submit">
                            ${config.searchButtonText}
                        </button>
                        <button type="button" class="btn btn-secondary" id="${config.formName}_clear">
                            Limpar
                        </button>
                    </div>
                </form>
            </div>
        `;
    }
    
    _generateFormStatusInfo(config, hasInitialState) {
        const statusClass = hasInitialState ? 'active' : 'inactive';
        const statusText = hasInitialState ? 'Formulário ativo - Busca carregada da URL' : 'Formulário inativo';
        
        return `
            <div class="form-status" id="${config.formName}_status">
                <small class="form-status-text">
                    <span class="status-indicator ${statusClass}">●</span>
                    <span class="status-text">${statusText}</span>
                </small>
            </div>
        `;
    }
    
    _generateLoadingIndicator(config) {
        return `
            <div class="loading-indicator" id="${config.formName}_loading" style="display: none;">
                <div class="loading-content">
                    <div class="loading-spinner"></div>
                    <span class="loading-text">Carregando resultados...</span>
                </div>
            </div>
            <div class="reloading-indicator" id="${config.formName}_reloading" style="display: none;">
                <div class="reloading-content">
                    <div class="reloading-spinner"></div>
                    <span class="reloading-text">Atualizando página...</span>
                </div>
            </div>
        `;
    }
    
    _showFormAsActive(config) {
        // Marca visualmente que este formulário está ativo
        const container = this.container.closest('.search-section');
        if (container) {
            container.classList.add('active-form');
            container.classList.remove('inactive-form');
        }
    }
    
    _shouldFieldBeDisabled(currentFieldName, state, config) {
        // Se o campo não faz parte de nenhum grupo mutuamente exclusivo, nunca é desabilitado
        if (!config.isFieldInMutuallyExclusiveGroup(currentFieldName)) {
            return false;
        }
        
        // Verifica se algum outro campo do mesmo grupo está ativo
        const group = config.getMutuallyExclusiveGroup(currentFieldName);
        const activeFieldsInGroup = group.filter(fieldName => 
            state[fieldName] && state[fieldName].trim() !== ''
        );
        
        // Se há campos ativos no grupo e o campo atual não está entre eles, deve ser desabilitado
        return activeFieldsInGroup.length > 0 && !activeFieldsInGroup.includes(currentFieldName);
    }
    
    _generateExclusiveGroupsInfo(config) {
        if (config.mutuallyExclusiveGroups.length === 0) {
            return '';
        }
        
        const groupsInfo = config.mutuallyExclusiveGroups.map((group, index) => {
            const fieldLabels = group.map(fieldName => {
                const field = config.fields.find(f => f.name === fieldName);
                return field ? (field.placeholder || field.name) : fieldName;
            }).join(', ');
            
            return `<li>Grupo ${index + 1}: ${fieldLabels}</li>`;
        }).join('');
        
        return `
            <div class="exclusive-groups-info">
                <small>
                    <strong>* Campos mutuamente exclusivos:</strong>
                    <ul>${groupsInfo}</ul>
                    <em>Ao preencher um campo marcado com *, os outros campos do mesmo grupo serão desabilitados.</em>
                </small>
            </div>
        `;
    }
    
    _attachEventListeners(config, onFieldChange, onSubmit) {
        const form = document.getElementById(config.formName);
        const clearButton = document.getElementById(`${config.formName}_clear`);
        const submitButton = document.getElementById(`${config.formName}_submit`);
        
        // Event listeners para os campos - agora só atualiza estado interno
        config.fields.forEach(field => {
            const input = document.getElementById(`${config.formName}_${field.name}`);
            input.addEventListener('input', (e) => {
                this._handleFieldChange(field.name, e.target.value, config, onFieldChange);
            });
        });
        
        // Event listener para o submit
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Desabilita o botão de submit para evitar duplo clique
            submitButton.disabled = true;
            submitButton.textContent = 'Carregando...';
            
            onSubmit(this.internalState);
        });
        
        // Event listener para limpar
        clearButton.addEventListener('click', () => {
            // Mostra confirmação antes de limpar (já que recarregará a página)
            if (confirm('Tem certeza que deseja limpar a busca? A página será recarregada.')) {
                clearButton.disabled = true;
                clearButton.textContent = 'Limpando...';
                
                this._clearForm(config);
                onFieldChange('clear', null);
            }
        });
        
        // Escuta eventos de loading/reloading
        this._listenToLoadingEvents(config);
    }
    
    _listenToLoadingEvents(config) {
        document.addEventListener('searchLoading', (event) => {
            const { formName, loading } = event.detail;
            if (formName === config.formName) {
                this._toggleLoadingState(loading);
            }
        });
        
        document.addEventListener('pageReloading', (event) => {
            const { formName } = event.detail;
            if (formName === config.formName) {
                this._showReloadingState();
            }
        });
        
        document.addEventListener('searchError', (event) => {
            const { formName, error } = event.detail;
            if (formName === config.formName) {
                this._showErrorState(error);
            }
        });
    }
    
    _toggleLoadingState(loading) {
        const loadingElement = document.getElementById(`${this.config?.formName}_loading`);
        if (loadingElement) {
            loadingElement.style.display = loading ? 'block' : 'none';
        }
    }
    
    _showReloadingState() {
        const reloadingElement = document.getElementById(`${this.config?.formName}_reloading`);
        if (reloadingElement) {
            reloadingElement.style.display = 'block';
        }
    }
    
    _showErrorState(error) {
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.innerHTML = `
            <div class="alert alert-danger">
                <strong>Erro na busca:</strong> ${error}
            </div>
        `;
        
        const form = document.getElementById(this.config?.formName);
        if (form && form.parentNode) {
            form.parentNode.insertBefore(errorMessage, form);
            
            // Remove a mensagem após 5 segundos
            setTimeout(() => {
                if (errorMessage.parentNode) {
                    errorMessage.parentNode.removeChild(errorMessage);
                }
            }, 5000);
        }
    }
    
    _handleFieldChange(fieldName, value, config, onFieldChange) {
        // Atualiza estado interno
        this.internalState[fieldName] = value;
        
        // Se o campo faz parte de um grupo mutuamente exclusivo, limpa os outros do grupo
        if (config.isFieldInMutuallyExclusiveGroup(fieldName) && value && value.trim() !== '') {
            const fieldsToDisable = config.getFieldsToDisableWhenFieldIsActive(fieldName);
            fieldsToDisable.forEach(field => {
                this.internalState[field] = '';
                const input = document.getElementById(`${config.formName}_${field}`);
                if (input) {
                    input.value = '';
                }
            });
        }
        
        // Remove campos vazios do estado interno
        if (!value || value.trim() === '') {
            delete this.internalState[fieldName];
        }
        
        // Atualiza estados visuais dos campos
        this.updateFieldStates(config, this.internalState);
        
        // Notifica o controlador (mas não atualiza URL ainda)
        onFieldChange(fieldName, value);
    }
    
    _clearForm(config) {
        this.internalState = {};
        config.fields.forEach(field => {
            const input = document.getElementById(`${config.formName}_${field.name}`);
            if (input) {
                input.value = '';
                input.disabled = false;
                input.classList.remove('disabled');
            }
        });
    }
    
    updateFieldStates(config, state) {
        config.fields.forEach(field => {
            const input = document.getElementById(`${config.formName}_${field.name}`);
            if (!input) return;
            
            const shouldBeDisabled = this._shouldFieldBeDisabled(field.name, state, config);
            
            input.disabled = shouldBeDisabled;
            input.classList.toggle('disabled', shouldBeDisabled);
            
            // Atualiza valor se necessário
            const stateValue = state[field.name] || '';
            if (input.value !== stateValue) {
                input.value = stateValue;
            }
        });
    }
    
    getInternalState() {
        return { ...this.internalState };
    }
    
    setInternalState(state) {
        this.internalState = { ...state };
    }
}