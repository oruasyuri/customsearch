/**
 * Interface para gerenciamento de estado da URL
 */
export class IStateManager {
    updateState(formName, fieldName, value) {
        throw new Error('Method updateState must be implemented');
    }
    
    getState(formName) {
        throw new Error('Method getState must be implemented');
    }
    
    clearState(formName) {
        throw new Error('Method clearState must be implemented');
    }
}