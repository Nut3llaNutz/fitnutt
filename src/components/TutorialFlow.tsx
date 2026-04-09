import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Nut3lla } from "./Nut3lla";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useTutorial } from "@/contexts/TutorialContext";
import { calculateMacros } from "@/lib/calories";

interface Step {
  message: string;
  target?: string;
  position?: "center" | "top" | "bottom" | "auto";
  interactionType?: "click" | "none";
}

const tutorialSteps: Step[] = [
  { 
    message: "YO! I'm Nut3lla. Welcome to FitNutt. I literally never stop pumping iron. We're about to get you shredded. Ready for a quick tour?",
    position: "center",
    interactionType: "none"
  },
  { 
    message: "This is your Dashboard! These rings track your daily progress. TAP THEM to see what I mean!",
    target: '[data-tour="macro-rings"]',
    position: "bottom",
    interactionType: "click"
  },
  { 
    message: "This is your Daily Diary. Click the Home icon to log every single bite. Accountability is the secret sauce!",
    target: '[data-tour="nav-diary"]',
    position: "top",
    interactionType: "click"
  },
  { 
    message: "And here's the Food Library. TAP IT now! This is your database of mass-building fuel.",
    target: '[data-tour="nav-foods"]',
    position: "top",
    interactionType: "click"
  },
  { 
    message: "Alright, enough talk. It's time to build your customized fitness protocol. Give me your stats, and I'll crunch the macros.",
    position: "center",
    interactionType: "none"
  }
];

