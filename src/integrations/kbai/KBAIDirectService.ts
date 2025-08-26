import { connectToSSE, checkApiHealth } from './utils/sseConnection';
import { getFallbackItems } from './utils/fallbackData';
import { KBAIKnowledgeItem, KBAIQueryOptions, ConnectionStatus } from './types';
import { CacheManager } from './utils/cacheManager';
import { toast } from 'sonner';

// Use the local proxy endpoint instead of direct KBAI
const KBAI_PROXY_ENDPOINT = 'http://localhost:3001/kbai-proxy';
const DEFAULT_AUTH_TOKEN = '85abed95769d4b2ea1cb6bfaa8a67193';
const DEFAULT_KB_TOKEN = 'KB00000001_CRPTMONDS';

export interface KBAIServerSettings {
  serverUrl: string;
  authToken: string;
  kbToken: string;
}

/**
 * Enhanced service for direct communication with KBAI MCP API
 */
export class KBAIDirectService {
  private connectionStatus: ConnectionStatus = 'disconnected';
  private readonly cacheManager: CacheManager;
  private lastErrorTime: number = 0;
  private errorCooldown: number = 30000;
  private authToken: string;
  private kbToken: string;
  private serverUrl: string;
  private fallbackMode: boolean = false;

  constructor() {
    this.cacheManager = new CacheManager();
    
    // Use the proxy endpoint by default
    this.serverUrl = import.meta.env.VITE_KBAI_SERVER_URL || KBAI_PROXY_ENDPOINT;
    this.authToken = import.meta.env.VITE_KBAI_AUTH_TOKEN || DEFAULT_AUTH_TOKEN;
    this.kbToken = import.meta.env.VITE_KBAI_KB_TOKEN || DEFAULT_KB_TOKEN;
  }

  /**
   * Get current server configuration
   */
  getServerConfig(): KBAIServerSettings {
    return {
      serverUrl: this.serverUrl,
      authToken: this.authToken,
      kbToken: this.kbToken
    };
  }

  /**
   * Update server configuration
   */
  updateServerConfig(config: Partial<KBAIServerSettings>): void {
    if (config.serverUrl) this.serverUrl = config.serverUrl;
    if (config.authToken) this.authToken = config.authToken;
    if (config.kbToken) this.kbToken = config.kbToken;
    
    // Clear cache when config changes
    this.cacheManager.clearCache();
    this.connectionStatus = 'disconnected';
  }

  /**
   * Fetch knowledge items using real SSE connection to KBAI MCP
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
      this.fallbackMode = false;
      console.log('🔗 Connecting to KBAI MCP endpoint with options:', options);

      const headers = {
        'x-auth-token': this.authToken,
        'x-kb-token': this.kbToken
      };

      // Check API health first
      const isHealthy = await checkApiHealth(this.serverUrl, headers);
      if (!isHealthy) {
        console.warn('⚠️ KBAI MCP API health check failed, using fallback items');
        this.connectionStatus = 'error';
        this.fallbackMode = true;
        return getFallbackItems();
      }

      // Connect via SSE to the real KBAI MCP endpoint
      console.log('🔍 Connecting to KBAI MCP SSE endpoint...');
      const knowledgeItems = await connectToSSE({
        endpoint: this.serverUrl,
        headers,
        query: options.query || '',
        limit: options.limit || 10,
        category: options.category || '',
        timeout: 30000
      });

      if (knowledgeItems && knowledgeItems.length > 0) {
        this.connectionStatus = 'connected';
        this.fallbackMode = false;
        this.cacheManager.addToCache(cacheKey, knowledgeItems);
        console.log('✅ Successfully fetched KBAI MCP knowledge items:', knowledgeItems.length);
        return knowledgeItems;
      } else {
        console.warn('⚠️ No knowledge items returned from KBAI MCP, using fallback');
        this.connectionStatus = 'error';
        this.fallbackMode = true;
        return getFallbackItems();
      }

    } catch (error) {
      console.error('❌ Failed to fetch KBAI MCP knowledge items:', error);
      this.connectionStatus = 'error';
      this.fallbackMode = true;
      
      // Show error notification with cooldown
      const now = Date.now();
      if (now - this.lastErrorTime > this.errorCooldown) {
        toast.error('KBAI MCP service temporarily unavailable. Using fallback knowledge.');
        this.lastErrorTime = now;
      }
      
      return getFallbackItems();
    }
  }

  /**
   * Test connection to KBAI MCP API
   */
  async testConnection(): Promise<boolean> {
    try {
      const headers = {
        'x-auth-token': this.authToken,
        'x-kb-token': this.kbToken
      };
      
      return await checkApiHealth(this.serverUrl, headers);
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  /**
   * Check if service is in fallback mode
   */
  isInFallbackMode(): boolean {
    return this.fallbackMode || this.connectionStatus === 'error';
  }

  /**
   * Set fallback mode
   */
  setFallbackMode(enabled: boolean): void {
    this.fallbackMode = enabled;
  }

  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  reset(): void {
    this.connectionStatus = 'disconnected';
    this.fallbackMode = false;
    this.cacheManager.clearCache();
  }

  clearCache(): void {
    this.cacheManager.clearCache();
  }
}

// Singleton instance
let kbaiDirectServiceInstance: KBAIDirectService | null = null;

export const getKBAIDirectService = (): KBAIDirectService => {
  if (!kbaiDirectServiceInstance) {
    kbaiDirectServiceInstance = new KBAIDirectService();
  }
  return kbaiDirectServiceInstance;
};
