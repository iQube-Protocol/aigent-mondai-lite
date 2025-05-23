import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MetaQube } from '@/lib/types';
import { Lock, Unlock, ShieldCheck, Database, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';
import ScoreTooltip from '@/components/shared/ScoreTooltips';

interface MetaQubeDisplayProps {
  metaQube: MetaQube;
  compact?: boolean;
  className?: string;
  onClick?: () => void;
}

interface DotScoreProps {
  value: number;
  label: string;
  type: 'risk' | 'sensitivity' | 'accuracy' | 'verifiability' | 'trust';
}

// New dot score component to replace the numeric score badges
const DotScore = ({ value, label, type }: DotScoreProps) => {
  // Convert score to number of dots (divide by 2 and round up)
  const dotCount = Math.ceil(value / 2);
  const maxDots = 5; // Max possible dots (10/2 = 5)
  
  const getScoreColor = () => {
    if (type === 'risk' || type === 'sensitivity') {
      // Risk and Sensitivity: 1-4 green, 5-7 amber, 8-10 red
      return value <= 4 
        ? "bg-green-500" 
        : value <= 7 
          ? "bg-yellow-500" 
          : "bg-red-500";
    } else if (type === 'trust') {
      // Trust: 5-10 green, 3-4 amber, 1-2 red
      return value >= 5 
        ? "bg-green-500" 
        : value >= 3 
          ? "bg-yellow-500" 
          : "bg-red-500";
    } else {
      // Accuracy and Verifiability: 1-3 red, 4-6 amber, 7-10 green
      return value <= 3 
        ? "bg-red-500" 
        : value <= 6 
          ? "bg-yellow-500" 
          : "bg-green-500";
    }
  };
  
  return (
    <div className="flex flex-col items-center">
      <span className="text-xs text-muted-foreground mb-1">{label}</span>
      <ScoreTooltip type={type} score={value}>
        <div className="flex space-x-0.5">
          {[...Array(maxDots)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                i < dotCount ? getScoreColor() : "bg-gray-400"
              )}
            />
          ))}
        </div>
      </ScoreTooltip>
    </div>
  );
};

