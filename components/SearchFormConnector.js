/**
 * Conector para formulários existentes usando document.forms
 */
export class SearchFormConnector {
    constructor(formName) {
        this.formName = formName;
        this.form = document.forms[formName];
        
        if (!this.form) {
            throw new Error(`Formulário '${formName}' não encontrado. Verifique se existe um <form name="${formName}"> na página.`);
        }
        
        this.internalState = {};
        this.config = null;
        
        console.log(`📋 Formulário '${formName}' encontrado`);
    }
    
    connect(config, onFieldChange, onSubmit, initialState = {}) {
        this.config = config;
        this.internalState = { ...initialState };
        
        // Valida se os campos existem no formulário
        this._validateFormFields(config);
        
        // Popula campos com estado inicial
        this._populateFields(config, initialState);
        
        // Anexa event listeners
        this._attachEventListeners(config, onFieldChange, onSubmit);
        
        // Adiciona indicadores visuais se há estado inicial
        if (Object.keys(initialState).length > 0) {
            this._showAsActiveForm();
            console.log(`✅ Formulário '${config.formName}' carregado com estado da URL:`, initialState);
        }
        
        console.log(`🔗 Sistema conectado ao formulário '${config.formName}'`);
    }
    
    _validateFormFields(config) {
        const missingFields = [];
        
        config.fields.forEach(field => {
            const input = this.form[field.name];
            if (!input) {
                missingFields.push(field.name);
            }
        });
        
        if (missingFields.length > 0) {
            throw new Error(
                `Campos não encontrados no formulário '${config.formName}': ${missingFields.join(', ')}\n` +
                `Verifique se existem elementos com name="${missingFields[0]}" etc.`
            );
        }
        
        console.log(`✅ Todos os ${config.fields.length} campos foram encontrados`);
    }
    
    _populateFields(config, state) {
        config.fields.forEach(field => {
            const input = this.form[field.name];
            const value = state[field.name] || '';
            
            if (input && input.value !== value) {
                input.value = value;
                
                if (value && value.trim() !== '') {
                    this.internalState[field.name] = value;
                }
            }
        });
        
        // Atualiza estados visuais
        this._updateFieldStates(config, state);
    }
    
    _showAsActiveForm() {
        this.form.classList.add('search-form-active');
        
        // Adiciona classe ao container pai se existir
        const container = this.form.closest('.search-section, .form-container');
        if (container) {
            container.classList.add('active-form');
        }
    }
    
    _attachEventListeners(config, onFieldChange, onSubmit) {
        // Event listeners para os campos
        config.fields.forEach(field => {
            const input = this.form[field.name];
            if (input) {
                input.addEventListener('input', (e) => {
                    this._handleFieldChange(field.name, e.target.value, config, onFieldChange);
                });
            }
        });
        
        // Event listener para o submit
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Desabilita botão de submit para evitar duplo clique
            const submitBtn = this.form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Carregando...';
            }
            
            onSubmit(this.internalState);
        });
        
        // Event listener para botões de limpar
        const clearButtons = this.form.querySelectorAll('[data-action="clear"], .btn-clear');
        clearButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                
                if (confirm('Limpar busca? A página será recarregada.')) {
                    button.disabled = true;
                    button.textContent = 'Limpando...';
                    onFieldChange('clear', null);
                }
            });
        });
    }
    
    _handleFieldChange(fieldName, value, config, onFieldChange) {
        // Atualiza estado interno
        this.internalState[fieldName] = value;
        
        // Lógica de campos mutuamente exclusivos
        if (config.isFieldInMutuallyExclusiveGroup(fieldName) && value && value.trim() !== '') {
            const fieldsToDisable = config.getFieldsToDisableWhenFieldIsActive(fieldName);
            fieldsToDisable.forEach(field => {
                this.internalState[field] = '';
                const input = this.form[field];
                if (input) {
                    input.value = '';
                }
            });
        }
        
        // Remove campos vazios do estado
        if (!value || value.trim() === '') {
            delete this.internalState[fieldName];
        }
        
        // Atualiza estados visuais
        this._updateFieldStates(config, this.internalState);
        
        // Notifica controlador
        onFieldChange(fieldName, value);
    }
    
    _updateFieldStates(config, state) {
        config.fields.forEach(field => {
            const input = this.form[field.name];
            if (!input) return;
            
            const shouldBeDisabled = this._shouldFieldBeDisabled(field.name, state, config);
            
            input.disabled = shouldBeDisabled;
            input.classList.toggle('disabled', shouldBeDisabled);
        });
    }
    
    _shouldFieldBeDisabled(currentFieldName, state, config) {
        if (!config.isFieldInMutuallyExclusiveGroup(currentFieldName)) {
            return false;
        }
        
        const group = config.getMutuallyExclusiveGroup(currentFieldName);
        const activeFieldsInGroup = group.filter(fieldName => 
            state[fieldName] && state[fieldName].trim() !== ''
        );
        
        return activeFieldsInGroup.length > 0 && !activeFieldsInGroup.includes(currentFieldName);
    }
    
    getInternalState() {
        return { ...this.internalState };
    }
    
    setInternalState(state) {
        this.internalState = { ...state };
    }
}