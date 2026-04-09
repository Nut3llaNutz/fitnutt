import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Award, Lock, Sparkles } from "lucide-react";

interface Nut3llaPromptProps {
  title?: string;
  description: string;
  icon?: React.ReactNode;
  actionText?: string;
  onClose?: () => void;
}

export const Nut3llaPrompt = ({ 
  title = "Resident Access Required", 
  description, 
  icon = <Lock className="h-5 w-5 text-amber-500" />,
  actionText = "Join the Protocol",
  onClose 
}: Nut3llaPromptProps) => {
  const navigate = useNavigate();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 fixed bottom-24 left-4 right-4 z-50">
      <div className="bg-card/95 backdrop-blur-xl border-2 border-primary/20 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 transform rotate-12 group-hover:scale-110 transition-transform">
          <Sparkles size={100} />
        </div>
        
        <div className="flex gap-4 items-start relative z-10">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
          <div className="space-y-3 flex-1">
            <div className="space-y-1">
              <h4 className="text-sm font-black uppercase tracking-widest text-foreground">{title}</h4>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                {description}
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => navigate("/auth")} 
                size="sm"
                className="bg-gradient-to-r from-amber-500 to-orange-600 border-none text-[10px] font-black uppercase tracking-widest h-9 px-4 rounded-xl shadow-lg shadow-orange-500/20"
              >
                {actionText}
              </Button>
              {onClose && (
                <Button 
                  onClick={onClose}
                  variant="ghost" 
                  size="sm"
                  className="text-[10px] font-black uppercase tracking-widest h-9 px-4 rounded-xl"
                >
                  Maybe Later
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
