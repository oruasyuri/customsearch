/**
 * Serviço de busca
 */
export class SearchService {
    constructor(httpClient = fetch) {
        this.httpClient = httpClient;
    }
    
    async search(endpoint, params) {
        try {
            const url = new URL(endpoint);
            
            // Adiciona parâmetros de busca à URL
            Object.keys(params).forEach(key => {
                if (params[key] && params[key].trim() !== '') {
                    url.searchParams.append(key, params[key]);
                }
            });
            
            const response = await this.httpClient(url.toString(), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Erro na busca: ${response.status} - ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Erro ao realizar busca:', error);
            throw error;
        }
    }
}