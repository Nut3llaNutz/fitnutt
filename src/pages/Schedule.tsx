import { useState } from "react";
import { usePlaybook } from "@/hooks/usePlaybook";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDailyLog } from "@/hooks/useDailyLog";
import { PumpLevelCard } from "@/components/PumpLevelCard";
import { useAuth } from "@/contexts/AuthContext";
import { Nut3llaPrompt } from "@/components/Nut3llaPrompt";
import { Dumbbell, Pencil, Trash2, Plus, Check, RotateCcw, CheckCircle2 } from "lucide-react";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const Schedule = () => {
  const todayIndex = (new Date().getDay() + 6) % 7;
  const currentDayName = days[todayIndex];
  const [selected, setSelected] = useState(days[todayIndex]);
  const [editMode, setEditMode] = useState(false);
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [newExercise, setNewExercise] = useState({ name: "", sets: "" });

  const { isGuest } = useAuth();

  const { schedule, updateDayTitle, addExercise, updateExercise, deleteExercise, resetToDefault } = usePlaybook();
  const { log, toggleExercise } = useDailyLog();
  const day = schedule[selected];

  const completedExercises = (log as any)?.completed_exercises || [];

  const handleAddExercise = () => {
    if (!newExercise.name.trim()) return;
    addExercise(selected, { name: newExercise.name.trim(), sets: newExercise.sets.trim() || "—" });
    setNewExercise({ name: "", sets: "" });
  };

  const handleSelectDay = (d: string) => {
    setSelected(d);
    setEditMode(false);
    setNewExercise({ name: "", sets: "" });
  };

  const handleReset = () => {
    if (window.confirm("Reset to the default schedule? All your changes will be lost.")) {
      resetToDefault();
      setEditMode(false);
    }
  };

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">The Playbook</h1>
          <div className="flex gap-2">
            {editMode && (
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={handleReset} 
                className="h-9 w-9 text-destructive hover:bg-destructive/10 rounded-xl"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
            <Button 
                size="icon" 
                variant="outline" 
                onClick={() => {
                    if (isGuest) {
                        setShowGuestPrompt(true);
                    } else {
                        setEditMode(!editMode);
                    }
                }}
                className="h-9 w-9 rounded-xl border-primary/20 bg-background/50 backdrop-blur-sm transition-all active:scale-95 shadow-lg shadow-black/5 text-primary"
            >
              {editMode ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Pump Level Overview */}
        <div className="px-1">
          <PumpLevelCard variant="compact" />
        </div>

        {/* Day selector */}
        <div className="flex gap-1 w-full px-1 py-1">
          {days.map((d) => (
            <button
              key={d}
              onClick={() => handleSelectDay(d)}
              className={`flex-1 py-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-tighter transition-all duration-300 relative ${
                selected === d 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105 z-10" 
                  : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
              }`}
            >
              {d.slice(0, 3)}
              {d === currentDayName && (
                <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary border-2 border-background ${selected === d ? 'hidden' : 'block'}`} />
              )}
            </button>
          ))}
        </div>

        {/* Workout card */}
        <div className="bg-card rounded-[2rem] p-6 shadow-xl border border-primary/5 space-y-6">
          {/* Day title */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Training Protocol</span>
              {editMode ? (
                <Input
                  value={day.title}
                  onChange={(e) => updateDayTitle(selected, e.target.value)}
                  className="text-lg font-bold h-9 border-dashed mt-1"
                />
              ) : (
                <h2 className="text-xl font-black italic text-card-foreground tracking-tight">{day.title}</h2>
              )}
            </div>
          </div>

          {/* Exercises */}
          <div className="space-y-3">
            {day.exercises.map((ex, i) => {
              const isCompleted = completedExercises.includes(ex.name);
              
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${
                    !editMode 
                      ? isCompleted 
                        ? "bg-primary/5 border border-primary/20 opacity-60" 
                        : "bg-muted/30 border border-transparent hover:bg-muted/50" 
                      : ""
                  }`}
                >
                  {editMode ? (
                    <>
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <Input
                          value={ex.name}
                          onChange={(e) => updateExercise(selected, i, { ...ex, name: e.target.value })}
                          placeholder="Exercise name"
                          className="h-9 text-sm rounded-xl"
                        />
                        <Input
                          value={ex.sets}
                          onChange={(e) => updateExercise(selected, i, { ...ex, sets: e.target.value })}
                          placeholder="Sets / reps"
                          className="h-9 text-sm rounded-xl"
                        />
                      </div>
                      <button
                        onClick={() => deleteExercise(selected, i)}
                        className="p-2 text-destructive hover:bg-destructive/10 rounded-xl flex-shrink-0 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => toggleExercise.mutate(ex.name)}
                        className={`h-8 w-8 rounded-xl border-2 flex items-center justify-center transition-all duration-500 scale-100 active:scale-90 ${
                          isCompleted
                            ? "bg-primary border-primary text-primary-foreground rotate-0 shadow-lg shadow-primary/30"
                            : "bg-card border-primary/20 text-transparent rotate-[-15deg]"
                        }`}
                      >
                        <Check strokeWidth={4} className={`h-4 w-4 transition-transform duration-500 ${isCompleted ? "scale-100" : "scale-0"}`} />
                      </button>
                      <div className="flex-1">
                        <p className={`font-bold text-sm tracking-tight ${isCompleted ? "line-through text-muted-foreground" : "text-card-foreground"}`}>
                          {ex.name}
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">
                          {ex.sets}
                        </p>
                      </div>
                      {isCompleted && <CheckCircle2 className="h-4 w-4 text-primary animate-in zoom-in" />}
                    </>
                  )}
                </div>
              );
            })}

            {/* Add exercise row (edit mode only) */}
            {editMode && (
              <div className="flex items-center gap-2 pt-4 border-t border-dashed border-border">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <Input
                    value={newExercise.name}
                    onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                    placeholder="New exercise..."
                    className="h-9 text-sm rounded-xl"
                    onKeyDown={(e) => e.key === "Enter" && handleAddExercise()}
                  />
                  <Input
                    value={newExercise.sets}
                    onChange={(e) => setNewExercise({ ...newExercise, sets: e.target.value })}
                    placeholder="Sets / reps..."
                    className="h-9 text-sm rounded-xl"
                    onKeyDown={(e) => e.key === "Enter" && handleAddExercise()}
                  />
                </div>
                <button
                  onClick={handleAddExercise}
                  disabled={!newExercise.name.trim()}
                  className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 disabled:opacity-30 flex-shrink-0 transition-all active:scale-90"
                >
                  <Plus className="h-6 w-6" strokeWidth={3} />
                </button>
              </div>
            )}
          </div>
        </div>

      {showGuestPrompt && (
        <Nut3llaPrompt 
          description="Followin' the protocol is smart, but customize your own path requires you to be a Resident. Sign up to save your own custom routines."
          onClose={() => setShowGuestPrompt(false)}
        />
      )}
    </div>
  );
};

export default Schedule;
