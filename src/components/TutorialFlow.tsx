import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Nut3lla } from "./Nut3lla";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Step {
  message: string;
  target?: string; // CSS selector
  position?: "center" | "top" | "bottom" | "auto";
}

const tutorialSteps: Step[] = [
  { 
    message: "YO! I'm Nut3lla. Welcome to FitNutt. As you can see, I literally never stop pumping iron. We're about to get you shredded. Ready for a quick tour?",
    position: "center"
  },
  { 
    message: "This is your Dashboard! These rings track your daily progress. Green means you're hitting your targets!",
    target: '[data-tour="macro-rings"]',
    position: "bottom"
  },
  { 
    message: "This is your Daily Diary. Click here to log every single bite. Accountability is the secret sauce to the pump!",
    target: '[data-tour="nav-diary"]',
    position: "top"
  },
  { 
    message: "And here's the Food Library. This is your personal database of mass-building fuel. Add and save anything you eat!",
    target: '[data-tour="nav-foods"]',
    position: "top"
  },
  { 
    message: "Alright, enough talk. It's time to build your customized fitness protocol. Give me your stats, and I'll crunch the macros.",
    position: "center"
  }
];

export const TutorialFlow = ({ onComplete }: { onComplete: () => void }) => {
  const [step, setStep] = useState(0);
  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [gender, setGender] = useState("male");
  const [goal, setGoal] = useState("bulk");
  const [activity, setActivity] = useState("1.375");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Update spotlight position when step changes
  useEffect(() => {
    const currentStep = tutorialSteps[step];
    if (currentStep.target) {
      const el = document.querySelector(currentStep.target);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Small delay to allow scroll to settle
        setTimeout(() => {
          setSpotlightRect(el.getBoundingClientRect());
        }, 300);
      }
    } else {
      setSpotlightRect(null);
    }
  }, [step]);

  const handleNext = () => {
    if (step < tutorialSteps.length - 1) {
      setStep(step + 1);
    }
  };

  const handleFinish = async () => {
    if (!weightKg || !heightCm) {
      toast({ title: "Uh oh", description: "Nut3lla needs your height and weight!", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const weight = parseFloat(weightKg);
      // Rough TDEE generic calculation
      const bmrMultiplier = gender === 'male' ? 24 : 22;
      const tdee = weight * bmrMultiplier * parseFloat(activity);
      
      const targetCals = goal === 'bulk' 
        ? Math.round(tdee + 300) 
        : Math.round(tdee - 500);

      const proteinMultiplier = goal === 'cut' ? 2.4 : 2.0;
      const targetProtein = Math.round(weight * proteinMultiplier);
      const targetFat = Math.round(weight * 0.9);
      
      const remainingCals = targetCals - (targetProtein * 4) - (targetFat * 9);
      const targetCarbs = Math.max(0, Math.round(remainingCals / 4));

      if (user) {
        await supabase.from('user_settings').update({
          tutorial_completed: true,
          calorie_target: targetCals,
          protein_target: targetProtein,
          carb_target: targetCarbs,
          fat_target: targetFat,
          nut3lla_tips_enabled: true
        }).eq('user_id', user.id);
      }
      toast({ title: "Fitness Protocol Locked In! 🔒" });
      onComplete();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate Nut3lla position with screen-safety clamping
  const getNut3llaStyle = (): React.CSSProperties => {
    if (!spotlightRect) return {};
    
    const currentStep = tutorialSteps[step];
    const padding = 15;
    const screenPadding = 20;
    
    let left = spotlightRect.left + spotlightRect.width / 2;
    let top = currentStep.position === 'top' 
      ? spotlightRect.top - padding 
      : spotlightRect.bottom + padding;

    // Safety clamping for X axis
    left = Math.max(screenPadding + 140, Math.min(window.innerWidth - screenPadding - 140, left));
    
    // Safety clamping for Y axis
    if (currentStep.position === 'top') {
      top = Math.max(220, top); // Ensure room for the bubble above Nut3lla
    } else {
      top = Math.min(window.innerHeight - 100, top);
    }

    return {
      position: 'fixed',
      left: `${left}px`,
      top: `${top}px`,
      transform: currentStep.position === 'top' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
      transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      zIndex: 160
    };
  };

  return (
    <div id="tutorial-overlay" className="fixed inset-0 z-[150] overflow-hidden pointer-events-none">
      {/* SVG Mask for Rounded Spotlight */}
      <svg className="absolute inset-0 w-full h-full pointer-events-auto">
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {spotlightRect && (
              <rect 
                x={spotlightRect.left - 8} 
                y={spotlightRect.top - 8} 
                width={spotlightRect.width + 16} 
                height={spotlightRect.height + 16} 
                rx="16" 
                fill="black" 
                className="transition-all duration-500"
              />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.65)" mask="url(#spotlight-mask)" />
      </svg>

      <div className={`relative h-full w-full flex flex-col items-center p-6 pointer-events-none ${!spotlightRect ? 'justify-center' : ''}`}>
        
        <div style={getNut3llaStyle()} className={spotlightRect ? 'w-[280px]' : 'max-w-md w-full'}>
          <div className="pointer-events-auto">
            {!isSubmitting && (
              <Nut3lla 
                message={
                  <div className="flex flex-col gap-3">
                    <p className="text-sm font-semibold leading-snug">{tutorialSteps[step].message}</p>
                    {step < tutorialSteps.length - 1 && (
                      <Button onClick={handleNext} size="sm" className="w-full font-bold h-8 text-xs">
                        {step === 0 ? "START TOUR" : "NEXT"}
                      </Button>
                    )}
                  </div>
                }
                position="center"
                isDismissible={false}
                className="w-full h-auto drop-shadow-2xl"
              />
            )}
          </div>
        </div>

        {step === tutorialSteps.length - 1 && (
          <div className="w-full max-w-sm mt-8 bg-card border-2 border-primary/20 p-5 rounded-2xl shadow-2xl animate-in fade-in zoom-in slide-in-from-bottom-10 duration-500 z-20 pointer-events-auto">
            <h3 className="text-xl font-bold mb-4 font-sans text-center pb-2 border-b-2 border-primary/10 tracking-tight uppercase">The Nut3lla Protocol</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground">Gender</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent className="z-[200]">
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground">Goal</Label>
                  <Select value={goal} onValueChange={setGoal}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent className="z-[200]">
                      <SelectItem value="bulk">Bulk (+Lean Mass)</SelectItem>
                      <SelectItem value="cut">Cut (-Body Fat)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground">Weight (kg)</Label>
                  <Input type="number" placeholder="75" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} className="h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground">Height (cm)</Label>
                  <Input type="number" placeholder="180" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} className="h-9" />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Activity</Label>
                <Select value={activity} onValueChange={setActivity}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="z-[200]">
                    <SelectItem value="1.2">Sedentary (Desk Job)</SelectItem>
                    <SelectItem value="1.375">Lightly Active (Gym 1-3x)</SelectItem>
                    <SelectItem value="1.55">Moderately Active (Gym 3-5x)</SelectItem>
                    <SelectItem value="1.725">Very Active (Gym 6-7x)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full font-bold text-sm h-10 mt-2 bg-primary text-primary-foreground tracking-wide" onClick={handleFinish} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "CRUNCH MY MACROS"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
