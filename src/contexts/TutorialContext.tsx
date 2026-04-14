import React, { createContext, useContext, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "@/hooks/useSettings";
import { useAuth } from "./AuthContext";

interface TutorialContextType {
  isActive: boolean;        // tour overlay is running
  chapter: number;          // which chapter of the tour we're on
  showInvite: boolean;      // whether to show the "click me" invite bubble
  startTutorial: () => void;
  nextChapter: () => void;
  completeTutorial: () => void;
  dismissInvite: () => void; // hides invite for this session only (NOT permanent)
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export const TutorialProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const { loading: authLoading, isGuest } = useAuth();
  const { settings, updateSettings, isLoading: settingsLoading } = useSettings();
  
  // Guests ALWAYS see the prompt on refresh. Logged-in users rely strictly on their db settings.
  const alreadyDone = isGuest ? false : !!settings?.tutorial_completed;

  const [isActive, setIsActive] = useState(false);
  const [chapter, setChapter] = useState(0);
  const [inviteDismissed, setInviteDismissed] = useState(false);

  // Safely don't show the invite while we're still checking auth or fetching settings
  const showInvite = !authLoading && !settingsLoading && !alreadyDone && !isActive && !inviteDismissed;

  const startTutorial = useCallback(() => {
    setChapter(0);
    setIsActive(true);
    navigate("/");
  }, [navigate]);

  const nextChapter = useCallback(() => {
    setChapter(prev => prev + 1);
  }, []);

  const completeTutorial = useCallback(() => {
    updateSettings.mutate({ tutorial_completed: true });
    setIsActive(false);
    setChapter(0);
    setInviteDismissed(true); // Keep it away for this session!
  }, [updateSettings]);

  const dismissInvite = useCallback(() => {
    setInviteDismissed(true);
    if (!isGuest) {
      // If a logged-in user clicks 'X', they permanently skip the tour on all their devices!
      updateSettings.mutate({ tutorial_completed: true });
    }
  }, [isGuest, updateSettings]);

  return (
    <TutorialContext.Provider value={{
      isActive, chapter, showInvite,
      startTutorial, nextChapter, completeTutorial, dismissInvite
    }}>
      {children}
    </TutorialContext.Provider>
  );
};

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (!context) throw new Error("useTutorial must be used within a TutorialProvider");
  return context;
};
