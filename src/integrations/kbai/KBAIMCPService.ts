import { toast } from 'sonner';
import { KBAIKnowledgeItem, KBAIQueryOptions, ConnectionStatus, getKBAIDirectService } from './index';
import { getFallbackItems } from './utils/fallbackData';
import { CacheManager } from './utils/cacheManager';

/**
 * Service for communicating with KBAI MCP server via mcp-remote proxy
 */
export class KBAIMCPService {
  private connectionStatus: ConnectionStatus = 'disconnected';
  private readonly cacheManager: CacheManager;
  private lastErrorTime: number = 0;
  private errorCooldown: number = 30000;
  
  constructor() {
    this.cacheManager = new CacheManager();
  }

  /**
   * Fetch knowledge items from KBAI MCP server via local proxy
   */
  async fetchKnowledgeItems(options: KBAIQueryOptions = {}): Promise<KBAIKnowledgeItem[]> {
    try {
      const cacheKey = this.cacheManager.getCacheKey(options);
      const cachedData = this.cacheManager.getFromCache(cacheKey);
      
      if (cachedData) {
        console.log('Using cached KBAI knowledge items:', cachedData);
        return cachedData;
      }
      
      this.connectionStatus = 'connecting';
      console.log('Fetching knowledge items from KBAI MCP server with options:', options);
      
      // Use the direct KBAI service for now (which has fallback logic)
      const directService = getKBAIDirectService();
      const items = await directService.fetchKnowledgeItems(options);
      
      // Update our connection status based on the direct service
      this.connectionStatus = directService.getConnectionStatus();
      
      if (!items || items.length === 0) {
        console.warn('No items returned from KBAI, using fallback items');
        return getFallbackItems();
      }
      
      // Cache the results
      this.cacheManager.addToCache(cacheKey, items);
      console.log('Successfully fetched and cached KBAI knowledge items:', items.length);
      
      return items;
    } catch (error) {
      console.error('Failed to fetch KBAI knowledge items:', error);
      this.connectionStatus = 'error';
      
      // Show error notification with cooldown
      const now = Date.now();
      if (now - this.lastErrorTime > this.errorCooldown) {
        toast.error('KBAI service temporarily unavailable. Using fallback knowledge.');
        this.lastErrorTime = now;
      }
      
      return getFallbackItems();
    }
  }


  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  clearCache(): void {
    this.cacheManager.clearCache();
  }
}

// Singleton instance for use throughout the app
let kbaiServiceInstance: KBAIMCPService | null = null;

/**
 * Get the global KBAI service instance
 */
export const getKBAIService = (): KBAIMCPService => {
  if (!kbaiServiceInstance) {
    kbaiServiceInstance = new KBAIMCPService();
  }
  return kbaiServiceInstance;
};
