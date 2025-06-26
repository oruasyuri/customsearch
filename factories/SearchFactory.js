import { SearchConfigDTO } from '../dto/SearchConfigDTO.js';
import { URLStateManager } from '../services/URLStateManager.js';
import { SearchService } from '../services/SearchService.js';
import { SearchFormConnector } from '../components/SearchFormConnector.js';
import { SearchController } from '../controllers/SearchController.js';

/**
 * Factory para conectar sistema de busca a formulários existentes
 */
export class SearchFactory {
    static connectToForm(configData) {
        const config = new SearchConfigDTO(configData);
        
        // Cria dependências
        const stateManager = new URLStateManager();
        const searchService = new SearchService();
        const connector = new SearchFormConnector(config.formName); // Usa document.forms[formName]
        
        // Retorna controlador conectado
        return new SearchController(config, stateManager, searchService, connector);
    }
}