const MetaQubeDisplay = ({ metaQube, compact = false, className, onClick }: MetaQubeDisplayProps) => {
  const [isActive, setIsActive] = useState(true);
  // Calculate Trust score as the average of Accuracy and Verifiability
  const trustScore = Math.round((metaQube["Accuracy-Score"] + metaQube["Verifiability-Score"]) / 2);
  
  // Determine if this is a DataQube or AgentQube for styling
  const isAgentQube = metaQube["iQube-Type"] === "AgentQube";
  
  // Color classes based on qube type - now using green for the cube icon in both cases
  const qubeColorClasses = {
    bg: isAgentQube ? "bg-purple-500/10" : "bg-iqube-primary/10",
    border: isAgentQube ? "border-purple-500/30" : "border-iqube-primary/30",
    text: "text-iqube-primary", // Use green for icon in both cases
  };

  // Custom styles for the toggle switch
  const switchColorClass = isAgentQube ? "data-[state=checked]:bg-[#D946EF]" : "data-[state=checked]:bg-iqube-primary";

  const cardContent = compact ? (
    <CardContent className="pb-3 pt-3">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`h-5 w-5 ${qubeColorClasses.text}`}>
              {/* Use cube icon for both types */}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
            </div>
            <span className="text-sm font-medium">{metaQube["iQube-Identifier"]}</span>
          </div>
          <ScoreTooltip type={isAgentQube ? "agentQube" : "dataQube"}>
            <Badge variant="outline" className={`flex items-center gap-1 ${qubeColorClasses.bg} ${isAgentQube ? "text-purple-500" : qubeColorClasses.text} ${qubeColorClasses.border}`}>
              {isAgentQube ? <Brain size={14} /> : <Database size={14} />}
            </Badge>
          </ScoreTooltip>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <DotScore value={trustScore} label="Trust" type="trust" />
            <DotScore value={metaQube["Risk-Score"]} label="Risk" type="risk" />
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs text-muted-foreground mb-1">{isActive ? 'Active' : 'Inactive'}</span>
            <Switch 
              checked={isActive} 
              onCheckedChange={setIsActive} 
              size="sm"
              className={switchColorClass}
            />
          </div>
        </div>
      </div>
    </CardContent>
  ) : (
    <>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className={`h-5 w-5 mr-2 ${qubeColorClasses.text}`}>
              {/* Use cube icon for both types */}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
            </div>
            <span className="text-lg font-medium">{metaQube["iQube-Identifier"]}</span>
          </div>
          <ScoreTooltip type={isAgentQube ? "agentQube" : "dataQube"}>
            <Badge variant="outline" className={`flex items-center gap-1 ${qubeColorClasses.bg} ${isAgentQube ? "text-purple-500" : qubeColorClasses.text} ${qubeColorClasses.border}`}>
              {isAgentQube ? <Brain size={14} /> : <Database size={14} />}
            </Badge>
          </ScoreTooltip>
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-8">
            <DotScore value={trustScore} label="Trust" type="trust" />
            <DotScore value={metaQube["Risk-Score"]} label="Risk" type="risk" />
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sm text-muted-foreground mb-1">{isActive ? 'Active' : 'Inactive'}</span>
            <Switch 
              checked={isActive} 
              onCheckedChange={setIsActive}
              className={switchColorClass}
            />
          </div>
        </div>

        <div className="flex justify-between mb-4 pb-4 border-b">
          <DotScore value={metaQube["Accuracy-Score"]} label="Accuracy" type="accuracy" />
          <DotScore value={metaQube["Sensitivity-Score"]} label="Sensitivity" type="sensitivity" />
          <DotScore value={metaQube["Verifiability-Score"]} label="Verifiability" type="verifiability" />
        </div>

        <div className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <div className="text-muted-foreground">Owner Type</div>
            <div>{metaQube["Owner-Type"]}</div>
            
            <div className="text-muted-foreground">Date Minted</div>
            <div>{new Date(metaQube["Date-Minted"]).toLocaleDateString()}</div>
            
            <div className="text-muted-foreground">Edition</div>
            <div>{metaQube["X-of-Y"]}</div>
            
            <div className="text-muted-foreground">Related iQubes</div>
            <div className="flex flex-wrap gap-1">
              {metaQube["Related-iQubes"].map((qube, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {qube}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex mt-4 space-x-2">
          <div className="flex items-center border rounded-md px-2 py-1 text-xs">
            <ShieldCheck className="h-3.5 w-3.5 mr-1" />
            <span>Protected</span>
          </div>
          <div className="flex items-center border rounded-md px-2 py-1 text-xs">
            {isAgentQube ? (
              <>
                <Brain className="h-3.5 w-3.5 mr-1" />
                <span>Agent</span>
              </>
            ) : (
              <>
                <Database className="h-3.5 w-3.5 mr-1" />
                <span>Data</span>
              </>
            )}
          </div>
          {metaQube["Risk-Score"] <= 4 ? (
            <div className="flex items-center border rounded-md px-2 py-1 text-xs text-green-500 border-green-500/30">
              <Unlock className="h-3.5 w-3.5 mr-1" />
              <span>Low Risk</span>
            </div>
          ) : (
            <div className="flex items-center border rounded-md px-2 py-1 text-xs text-yellow-500 border-yellow-500/30">
              <Lock className="h-3.5 w-3.5 mr-1" />
              <span>Medium Risk</span>
            </div>
          )}
        </div>
      </CardContent>
    </>
  );

  // Use a regular div if onClick is provided, otherwise use Link
  const CardWrapper = onClick ? 
    ({ children }: { children: React.ReactNode }) => (
      <div onClick={onClick} className="block cursor-pointer">
        <Card className={cn(`iqube-card transition-all hover:bg-card/90 hover:shadow-md ${isAgentQube ? 'border-purple-500/20' : ''}`, className)}>
          {children}
        </Card>
      </div>
    ) : 
    ({ children }: { children: React.ReactNode }) => (
      <Link to="/settings" className="block">
        <Card className={cn(`iqube-card cursor-pointer transition-all hover:bg-card/90 hover:shadow-md ${isAgentQube ? 'border-purple-500/20' : ''}`, className)}>
          {children}
        </Card>
      </Link>
    );

  return <CardWrapper>{cardContent}</CardWrapper>;
};

export default MetaQubeDisplay;
