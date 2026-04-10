import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithProfile } from "@/integrations/firebase/auth";
import { clearSession } from "@/integrations/firebase/session";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { z } from "zod";
import { Eye, EyeOff, Shield } from "lucide-react";

const loginSchema = z.object({
  faculty_id: z.string().min(3, "Invalid admin ID").max(20, "Admin ID too long"),
  password: z.string().min(1, "Password required"),
});

export default function AdminAuth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const formValues = {
      faculty_id: formData.get("faculty_id") as string,
      password: formData.get("password") as string,
    };

    const validation = loginSchema.safeParse(formValues);
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      setLoading(false);
      return;
    }

    const { user, error } = await signInWithProfile(
      "faculty_profiles",
      "faculty_id",
      validation.data.faculty_id,
      validation.data.password,
      "faculty"
    );

    if (error) {
      toast.error(error);
      setLoading(false);
      return;
    }

    if (!user?.verify) {
      toast.error("Your account is pending approval");
      clearSession();
      setLoading(false);
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isAdmin = roleData?.some((r: any) => r.role === "admin");
    if (!isAdmin) {
      toast.error("You are not an admin");
      clearSession();
      setLoading(false);
      return;
    }

    toast.success("Admin login successful!");
    navigate("/faculty/admin-dashboard");
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <Card className="w-full max-w-md bg-card/80 backdrop-blur-xl border-2 shadow-2xl relative z-10">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
              <Shield className="w-7 h-7 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center font-bold">Admin Portal</CardTitle>
          <CardDescription className="text-center">
            Sign in with admin faculty ID
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="faculty_id">Admin ID</Label>
              <Input id="faculty_id" name="faculty_id" required />
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
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
