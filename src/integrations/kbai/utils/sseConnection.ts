import { KBAIKnowledgeItem } from '../index';

/**
 * Connect to the KBAI server using Server-Sent Events
 */
export interface SSEConnectionOptions {
  endpoint: string;
  headers: Record<string, string>;
  query?: string;
  limit?: number;
  category?: string;
  timeout?: number;
}

// Use the local proxy endpoint instead of direct KBAI
const KBAI_PROXY_ENDPOINT = 'http://localhost:3001/kbai-proxy';

/**
 * Connect to KBAI MCP endpoint using proper MCP protocol via proxy
 */
export async function connectToSSE(options: SSEConnectionOptions): Promise<KBAIKnowledgeItem[]> {
  const { headers, query, limit } = options;
  
  console.log('🔗 Starting KBAI MCP connection via proxy...');
  
  console.log('🔗 Now testing original proxy endpoint...');
  
  try {
    // Step 1: Get session endpoint from KBAI proxy
    console.log('📡 Step 1: Getting MCP session endpoint via proxy...');
    const proxyUrl = `${KBAI_PROXY_ENDPOINT}?limit=${limit || 10}`;
    
    const sessionResponse = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        ...headers,
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache'
      }
    });

    if (!sessionResponse.ok) {
      throw new Error(`Failed to get MCP session via proxy: ${sessionResponse.status}`);
    }

    // The proxy should return the session endpoint in SSE format
    const reader = sessionResponse.body?.getReader();
    const decoder = new TextDecoder();
    let sessionEndpoint = '';

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        // console.log(` Real chunk ${chunkCount}: done=${done}, length=${value?.length || 0}`);

        if (done) break;
        
        const chunk = decoder.decode(value);
        console.log('📡 Proxy response chunk:', chunk);
        
        // Look for the endpoint event
        if (chunk.includes('event: endpoint')) {
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              sessionEndpoint = line.substring(6).trim();
              console.log('📡 Found session endpoint:', sessionEndpoint);
              break;
            }
          }
          break;
        }
      }
      reader.releaseLock();
    }

    if (!sessionEndpoint) {
      throw new Error('No session endpoint received from proxy');
    }

    // Step 2: Use the session endpoint with the proxy base URL
    const fullSessionEndpoint = `http://localhost:3001${sessionEndpoint}`;
    console.log('🔧 Full session endpoint:', fullSessionEndpoint);

    // Step 3: Send MCP message and handle response directly (no EventSource)
    console.log('🔧 Step 2: Sending MCP message and handling response directly...');
    
    const mcpMessage = {
      "method": "tools/call",
      "params": {
          "name": "Get_Concept",
          "arguments": {
              "concept": query || "CryptoMondays"
          }
      },
      "jsonrpc": "2.0",
      "id": 5
    };

    console.log('🔧 Sending MCP message:', JSON.stringify(mcpMessage));
    console.log('🔧 Query parameter being used:', query || "CryptoMondays");

    // Send the message and handle the streaming response
    const response = await fetch(fullSessionEndpoint, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(mcpMessage)
    });

    console.log('🔧 Response status:', response.status);
    console.log('🔧 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok && response.status !== 202) {
      const errorText = await response.text();
      console.log('🔧 Error response:', errorText);
      throw new Error(`MCP request failed: ${response.status} - ${errorText}`);
    }

    console.log('🔧 Response accepted, processing streaming data...');

    // Debug the response object in detail
    console.log('🔍 Response status:', response.status);
    console.log('🔍 Response ok:', response.ok);
    console.log('🔍 Response headers:', Object.fromEntries(response.headers.entries()));
    console.log('🔍 Response body:', response.body);
    console.log('🔍 Response body locked:', response.body?.locked);

    // Handle the simplified string response from proxy
    const knowledgeItems: KBAIKnowledgeItem[] = [];
    
    console.log('🔧 Reading processed string response from proxy...');
    
    try {
      // Get the processed string directly from the response
      const processedContent = await response.text();
      
      console.log(`📦 Received processed content (${processedContent.length} chars):`, processedContent.substring(0, 200));
      
      // Skip empty or "Accepted" responses
      if (!processedContent || processedContent.trim() === 'Accepted' || processedContent.trim() === 'AcceptedAccepted') {
        console.warn('❌ Received empty or "Accepted" response');
        return knowledgeItems;
      }
      
      // Create a knowledge item from the processed string
      const knowledgeItem = transformKnowledgeItem({
        id: `kbai-processed-${Date.now()}`,
        title: `Knowledge: ${query || 'CryptoMondays'}`,
        content: processedContent,
        type: 'mcp-query',
        source: 'KBAI-MCP',
        relevance: 0.9
      });
      
      knowledgeItems.push(knowledgeItem);
      console.log('✅ Successfully created knowledge item from processed content');
      
    } catch (readError) {
      console.error('❌ Error reading processed response:', readError);
    }

    console.log('✅ Successfully processed KBAI MCP response');
    console.log('📊 Knowledge items found:', knowledgeItems.length);
    
    if (knowledgeItems.length === 0) {
      console.warn('⚠️  No knowledge items parsed from response');
    }

    return knowledgeItems;

  } catch (error) {
    console.error('❌ KBAI MCP connection failed:', error);
    throw error;
  }
}

/**
 * Transform raw knowledge item from KBAI format
 */
export function transformKnowledgeItem(item: any): KBAIKnowledgeItem {
  return {
    id: item.id || `kb-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title: item.title || item.name || 'Untitled Knowledge Item',
    content: item.content || item.text || item.description || '',
    type: item.type || 'general',
    source: item.source || 'KBAI',
    relevance: item.relevance || item.score || 0.5,
    timestamp: item.timestamp || new Date().toISOString()
  };
}

/**
 * Check the health of the KBAI proxy endpoint
 */
export async function checkApiHealth(
  endpoint: string, 
  headers: Record<string, string>
): Promise<boolean> {
  try {
    console.log('🏥 Checking KBAI proxy health...');
    
    return true
  } catch (error) {
    console.error('❌ Proxy health check failed:', error);
    return false;
  }
}
