/**
 * Renderizador do formulário de busca
 * Agora se conecta a formulários existentes ao invés de criar novos
 */
export class SearchFormRenderer {
    constructor(formSelector) {
        // Agora recebe um seletor CSS para encontrar o formulário existente
        this.form = document.querySelector(formSelector);
        if (!this.form) {
            throw new Error(`Formulário com seletor '${formSelector}' não encontrado`);
        }
        
        // Estado interno do formulário (não sincronizado com URL)
        this.internalState = {};
        this.config = null;
    }
    
    connect(config, onFieldChange, onSubmit, initialState = {}) {
        this.config = config;
        this.internalState = { ...initialState };
        
        // Valida se os campos configurados existem no formulário
        this._validateFormFields(config);
        
        // Popula campos com estado inicial
        this._populateFields(config, initialState);
        
        // Anexa event listeners
        this._attachEventListeners(config, onFieldChange, onSubmit);
        
        // Adiciona indicadores visuais
        this._enhanceFormWithIndicators(config);
        
        // Se há estado inicial, indica que é um carregamento de busca
        if (Object.keys(initialState).length > 0) {
            this._showFormAsActive(config);
        }
        
        console.log(`🔗 Conectado ao formulário '${config.formName}' com ${config.fields.length} campos`);
    }
    
    _validateFormFields(config) {
        const missingFields = [];
        
        config.fields.forEach(field => {
            const input = this.form.querySelector(`[name="${field.name}"]`);
            if (!input) {
                missingFields.push(field.name);
            }
        });
        
        if (missingFields.length > 0) {
            throw new Error(
                `Campos não encontrados no formulário '${config.formName}': ${missingFields.join(', ')}\n` +
                `Verifique se os atributos 'name' dos campos correspondem à configuração.`
            );
        }
        
        console.log(`✅ Todos os ${config.fields.length} campos foram encontrados no formulário`);
    }
    
    _populateFields(config, state) {
        config.fields.forEach(field => {
            const input = this.form.querySelector(`[name="${field.name}"]`);
            const value = state[field.name] || '';
            
            if (input && input.value !== value) {
                input.value = value;
                
                // Atualiza estado interno
                if (value && value.trim() !== '') {
                    this.internalState[field.name] = value;
                }
            }
        });
        
        // Atualiza estados visuais baseado na configuração
        this.updateFieldStates(config, state);
    }
    
    _enhanceFormWithIndicators(config) {
        // Remove indicadores existentes se houver
        const existingStatus = this.form.querySelector('.form-status-indicator');
        if (existingStatus) {
            existingStatus.remove();
        }
        
        // Adiciona indicador de status do formulário
        const statusIndicator = document.createElement('div');
        statusIndicator.className = 'form-status-indicator';
        statusIndicator.innerHTML = this._generateFormStatusInfo(config, Object.keys(this.internalState).length > 0);
        
        // Insere no início do formulário
        this.form.insertBefore(statusIndicator, this.form.firstChild);
        
        // Adiciona informações sobre grupos exclusivos se necessário
        if (config.mutuallyExclusiveGroups.length > 0) {
            const exclusiveInfo = document.createElement('div');
            exclusiveInfo.className = 'exclusive-groups-info';
            exclusiveInfo.innerHTML = this._generateExclusiveGroupsInfo(config);
            
            statusIndicator.appendChild(exclusiveInfo);
        }
        
        // Adiciona indicadores de loading
        const loadingIndicator = document.createElement('div');
        loadingIndicator.innerHTML = this._generateLoadingIndicator(config);
        statusIndicator.appendChild(loadingIndicator);
        
        // Marca campos mutuamente exclusivos
        this._markExclusiveFields(config);
    }
    
