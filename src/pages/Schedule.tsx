import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Dumbbell } from "lucide-react";

const schedule: Record<string, { title: string; exercises: { name: string; sets: string }[] }> = {
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
  Tuesday: {
    title: "Court Day",
    exercises: [{ name: "Tennis", sets: "1-2 Hours" }],
  },
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
  Thursday: {
    title: "Court Day",
    exercises: [{ name: "Tennis", sets: "1-2 Hours" }],
  },
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
  Saturday: {
    title: "Court Day",
    exercises: [{ name: "Tennis", sets: "1-2 Hours" }],
  },
  Sunday: {
    title: "Recovery",
    exercises: [{ name: "Total Rest", sets: "—" }],
  },
};

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const Schedule = () => {
  const todayIndex = (new Date().getDay() + 6) % 7; // Mon=0
  const [selected, setSelected] = useState(days[todayIndex]);
  const day = schedule[selected];

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">The Playbook</h1>

        {/* Day selector */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {days.map((d) => (
            <button
              key={d}
              onClick={() => setSelected(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selected === d
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-card-foreground hover:bg-muted"
              }`}
            >
              {d.slice(0, 3)}
            </button>
          ))}
        </div>

        {/* Workout */}
        <div className="bg-card rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-card-foreground">{day.title}</h2>
          </div>
          <div className="space-y-3">
            {day.exercises.map((ex, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-card-foreground font-medium text-sm">{ex.name}</span>
                <span className="text-muted-foreground text-xs">{ex.sets}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Schedule;
