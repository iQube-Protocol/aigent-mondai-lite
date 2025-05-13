
import React from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface KnowledgeBaseProps {
  agentType: 'learn' | 'earn' | 'connect';
}

const KnowledgeBase = ({ agentType }: KnowledgeBaseProps) => {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="mb-4">
        <h3 className="text-lg font-medium">Knowledge Base</h3>
        <p className="text-sm text-muted-foreground">
          Access specialized information related to {agentType === 'learn' ? 'web3 education' : 
            agentType === 'earn' ? 'MonDAI tokens' : 'community connections'}.
        </p>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-4 hover:bg-card/90 transition-colors cursor-pointer">
                <h4 className="font-medium">
                  {agentType === 'learn' && `Web3 Learning Module ${i}`}
                  {agentType === 'earn' && `Token Economics Guide ${i}`}
                  {agentType === 'connect' && `Community Guide ${i}`}
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {agentType === 'learn' && "Learn about blockchain fundamentals and web3 applications."}
                  {agentType === 'earn' && "Understand MonDAI token metrics and rewards."}
                  {agentType === 'connect' && "Connect with like-minded individuals in the community."}
                </p>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default KnowledgeBase;
