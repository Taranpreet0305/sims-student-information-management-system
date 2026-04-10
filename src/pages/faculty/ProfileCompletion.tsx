import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import FacultyLayout from "@/components/FacultyLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function FacultyProfileCompletion() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<string>("");
  const [department, setDepartment] = useState<string>("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/faculty-auth");
      return;
    }

    const { data } = await supabase
      .from("faculty_profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (data) {
      setProfile(data);
      if (data.role) setRole(data.role);
      if (data.department) setDepartment(data.department);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile) return;

    setLoading(true);
    const formData = new FormData(e.currentTarget);

    const { error } = await supabase
      .from("faculty_profiles")
      .update({
        name: formData.get("name") as string,
        dob: formData.get("dob") as string,
        role,
        department,
        profile_completed: true,
      })
      .eq("id", profile.id);

    if (error) {
      toast.error("Failed to complete profile");
    } else {
      toast.success("Profile completed successfully!");
      navigate("/faculty/dashboard");
    }

    setLoading(false);
  };

  if (!profile) {
    return (
      <FacultyLayout>
        <div className="flex items-center justify-center h-96">Loading...</div>
      </FacultyLayout>
    );
  }

  return (
    <FacultyLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Complete Your Profile</h1>
          <p className="text-muted-foreground">Please fill in the required details to continue.</p>
        </div>

        <Card className="bg-card/80 border border-border/60 shadow-none backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Faculty Details</CardTitle>
            <CardDescription>Fields marked by admin are prefilled and read-only.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" defaultValue={profile.name || ""} required className="bg-background/60 border-border/60 focus-visible:ring-primary/40" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input id="dob" name="dob" type="date" required className="bg-background/60 border-border/60 focus-visible:ring-primary/40" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Associate Professor">Associate Professor</SelectItem>
                      <SelectItem value="Assistant Professor">Assistant Professor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select value={department} onValueChange={setDepartment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BBA">BBA</SelectItem>
                      <SelectItem value="BCOM">BCOM</SelectItem>
                      <SelectItem value="BCA">BCA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <input type="hidden" name="role" value={role} />
              <input type="hidden" name="department" value={department} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="faculty_id">Faculty ID</Label>
                  <Input id="faculty_id" value={profile.faculty_id} readOnly className="bg-background/60 border-border/60" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={profile.email || ""} readOnly className="bg-background/60 border-border/60" />
                </div>
              </div>

              <Button type="submit" disabled={loading || !role || !department} className="bg-primary/90 hover:bg-primary">
                {loading ? "Saving..." : "Complete Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </FacultyLayout>
  );
}
