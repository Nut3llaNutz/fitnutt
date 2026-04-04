import { useState, useCallback } from "react";

export interface Exercise {
  name: string;
  sets: string;
}

export interface DaySchedule {
  title: string;
  exercises: Exercise[];
}

export type PlaybookSchedule = Record<string, DaySchedule>;

const DEFAULT_SCHEDULE: PlaybookSchedule = {
  Monday: {
    title: "Upper Body (Heavy Push/Pull & Arms)",
    exercises: [
      { name: "Barbell Bench Press", sets: "3 sets of 8-10" },
      { name: "Pull-ups", sets: "3 sets to failure" },
      { name: "Pike Push-ups", sets: "3 sets of 8-12" },
      { name: "Seated Cable Rows - V-Grip", sets: "3 sets of 10-12" },
      { name: "Dips", sets: "3 sets to failure" },
      { name: "Cable Tricep Pushdowns", sets: "3 sets of 12-15" },
      { name: "Dumbbell Bicep Curls", sets: "3 sets of 10-12" },
    ],
  },
  Tuesday: { title: "Court Day", exercises: [{ name: "Tennis", sets: "1-2 Hours" }] },
  Wednesday: {
    title: "Lower Body, Core & Forearms",
    exercises: [
      { name: "Barbell Squats", sets: "3 sets of 8-10" },
      { name: "Bulgarian Split Squats", sets: "3 sets of 8-10 per leg" },
      { name: "Seated/Lying Leg Curls", sets: "3 sets of 12-15" },
      { name: "Hollow Body Hold", sets: "3 sets, 30-60 sec" },
      { name: "Hanging Leg Raises", sets: "3 sets to failure" },
      { name: "Reverse Barbell/DB Wrist Curls", sets: "3 sets of 15" },
    ],
  },
  Thursday: { title: "Court Day", exercises: [{ name: "Tennis", sets: "1-2 Hours" }] },
  Friday: {
    title: "Full Body (Skill Work & Arm Pump)",
    exercises: [
      { name: "Chest-to-Wall Handstand Holds", sets: "3 sets to time" },
      { name: "Push-ups", sets: "3 sets to failure" },
      { name: "Chin-ups", sets: "3 sets to failure" },
      { name: "Lateral Raises", sets: "3 sets of 15" },
      { name: "Overhead Tricep Extensions", sets: "3 sets of 12" },
      { name: "Dumbbell Hammer Curls", sets: "3 sets of 12" },
      { name: "Calf Raises", sets: "3 sets of 15-20" },
    ],
  },
  Saturday: { title: "Court Day", exercises: [{ name: "Tennis", sets: "1-2 Hours" }] },
  Sunday: { title: "Recovery", exercises: [{ name: "Total Rest", sets: "—" }] },
};

const STORAGE_KEY = "fitnutt_playbook";

const load = (): PlaybookSchedule => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as PlaybookSchedule;
  } catch {}
  return DEFAULT_SCHEDULE;
};

const save = (schedule: PlaybookSchedule) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(schedule)); } catch {}
};

export const usePlaybook = () => {
  const [schedule, setSchedule] = useState<PlaybookSchedule>(load);

  const update = useCallback((updater: (prev: PlaybookSchedule) => PlaybookSchedule) => {
    setSchedule((prev) => {
      const next = updater(prev);
      save(next);
      return next;
    });
  }, []);

  const updateDayTitle = useCallback((day: string, title: string) =>
    update((prev) => ({ ...prev, [day]: { ...prev[day], title } })), [update]);

  const addExercise = useCallback((day: string, exercise: Exercise) =>
    update((prev) => ({ ...prev, [day]: { ...prev[day], exercises: [...prev[day].exercises, exercise] } })), [update]);

  const updateExercise = useCallback((day: string, index: number, exercise: Exercise) =>
    update((prev) => {
      const exercises = [...prev[day].exercises];
      exercises[index] = exercise;
      return { ...prev, [day]: { ...prev[day], exercises } };
    }), [update]);

  const deleteExercise = useCallback((day: string, index: number) =>
    update((prev) => ({
      ...prev,
      [day]: { ...prev[day], exercises: prev[day].exercises.filter((_, i) => i !== index) },
    })), [update]);

  const resetToDefault = useCallback(() => {
    save(DEFAULT_SCHEDULE);
    setSchedule(DEFAULT_SCHEDULE);
  }, []);

  return { schedule, updateDayTitle, addExercise, updateExercise, deleteExercise, resetToDefault };
};
