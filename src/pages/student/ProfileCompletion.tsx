import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import StudentLayout from "@/components/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function StudentProfileCompletion() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [admissionYear, setAdmissionYear] = useState<number | null>(null);
  const [section, setSection] = useState<string>("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/student-auth");
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (data) {
      setProfile(data);
      if (data.admission_year) setAdmissionYear(data.admission_year);
      if (data.section) setSection(data.section);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile) return;

    setLoading(true);
    const formData = new FormData(e.currentTarget);

    const admissionYearValue = parseInt(formData.get("admission_year") as string);
    const sectionValue = formData.get("section") as string;

    if (admissionYearValue === 2023 && !sectionValue) {
      toast.error("Section is required for admission year 2023");
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        name: formData.get("name") as string,
        dob: formData.get("dob") as string,
        aadhaar_number: formData.get("aadhaar_number") as string,
        email: formData.get("email") as string,
        course_name: formData.get("course") as string,
        course: formData.get("course") as string,
        year: parseInt(formData.get("year") as string),
        admission_year: admissionYearValue,
        section: admissionYearValue === 2023 ? sectionValue : "GENERAL",
        profile_completed: true,
      })
      .eq("id", profile.id);

    if (error) {
      toast.error("Failed to complete profile");
    } else {
      toast.success("Profile completed successfully!");
      navigate("/student/dashboard");
    }

    setLoading(false);
  };

  if (!profile) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center h-96">Loading...</div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Complete Your Profile</h1>
          <p className="text-muted-foreground">Please fill in the required details to continue.</p>
        </div>

        <Card className="bg-card/80 border border-border/60 shadow-none backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Student Details</CardTitle>
            <CardDescription>Fields marked by admin are prefilled and read-only.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" defaultValue={profile.name || ""} required className="bg-background/60 border-border/60 focus-visible:ring-primary/40" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input id="dob" name="dob" type="date" required className="bg-background/60 border-border/60 focus-visible:ring-primary/40" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aadhaar_number">Aadhaar Number</Label>
                  <Input id="aadhaar_number" name="aadhaar_number" required className="bg-background/60 border-border/60 focus-visible:ring-primary/40" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" defaultValue={profile.email || ""} required className="bg-background/60 border-border/60 focus-visible:ring-primary/40" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="course">Course</Label>
                  <Input id="course" name="course" defaultValue={profile.course_name || profile.course || ""} required className="bg-background/60 border-border/60 focus-visible:ring-primary/40" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input id="year" name="year" type="number" min="1" max="8" defaultValue={profile.year || ""} required className="bg-background/60 border-border/60 focus-visible:ring-primary/40" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="admission_year">Admission Year</Label>
                  <Input
                    id="admission_year"
                    name="admission_year"
                    type="number"
                    min="2000"
                    max="2100"
                    value={admissionYear ?? ""}
                    onChange={(e) => setAdmissionYear(parseInt(e.target.value))}
                    required
                    className="bg-background/60 border-border/60 focus-visible:ring-primary/40"
                  />
                </div>
                {admissionYear === 2023 && (
                  <div className="space-y-2">
                    <Label htmlFor="section">Section</Label>
                    <Select value={section} onValueChange={setSection}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select section" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DBIT">DBIT</SelectItem>
                        <SelectItem value="BTTS">BTTS</SelectItem>
                      </SelectContent>
                    </Select>
                    <input type="hidden" name="section" value={section} />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="enrollment_number">Enrollment Number</Label>
                  <Input id="enrollment_number" value={profile.enrollment_number} readOnly className="bg-background/60 border-border/60" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="student_id">Student ID</Label>
                  <Input id="student_id" value={profile.student_id} readOnly className="bg-background/60 border-border/60" />
                </div>
              </div>

              <Button type="submit" disabled={loading} className="bg-primary/90 hover:bg-primary">
                {loading ? "Saving..." : "Complete Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </StudentLayout>
  );
}
