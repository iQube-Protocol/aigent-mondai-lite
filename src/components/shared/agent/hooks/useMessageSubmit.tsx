
import { useMCP } from '@/hooks/use-mcp';
import { useAuth } from '@/hooks/use-auth';
import { AgentMessage } from '@/lib/types';
import { processAgentInteraction } from '@/services/agent-service';
import { toast } from 'sonner';

/**
 * Hook to handle message submission and processing
 */
export const useMessageSubmit = (
  agentType: 'learn' | 'earn' | 'connect',
  conversationId: string | null,
  setMessages: React.Dispatch<React.SetStateAction<AgentMessage[]>>,
  setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>,
  setInputValue: React.Dispatch<React.SetStateAction<string>>,
  refreshInteractions: () => Promise<void>,
  onMessageSubmit?: (message: string) => Promise<AgentMessage>
) => {
  const { user } = useAuth();
  const { client: mcpClient } = useMCP();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get the input value directly from the form
    const form = e.target as HTMLFormElement;
    const textArea = form.querySelector('textarea') as HTMLTextAreaElement;
    if (!textArea) return;
    
    const message = textArea.value.trim();
    if (!message || setIsProcessing === undefined) return;

    const userMessage: AgentMessage = {
      id: Date.now().toString(),
      sender: 'user',
      message,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    // Check if we have documents in context
    let hasDocuments = false;
    let documentsInfo: string[] = [];
    
    // Add user message to MCP context if available
    if (mcpClient && conversationId) {
      try {
        // Always initialize MCP context with conversation ID first
        await mcpClient.initializeContext(conversationId);
        console.log(`MCP context initialized for conversation ${conversationId}`);
        
        // Add user message to context
        await mcpClient.addUserMessage(userMessage.message);
        console.log(`Added user message to MCP context for conversation ${conversationId}`);
        
        // Log the current MCP context to verify documents are included
        const context = mcpClient.getModelContext();
        if (!context) {
          console.error("Failed to get MCP context after adding user message");
        } else {
          // Log document context status
          if (context.documentContext && context.documentContext.length > 0) {
            hasDocuments = true;
            documentsInfo = context.documentContext.map(d => d.documentName);
            
            console.log(`Current MCP context has ${context.documentContext.length} documents:`, documentsInfo);
            
            // Check document content integrity
            const emptyContentDocs = context.documentContext.filter(doc => !doc.content || doc.content.length === 0);
            if (emptyContentDocs.length > 0) {
              console.error(`⚠️ ${emptyContentDocs.length} documents have empty content:`, 
                emptyContentDocs.map(d => d.documentName));
            }
            
            // Debug sample of document content
            console.log("Document content samples:", context.documentContext.map(d => ({ 
              name: d.documentName, 
              contentPreview: d.content ? (d.content.length > 0 ? d.content.substring(0, 100) + '...' : '[EMPTY]') : '[NULL]'
            })));
            
            // If message doesn't explicitly reference documents, add a helpful hint
            if (!message.toLowerCase().includes("document") && 
                !message.toLowerCase().includes("attachment") && 
                !message.toLowerCase().includes("file")) {
              toast.info("Tip: You can explicitly ask about your documents", {
                description: "Try asking a question that mentions your uploaded documents for best results"
              });
            }
          } else {
            console.log("No documents found in the current context");
          }
        }
      } catch (error) {
        console.error("Error initializing MCP context or adding user message:", error);
        toast.error("Failed to prepare message context", {
          description: error instanceof Error ? error.message : "Unknown error"
        });
      }
    } else {
      console.log("MCP client or conversation ID not available:", { 
        hasMcpClient: !!mcpClient, 
        conversationId 
      });
    }

    try {
      if (onMessageSubmit) {
        console.log(`Sending message to ${agentType} agent with conversation ID ${conversationId}`);
        
        if (hasDocuments) {
          console.log("Including documents in request:", documentsInfo);
        }
        
        const agentResponse = await onMessageSubmit(userMessage.message);
        
        // Add agent response to MCP context if available
        if (mcpClient && conversationId) {
          try {
            await mcpClient.addAgentResponse(agentResponse.message);
            console.log(`Added agent response to MCP context for conversation ${conversationId}`);
          } catch (error) {
            console.error("Error adding agent response to MCP context:", error);
          }
        }
        
        setMessages(prev => [...prev, agentResponse]);

        // Check if documents were used in the response
        if (agentResponse.metadata?.documentsUsed) {
          console.log("Documents were used in the agent response");
          toast.success("Documents were referenced in the response", {
            description: "The AI used your documents to answer your question"
          });
        } else if (hasDocuments) {
          console.log("Documents were available but not referenced in the response");
        }
      } else {
        // Fallback for when no onMessageSubmit is provided
        // Also store this interaction in the database for consistency
        let agentResponse = '';
        
        switch (agentType) {
          case 'learn':
            agentResponse = `I'm your Learning Agent. Based on your iQube data, I recommend exploring topics related to ${Math.random() > 0.5 ? 'DeFi protocols' : 'NFT marketplaces'}. Would you like me to provide more information?`;
            break;
          case 'earn':
            agentResponse = `I'm your Earning Agent. Your MonDAI tokens have increased by ${(Math.random() * 5).toFixed(2)}% today. Would you like to see potential staking opportunities based on your iQube profile?`;
            break;
          case 'connect':
            agentResponse = `I'm your Connection Agent. Based on your interests in your iQube, I found ${Math.floor(Math.random() * 10) + 1} community members with similar interests in ${Math.random() > 0.5 ? 'DeFi' : 'NFTs'}. Would you like me to introduce you?`;
            break;
        }

        // Process and store the interaction
        if (user) {
          const result = await processAgentInteraction(
            userMessage.message,
            agentType,
            agentResponse
          );
          
          if (!result.success) {
            console.error('Failed to process agent interaction:', result.error);
          }
        }

        const newAgentMessage: AgentMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'agent',
          message: agentResponse,
          timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, newAgentMessage]);
      }
      
      // After processing, refresh interactions to update the list
      if (user) {
        setTimeout(() => {
          refreshInteractions();
        }, 1000); // Small delay to ensure database has time to update
      }
    } catch (error) {
      console.error('Error handling message:', error);
      toast.error('There was a problem with your request');
    } finally {
      setIsProcessing(false);
    }
  };
  
  return { handleSubmit };
};