    _markExclusiveFields(config) {
        config.fields.forEach(field => {
            if (config.isFieldInMutuallyExclusiveGroup(field.name)) {
                const input = this.form.querySelector(`[name="${field.name}"]`);
                const label = this.form.querySelector(`label[for="${input?.id}"]`) || 
                             input?.closest('.form-group')?.querySelector('label') ||
                             input?.parentElement?.querySelector('label');
                
                if (label && !label.querySelector('.exclusive-indicator')) {
                    const indicator = document.createElement('span');
                    indicator.className = 'exclusive-indicator';
                    indicator.textContent = ' *';
                    indicator.title = 'Campo mutuamente exclusivo';
                    label.appendChild(indicator);
                }
            }
        });
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
    
    _generateExclusiveGroupsInfo(config) {
        const groupsInfo = config.mutuallyExclusiveGroups.map((group, index) => {
            const fieldLabels = group.map(fieldName => {
                const field = config.fields.find(f => f.name === fieldName);
                const input = this.form.querySelector(`[name="${fieldName}"]`);
                const label = this.form.querySelector(`label[for="${input?.id}"]`) || 
                           input?.closest('.form-group')?.querySelector('label');
                
                return label?.textContent?.replace('*', '').trim() || 
                       field?.placeholder || 
                       field?.name || 
                       fieldName;
            }).join(', ');
            
            return `<li>Grupo ${index + 1}: ${fieldLabels}</li>`;
        }).join('');
        
        return `
            <div class="exclusive-groups-details">
                <small>
                    <strong>* Campos mutuamente exclusivos:</strong>
                    <ul>${groupsInfo}</ul>
                    <em>Ao preencher um campo marcado com *, os outros campos do mesmo grupo serão desabilitados.</em>
                </small>
            </div>
        `;
    }
    
    _showFormAsActive(config) {
        // Marca visualmente que este formulário está ativo
        this.form.classList.add('search-form-active');
        
        const container = this.form.closest('.search-section') || this.form.closest('.form-container');
        if (container) {
            container.classList.add('active-form');
            container.classList.remove('inactive-form');
        }
    }
    
    _attachEventListeners(config, onFieldChange, onSubmit) {
        // Remove listeners existentes se houver
        this._removeExistingListeners();
        
        // Event listeners para os campos
        config.fields.forEach(field => {
            const input = this.form.querySelector(`[name="${field.name}"]`);
            if (input) {
                const handler = (e) => {
                    this._handleFieldChange(field.name, e.target.value, config, onFieldChange);
                };
                
                input.addEventListener('input', handler);
                
                // Armazena referência para poder remover depois
                if (!input._searchListeners) {
                    input._searchListeners = [];
                }
                input._searchListeners.push({ event: 'input', handler });
            }
        });
        
        // Event listener para o submit
        const submitHandler = (e) => {
            e.preventDefault();
            
            // Desabilita botões de submit para evitar duplo clique
            const submitButtons = this.form.querySelectorAll('button[type="submit"], input[type="submit"]');
            submitButtons.forEach(btn => {
                btn.disabled = true;
                if (btn.tagName === 'BUTTON') {
                    btn.dataset.originalText = btn.textContent;
                    btn.textContent = 'Carregando...';
                }
            });
            
            onSubmit(this.internalState);
        };
        
        this.form.addEventListener('submit', submitHandler);
        this.form._searchSubmitHandler = submitHandler;
        
        // Event listener para botões de limpar (se existirem)
        const clearButtons = this.form.querySelectorAll('[data-action="clear"], .btn-clear, .clear-search');
        clearButtons.forEach(button => {
            const clearHandler = (e) => {
                e.preventDefault();
                
                if (confirm('Tem certeza que deseja limpar a busca? A página será recarregada.')) {
                    button.disabled = true;
                    if (button.tagName === 'BUTTON') {
                        button.dataset.originalText = button.textContent;
                        button.textContent = 'Limpando...';
                    }
                    
                    this._clearForm(config);
                    onFieldChange('clear', null);
                }
            };
            
            button.addEventListener('click', clearHandler);
            button._searchClearHandler = clearHandler;
        });
        
        // Escuta eventos de loading/reloading
        this._listenToLoadingEvents(config);
    }
    
    _removeExistingListeners() {
        // Remove listeners de campos
        const inputs = this.form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (input._searchListeners) {
                input._searchListeners.forEach(({ event, handler }) => {
                    input.removeEventListener(event, handler);
                });
                input._searchListeners = [];
            }
        });
        
