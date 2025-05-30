
import { getKBAIService } from '@/integrations/kbai/KBAIMCPService';
import { getKBAIDirectService } from '@/integrations/kbai/KBAIDirectService';
import { getConversationContext, processAgentInteraction } from '@/services/agent-service';
import { toast } from 'sonner';

export interface MonDAIResponse {
  conversationId: string;
  message: string;
  timestamp: string;
  metadata: {
    version: string;
    modelUsed: string;
    knowledgeSource: string;
    itemsFound: number;
    [key: string]: any;
  };
}

/**
 * Processes a user query and generates a MonDAI response using KBAI integration
 */
export async function generateMonDAIResponse(
  message: string, 
  conversationId: string | null
): Promise<MonDAIResponse> {
  // Get conversation context if we have a conversationId
  let contextResult;
  if (conversationId) {
    contextResult = await getConversationContext(conversationId, 'learn');
    conversationId = contextResult.conversationId;
  } else {
    // Generate a new conversation ID
    conversationId = crypto.randomUUID();
  }

  // Check if we're in fallback mode
  const directService = getKBAIDirectService();
  const isInFallbackMode = directService.isInFallbackMode();
  const connectionStatus = directService.getConnectionStatus();

  // Get relevant knowledge items for the message
  let relevantKnowledgeItems = [];
  let knowledgeSource = "Offline Knowledge Base";
  
  try {
    if (isInFallbackMode) {
      console.log('Using direct fallback data for query', message);
      // Get fallback items directly from KBAI direct service
      relevantKnowledgeItems = await directService.fetchKnowledgeItems({
        query: message,
        limit: 3
      });
    } else {
      // Try regular KBAI service first
      const kbaiService = getKBAIService();
      relevantKnowledgeItems = await kbaiService.fetchKnowledgeItems({
        query: message,
        limit: 3
      });
      
      // If connected, update knowledge source
      if (kbaiService.getConnectionStatus() === 'connected') {
        knowledgeSource = "KBAI MCP Direct";
        toast.success('Successfully retrieved information from KBAI');
      }
    }
    
    console.log(`Found ${relevantKnowledgeItems.length} relevant knowledge items for query`);
  } catch (error) {
    console.warn('Error fetching knowledge items:', error);
    // Don't show error toast, just use fallback
  }

  // Generate response based on available knowledge
  let responseMessage = '';
  
  if (relevantKnowledgeItems.length > 0) {
    responseMessage = `I found some information related to your question about ${message.substring(0, 30)}... 
      
${relevantKnowledgeItems.map((item, i) => `According to our knowledge base: "${item.title}" - ${item.content}`).join('\n\n')}

Is there anything specific about this topic you'd like to explore further?`;
  } else {
    responseMessage = `I understand you're asking about "${message}". While I don't have specific knowledge items about this topic in my database, I can try to help with general information.
    
Would you like to know more about a related topic, or would you prefer to explore other areas of Web3 and blockchain technology?`;
  }

  return {
    conversationId,
    message: responseMessage,
    timestamp: new Date().toISOString(),
    metadata: {
      version: "1.0",
      modelUsed: "gpt-4o",
      knowledgeSource,
      itemsFound: relevantKnowledgeItems.length,
      connectionStatus,
      isOffline: isInFallbackMode
    }
  };
}

/**
 * Process a user message and generate a response, storing the interaction
 */
export async function processMonDAIInteraction(
  message: string,
  conversationId: string | null
) {
  // Generate response using the service
  const response = await generateMonDAIResponse(message, conversationId);
  
  // Store the interaction using the agent service
  await processAgentInteraction(
    message,
    'learn', // Use 'learn' instead of 'mondai' for compatibility
    response.message,
    {
      conversationId: response.conversationId
    }
  );
  
  return response;
}
