import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSettings } from "@/hooks/useSettings";

interface TutorialContextType {
  isActive: boolean;
  step: number;
  setNextStep: () => void;
  startTutorial: () => void;
  completeTutorial: () => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export const TutorialProvider = ({ children }: { children: React.ReactNode }) => {
  const { settings } = useSettings();
  const [isActive, setIsActive] = useState(false);
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize from settings
  useEffect(() => {
    if (settings && settings.tutorial_completed === false) {
      setIsActive(true);
    }
  }, [settings]);

  const setNextStep = useCallback(() => {
    // Stage 1: Dashboard (Done at step 1) -> Navigate to Foods
    if (step === 1) {
      navigate('/foods');
    }
    // Stage 2: Foods (Done at step 2) -> Navigate back to Dashboard for final form
    else if (step === 2) {
      navigate('/');
    }
    
    setStep(prev => prev + 1);
  }, [step, navigate]);

  const startTutorial = () => {
    setIsActive(true);
    setStep(0);
    navigate('/');
  };

  const completeTutorial = () => {
    setIsActive(false);
    setStep(0);
  };

  return (
    <TutorialContext.Provider value={{ isActive, step, setNextStep, startTutorial, completeTutorial }}>
      {children}
    </TutorialContext.Provider>
  );
};

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error("useTutorial must be used within a TutorialProvider");
  }
  return context;
};
