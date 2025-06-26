/**
 * DTO para configuração do formulário de busca
 */
export class SearchConfigDTO {
    constructor({
        formName,
        fields,
        endpoint,
        searchButtonText = 'Buscar',
        mutuallyExclusiveGroups = []
    }) {
        this.formName = formName;
        this.fields = fields; // Array de objetos com { name, placeholder, type, mutuallyExclusive }
        this.endpoint = endpoint;
        this.searchButtonText = searchButtonText;
        this.mutuallyExclusiveGroups = mutuallyExclusiveGroups; // Array de arrays com nomes dos campos
        
        this.validate();
    }

    validate() {
        if (!this.formName || typeof this.formName !== 'string') {
            throw new Error('formName é obrigatório e deve ser uma string');
        }
        
        if (!Array.isArray(this.fields) || this.fields.length === 0) {
            throw new Error('fields deve ser um array não vazio');
        }
        
        this.fields.forEach((field, index) => {
            if (!field.name || typeof field.name !== 'string') {
                throw new Error(`Campo ${index}: name é obrigatório e deve ser uma string`);
            }
        });
        
        if (!this.endpoint || typeof this.endpoint !== 'string') {
            throw new Error('endpoint é obrigatório e deve ser uma string');
        }

        // Valida os grupos mutuamente exclusivos
        if (!Array.isArray(this.mutuallyExclusiveGroups)) {
            throw new Error('mutuallyExclusiveGroups deve ser um array');
        }

        this.mutuallyExclusiveGroups.forEach((group, groupIndex) => {
            if (!Array.isArray(group)) {
                throw new Error(`Grupo ${groupIndex} deve ser um array`);
            }
            
            group.forEach(fieldName => {
                const fieldExists = this.fields.some(field => field.name === fieldName);
                if (!fieldExists) {
                    throw new Error(`Campo '${fieldName}' no grupo ${groupIndex} não existe na lista de fields`);
                }
            });
        });
    }

    /**
     * Verifica se um campo faz parte de algum grupo mutuamente exclusivo
     */
    isFieldInMutuallyExclusiveGroup(fieldName) {
        return this.mutuallyExclusiveGroups.some(group => group.includes(fieldName));
    }

    /**
     * Retorna o grupo mutuamente exclusivo que contém o campo especificado
     */
    getMutuallyExclusiveGroup(fieldName) {
        return this.mutuallyExclusiveGroups.find(group => group.includes(fieldName)) || [];
    }

    /**
     * Retorna todos os campos que devem ser desabilitados quando o campo especificado está ativo
     */
    getFieldsToDisableWhenFieldIsActive(activeFieldName) {
        const group = this.getMutuallyExclusiveGroup(activeFieldName);
        return group.filter(fieldName => fieldName !== activeFieldName);
    }
}