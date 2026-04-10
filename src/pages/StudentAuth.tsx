import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithProfile } from "@/integrations/firebase/auth";
import { getSession, clearSession } from "@/integrations/firebase/session";
import { getDocById } from "@/integrations/firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { z } from "zod";
import { Eye, EyeOff, GraduationCap, Loader2 } from "lucide-react";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { ThemeToggle } from "@/components/ThemeToggle";

const loginSchema = z.object({
  enrollment_number: z
    .string()
    .regex(/^\d+$/, "Enrollment number must be numeric")
    .min(6, "Invalid enrollment number")
    .max(20, "Enrollment number too long"),
  password: z.string().min(1, "Password required"),
});

export default function StudentAuth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const session = getSession();
      if (session?.userType === "student") {
        const profile = await getDocById<{ verify?: boolean; profile_completed?: boolean }>(
          "profiles",
          session.user.id
        );
        if (profile?.verify) {
          if (!profile.profile_completed) {
            navigate("/student/profile-complete");
            return;
          }
          navigate("/student/dashboard");
          return;
        }
      }
      setCheckingSession(false);
    };

    checkSession();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const formValues = {
      enrollment_number: formData.get("enrollment_number") as string,
      password: formData.get("password") as string,
    };

    const validation = loginSchema.safeParse(formValues);
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      setLoading(false);
      return;
    }

    const { user, error } = await signInWithProfile(
      "profiles",
      "enrollment_number",
      validation.data.enrollment_number,
      validation.data.password,
      "student"
    );

    if (error) {
      toast.error(error);
      setLoading(false);
      return;
    }

    if (!user?.verify) {
      toast.error("Your account is pending approval by the admin");
      clearSession();
      setLoading(false);
      return;
    }

    if (!user.profile_completed) {
      toast.success("Welcome! Please complete your profile.");
      setLoading(false);
      navigate("/student/profile-complete");
      return;
    }

    toast.success("Login successful!");
    navigate("/student/dashboard");

    setLoading(false);
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedBackground />
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <AnimatedBackground />

      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md bg-card/80 backdrop-blur-xl border-2 shadow-2xl relative z-10">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
              <GraduationCap className="w-7 h-7 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center font-bold">Student Portal</CardTitle>
          <CardDescription className="text-center">
            Sign in with your enrollment number
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="enrollment_number">Enrollment Number</Label>
              <Input id="enrollment_number" name="enrollment_number" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" name="password" type={showPassword ? "text" : "password"} required />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Forgot your password? Contact the admin.
            </p>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Button variant="link" onClick={() => navigate("/")}>
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
