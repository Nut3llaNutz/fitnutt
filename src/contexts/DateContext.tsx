import React, { createContext, useContext, useState, ReactNode } from "react";
import { getTodayStr } from "@/lib/dateUtils";

interface DateContextType {
  currentDate: string;
  setCurrentDate: (date: string) => void;
  resetToToday: () => void;
}

const DateContext = createContext<DateContextType | undefined>(undefined);

export const DateProvider = ({ children }: { children: ReactNode }) => {
  const [currentDate, setCurrentDate] = useState(getTodayStr());

  const resetToToday = () => setCurrentDate(getTodayStr());

  return (
    <DateContext.Provider value={{ currentDate, setCurrentDate, resetToToday }}>
      {children}
    </DateContext.Provider>
  );
};

export const useDate = () => {
  const context = useContext(DateContext);
  if (context === undefined) {
    throw new Error("useDate must be used within a DateProvider");
  }
  return context;
};
