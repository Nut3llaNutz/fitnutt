import { useState } from "react";
import { Layout } from "@/components/Layout";
import { usePlaybook } from "@/hooks/usePlaybook";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dumbbell, Pencil, Trash2, Plus, Check, RotateCcw } from "lucide-react";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const Schedule = () => {
  const todayIndex = (new Date().getDay() + 6) % 7;
  const [selected, setSelected] = useState(days[todayIndex]);
  const [editMode, setEditMode] = useState(false);
  const [newExercise, setNewExercise] = useState({ name: "", sets: "" });

  const { schedule, updateDayTitle, addExercise, updateExercise, deleteExercise, resetToDefault } = usePlaybook();
  const day = schedule[selected];

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
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">The Playbook</h1>
          <div className="flex gap-2">
            {editMode && (
              <Button size="sm" variant="ghost" onClick={handleReset} className="text-destructive hover:text-destructive px-2">
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
            <Button size="sm" variant={editMode ? "default" : "outline"} onClick={() => setEditMode(!editMode)}>
              {editMode ? <><Check className="h-4 w-4 mr-1" />Done</> : <><Pencil className="h-4 w-4 mr-1" />Edit</>}
            </Button>
          </div>
        </div>

        {/* Day selector */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {days.map((d) => (
            <button
              key={d}
              onClick={() => handleSelectDay(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selected === d ? "bg-primary text-primary-foreground" : "bg-card text-card-foreground hover:bg-muted"
              }`}
            >
              {d.slice(0, 3)}
            </button>
          ))}
        </div>

        {/* Workout card */}
        <div className="bg-card rounded-xl p-4 space-y-4">
          {/* Day title */}
          <div className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary flex-shrink-0" />
            {editMode ? (
              <Input
                value={day.title}
                onChange={(e) => updateDayTitle(selected, e.target.value)}
                className="text-base font-bold h-8 border-dashed"
              />
            ) : (
              <h2 className="text-lg font-bold text-card-foreground">{day.title}</h2>
            )}
          </div>

          {/* Exercises */}
          <div className="space-y-1">
            {day.exercises.map((ex, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 py-2 ${!editMode ? "border-b border-border last:border-0" : ""}`}
              >
                {editMode ? (
                  <>
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <Input
                        value={ex.name}
                        onChange={(e) => updateExercise(selected, i, { ...ex, name: e.target.value })}
                        placeholder="Exercise name"
                        className="h-8 text-sm"
                      />
                      <Input
                        value={ex.sets}
                        onChange={(e) => updateExercise(selected, i, { ...ex, sets: e.target.value })}
                        placeholder="Sets / reps"
                        className="h-8 text-sm"
                      />
                    </div>
                    <button
                      onClick={() => deleteExercise(selected, i)}
                      className="p-1 text-destructive hover:text-destructive/70 flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-card-foreground font-medium text-sm">{ex.name}</span>
                    <span className="text-muted-foreground text-xs">{ex.sets}</span>
                  </>
                )}
              </div>
            ))}

            {/* Add exercise row (edit mode only) */}
            {editMode && (
              <div className="flex items-center gap-2 pt-3 border-t border-dashed border-border">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <Input
                    value={newExercise.name}
                    onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                    placeholder="New exercise..."
                    className="h-8 text-sm"
                    onKeyDown={(e) => e.key === "Enter" && handleAddExercise()}
                  />
                  <Input
                    value={newExercise.sets}
                    onChange={(e) => setNewExercise({ ...newExercise, sets: e.target.value })}
                    placeholder="Sets / reps..."
                    className="h-8 text-sm"
                    onKeyDown={(e) => e.key === "Enter" && handleAddExercise()}
                  />
                </div>
                <button
                  onClick={handleAddExercise}
                  disabled={!newExercise.name.trim()}
                  className="p-1 text-primary hover:text-primary/70 disabled:opacity-30 flex-shrink-0"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Schedule;
