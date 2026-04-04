import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (resetMode) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Check your email", description: "Password reset link sent!" });
        setResetMode(false);
      }
      setLoading(false);
      return;
    }

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ title: "Login failed", description: error.message, variant: "destructive" });
      }
      // On success, the useEffect above handles the redirect via user state change
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) {
        toast({ title: "Signup failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Account created!", description: "Check your email to confirm." });
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3">
          <img src="/fitnutt-logo.png" alt="FitNutt" className="h-20 w-20" />
          <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            FitNutt
          </h1>
          <p className="text-muted-foreground text-sm">Lean bulking, your way.</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {!resetMode && (
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "..." : resetMode ? "Send Reset Link" : isLogin ? "Log In" : "Sign Up"}
          </Button>
        </form>

        <div className="flex flex-col items-center gap-2 text-sm">
          {!resetMode && (
            <button
              onClick={() => setResetMode(true)}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Forgot password?
            </button>
          )}
          <button
            onClick={() => { setIsLogin(!isLogin); setResetMode(false); }}
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            {isLogin ? "Need an account? Sign up" : "Already have an account? Log in"}
          </button>
          {resetMode && (
            <button
              onClick={() => setResetMode(false)}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Back to login
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
