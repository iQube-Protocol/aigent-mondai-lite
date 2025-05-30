
import React from 'react';
import { cn } from '@/lib/utils';
import { Bot, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

interface SidebarHeaderProps {
  collapsed: boolean;
  toggleSidebar: () => void;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({ collapsed, toggleSidebar }) => {
  return (
    <div className={cn(
      "flex items-center mb-6 px-3",
      collapsed ? "justify-center" : "justify-between"
    )}>
      {!collapsed ? (
        <Link to="/splash" className="flex items-center">
          <Bot className="h-6 w-6 text-iqube-primary mr-2" />
          <h1 className="text-lg font-bold bg-gradient-to-r from-iqube-primary to-iqube-accent inline-block text-transparent bg-clip-text">
            Aigent MonDAI
          </h1>
        </Link>
      ) : (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to="/splash">
                <Bot className="h-6 w-6 text-iqube-primary" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">
              Aigent MonDAI
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Collapse/Expand button */}
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={toggleSidebar}
        className={collapsed ? "hidden" : ""}
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </Button>
    </div>
  );
};

export default SidebarHeader;