export const TutorialFlow = ({ onComplete }: { onComplete: () => void }) => {
  const { step, setNextStep } = useTutorial();
  const [weightKg, setWeightKg] = useState("75");
  const [heightCm, setHeightCm] = useState("180");
  const [age, setAge] = useState("25");
  const [gender, setGender] = useState("male");
  const [goal, setGoal] = useState("bulk");
  const [activity, setActivity] = useState("1.375");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Handle interactive clicks
  useEffect(() => {
    const currentStep = tutorialSteps[step];
    if (currentStep?.interactionType === 'click' && currentStep.target) {
      const targetEl = document.querySelector(currentStep.target);
      if (targetEl) {
        const handleClick = () => {
          // Add a small delay for navigation to start before moving step
          setTimeout(setNextStep, 50);
          targetEl.removeEventListener('click', handleClick);
        };
        targetEl.addEventListener('click', handleClick);
        return () => targetEl.removeEventListener('click', handleClick);
      }
    }
  }, [step, setNextStep]);

  // Update spotlight position when step changes
  useEffect(() => {
    const currentStep = tutorialSteps[step];
    if (currentStep && currentStep.target) {
      // Small timeout to allow page navigation and rendering to settle
      const findTarget = () => {
        const el = document.querySelector(currentStep.target!);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setSpotlightRect(el.getBoundingClientRect());
        } else {
          // If not found yet, try again in a bit (useful for page transitions)
          setTimeout(findTarget, 200);
        }
      };
      findTarget();
    } else {
      setSpotlightRect(null);
    }
  }, [step]);

  const handleFinish = async () => {
    if (!weightKg || !heightCm || !age) {
      toast({ title: "Uh oh", description: "Nut3lla needs ALL your stats to crunch the numbers!", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const w = parseFloat(weightKg);
      const h = parseFloat(heightCm);
      const a = parseInt(age);
      const act = parseFloat(activity);

      // Use the improved Mifflin-St Jeor formula
      const targets = calculateMacros({
        gender,
        weight_kg: w,
        height_cm: h,
        age: a,
        activity_level: act,
        goal
      });

      if (user) {
        // @ts-ignore - The database columns might not be in the generated types yet but we need to update them
        await supabase.from('user_settings').update({
          tutorial_completed: true,
          calorie_target: targets.calories,
          protein_target: targets.protein,
          carb_target: targets.carbs,
          fat_target: targets.fats,
          nut3lla_tips_enabled: true,
          // Extra stats
          gender,
          weight_kg: w,
          height_cm: h,
          age: a,
          activity_level: act,
          goal
        }).eq('user_id', user.id);
      } else {
        // For guest mode, save to localStorage
        const guestSettings = JSON.parse(localStorage.getItem('fitnutt_guest_settings') || '{}');
        localStorage.setItem('fitnutt_guest_settings', JSON.stringify({
          ...guestSettings,
          tutorial_completed: true,
          calorie_target: targets.calories,
          protein_target: targets.protein,
          carb_target: targets.carbs,
          fat_target: targets.fats,
          gender,
          weight_kg: w,
          height_cm: h,
          age: a,
          activity_level: act,
          goal
        }));
      }
      toast({ title: "Fitness Protocol Locked In! 🔒" });
      onComplete();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    if (user) {
      await supabase.from('user_settings').update({ tutorial_completed: true }).eq('user_id', user.id);
    } else {
      const guestSettings = JSON.parse(localStorage.getItem('fitnutt_guest_settings') || '{}');
      localStorage.setItem('fitnutt_guest_settings', JSON.stringify({ ...guestSettings, tutorial_completed: true }));
    }
    onComplete();
  };

  const getNut3llaStyle = (): React.CSSProperties => {
    if (!spotlightRect) return {};
    
    const currentStep = tutorialSteps[step];
    const padding = 20; // Increased padding for better visual breathing room
    const screenPadding = 20;
    
    let left = spotlightRect.left + spotlightRect.width / 2;
    let top = currentStep.position === 'top' 
      ? spotlightRect.top - padding 
      : spotlightRect.bottom + padding;

    left = Math.max(screenPadding + 140, Math.min(window.innerWidth - screenPadding - 140, left));
    
    if (currentStep.position === 'top') {
      top = Math.max(220, top);
    } else {
      top = Math.min(window.innerHeight - 100, top);
    }

    return {
      position: 'fixed',
      left: `${left}px`,
      top: `${top}px`,
      transform: currentStep.position === 'top' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
      transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)', // Snappier, springy transition
      zIndex: 160
    };
  };

  if (!tutorialSteps[step]) return null;

  return (
    <div id="tutorial-overlay" className="fixed inset-0 z-[150] overflow-hidden pointer-events-none">
      <svg className="absolute inset-0 w-full h-full pointer-events-auto">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {spotlightRect && (
              <rect 
                x={spotlightRect.left - 10} 
                y={spotlightRect.top - 10} 
                width={spotlightRect.width + 20} 
                height={spotlightRect.height + 20} 
                rx="20" 
                fill="black" 
                className="transition-all duration-500 ease-out"
              />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.7)" mask="url(#spotlight-mask)" />
        
        {/* Visual Pulse for the spotlight */}
        {spotlightRect && (
          <rect 
            x={spotlightRect.left - 10} 
            y={spotlightRect.top - 10} 
            width={spotlightRect.width + 20} 
            height={spotlightRect.height + 20} 
            rx="20" 
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            opacity="0.5"
            className="animate-pulse"
            style={{ filter: 'url(#glow)' }}
          />
        )}
      </svg>

      <div className={`relative h-full w-full flex flex-col items-center p-6 pointer-events-none ${!spotlightRect ? 'justify-center' : ''}`}>
        
        <div style={getNut3llaStyle()} className={spotlightRect ? 'w-[300px]' : 'max-w-md w-full'}>
          <div className="pointer-events-auto group relative">
            {!isSubmitting && (
              <Nut3lla 
                message={
                  <div className="flex flex-col gap-4">
                    <p className="text-sm font-semibold leading-relaxed tracking-tight">{tutorialSteps[step].message}</p>
                    <div className="flex gap-2">
                      {step < tutorialSteps.length - 1 ? (
                        <>
                          {tutorialSteps[step].interactionType !== 'click' && (
                            <Button onClick={setNextStep} size="sm" className="flex-1 font-bold h-9 text-xs shadow-lg shadow-primary/20">
                              {step === 0 ? "START TOUR" : "NEXT"}
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            onClick={handleSkip} 
                            size="sm" 
                            className="text-[10px] uppercase font-bold text-muted-foreground/60 hover:text-muted-foreground transition-colors px-2"
                          >
                            Skip Tour
                          </Button>
                        </>
                      ) : (
                        <div className="w-full text-center py-1">
                          <p className="text-[10px] uppercase font-black text-primary animate-pulse tracking-widest">Final Step below!</p>
                        </div>
                      )}
                    </div>
                  </div>
                }
                position="center"
                isDismissible={false}
                className="w-full h-auto drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-transform duration-300 group-hover:scale-[1.02]"
              />
            )}
          </div>
        </div>

        {step === tutorialSteps.length - 1 && (
          <div className="w-full max-w-sm mt-8 bg-card/95 backdrop-blur-xl border-2 border-primary/20 p-6 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-in fade-in zoom-in slide-in-from-bottom-12 duration-700 z-20 pointer-events-auto overflow-y-auto max-h-[70vh] border-t-primary/40">
            <div className="text-center space-y-1 mb-6">
              <h3 className="text-2xl font-black font-sans text-foreground tracking-tighter uppercase italic italic-none">The Protocol</h3>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">Finalize Your Stats</p>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground/70 ml-1">Gender</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger className="h-10 bg-background/50 border-border/50 rounded-xl text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent className="z-[200]">
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground/70 ml-1">Goal</Label>
                  <Select value={goal} onValueChange={setGoal}>
                    <SelectTrigger className="h-10 bg-background/50 border-border/50 rounded-xl text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent className="z-[200]">
                      <SelectItem value="bulk">Bulk (+Lean)</SelectItem>
                      <SelectItem value="cut">Cut (-Fat)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground/70 ml-1">Weight</Label>
                  <div className="relative">
                    <Input type="number" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} className="h-10 bg-background/50 border-border/50 rounded-xl pr-7" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground uppercase">kg</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground/70 ml-1">Height</Label>
                   <div className="relative">
                    <Input type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} className="h-10 bg-background/50 border-border/50 rounded-xl pr-7" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground uppercase">cm</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground/70 ml-1">Age</Label>
                  <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="h-10 bg-background/50 border-border/50 rounded-xl" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground/70 ml-1">Daily Activity</Label>
                <Select value={activity} onValueChange={setActivity}>
                  <SelectTrigger className="h-10 bg-background/50 border-border/50 rounded-xl text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="z-[200]">
                    <SelectItem value="1.2">Sedentary (Desk Job)</SelectItem>
                    <SelectItem value="1.375">Lightly Active (Gym 1-3x)</SelectItem>
                    <SelectItem value="1.55">Moderately Active (Gym 3-5x)</SelectItem>
                    <SelectItem value="1.725">Very Active (Gym 6-7x)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="pt-2">
                <Button 
                  className="w-full font-black text-sm h-12 bg-primary text-primary-foreground tracking-widest rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/30" 
                  onClick={handleFinish} 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "CRUNCH MY PROTOCOL"}
                </Button>
                <button 
                  onClick={handleSkip}
                  className="w-full text-[10px] font-bold text-muted-foreground/40 hover:text-muted-foreground/80 mt-4 uppercase tracking-[0.2em] transition-colors"
                >
                  I'll do this later
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
