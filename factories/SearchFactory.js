import { SearchConfigDTO } from '../dto/SearchConfigDTO.js';
import { URLStateManager } from '../services/URLStateManager.js';
import { SearchService } from '../services/SearchService.js';
import { SearchFormRenderer } from '../components/SearchFormRenderer.js';
import { SearchController } from '../controllers/SearchController.js';

/**
 * Factory para criação do sistema de busca
 * Implementa Factory Pattern e Dependency Injection
 */
export class SearchFactory {
    static createSearchSystem(configData, containerId) {
        // Cria o DTO de configuração
        const config = new SearchConfigDTO(configData);
        
        // Cria as dependências
        const stateManager = new URLStateManager();
        const searchService = new SearchService();
        const renderer = new SearchFormRenderer(containerId);
        
        // Cria e retorna o controlador
        return new SearchController(config, stateManager, searchService, renderer);
    }
}