        // Remove listener de submit
        if (this.form._searchSubmitHandler) {
            this.form.removeEventListener('submit', this.form._searchSubmitHandler);
            this.form._searchSubmitHandler = null;
        }
        
        // Remove listeners de clear
        const clearButtons = this.form.querySelectorAll('[data-action="clear"], .btn-clear, .clear-search');
        clearButtons.forEach(button => {
            if (button._searchClearHandler) {
                button.removeEventListener('click', button._searchClearHandler);
                button._searchClearHandler = null;
            }
        });
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
    
    _handleFieldChange(fieldName, value, config, onFieldChange) {
        // Atualiza estado interno
        this.internalState[fieldName] = value;
        
        // Se o campo faz parte de um grupo mutuamente exclusivo, limpa os outros do grupo
        if (config.isFieldInMutuallyExclusiveGroup(fieldName) && value && value.trim() !== '') {
            const fieldsToDisable = config.getFieldsToDisableWhenFieldIsActive(fieldName);
            fieldsToDisable.forEach(field => {
                this.internalState[field] = '';
                const input = this.form.querySelector(`[name="${field}"]`);
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
            const input = this.form.querySelector(`[name="${field.name}"]`);
            if (input) {
                input.value = '';
                input.disabled = false;
                input.classList.remove('disabled');
            }
        });
    }
    
    _toggleLoadingState(loading) {
        const loadingElement = this.form.querySelector(`#${this.config?.formName}_loading`);
        if (loadingElement) {
            loadingElement.style.display = loading ? 'block' : 'none';
        }
    }
    
    _showReloadingState() {
        const reloadingElement = this.form.querySelector(`#${this.config?.formName}_reloading`);
        if (reloadingElement) {
            reloadingElement.style.display = 'block';
        }
    }
    
    _showErrorState(error) {
        // Remove mensagens de erro existentes
        const existingErrors = this.form.querySelectorAll('.error-message');
        existingErrors.forEach(el => el.remove());
        
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.innerHTML = `
            <div class="alert alert-danger">
                <strong>Erro na busca:</strong> ${error}
            </div>
        `;
        
        // Insere após o indicador de status
        const statusIndicator = this.form.querySelector('.form-status-indicator');
        if (statusIndicator) {
            statusIndicator.insertAdjacentElement('afterend', errorMessage);
        } else {
            this.form.insertBefore(errorMessage, this.form.firstChild);
        }
        
        // Remove a mensagem após 5 segundos
        setTimeout(() => {
            if (errorMessage.parentNode) {
                errorMessage.parentNode.removeChild(errorMessage);
            }
        }, 5000);
        
        // Reabilita botões
        const submitButtons = this.form.querySelectorAll('button[type="submit"], input[type="submit"]');
        submitButtons.forEach(btn => {
            btn.disabled = false;
            if (btn.dataset.originalText) {
                btn.textContent = btn.dataset.originalText;
                delete btn.dataset.originalText;
            }
        });
    }
    
    updateFieldStates(config, state) {
        config.fields.forEach(field => {
            const input = this.form.querySelector(`[name="${field.name}"]`);
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
    
    // Método para desconectar o sistema do formulário
    disconnect() {
        if (this.config) {
            this._removeExistingListeners();
            
            // Remove indicadores adicionados
            const statusIndicator = this.form.querySelector('.form-status-indicator');
            if (statusIndicator) {
                statusIndicator.remove();
            }
            
            // Remove marcações de campos exclusivos
            const exclusiveIndicators = this.form.querySelectorAll('.exclusive-indicator');
            exclusiveIndicators.forEach(indicator => indicator.remove());
            
            // Remove classes adicionadas
            this.form.classList.remove('search-form-active');
            
            console.log(`🔌 Desconectado do formulário '${this.config.formName}'`);
            this.config = null;
        }
    }
}