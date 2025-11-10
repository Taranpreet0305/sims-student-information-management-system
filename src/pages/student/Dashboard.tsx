import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import StudentLayout from "@/components/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Phone, BookOpen, Calendar } from "lucide-react";

export default function StudentDashboard() {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(data);
    }
  };

  if (!profile) return null;

  return (
    <StudentLayout>
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1.5 sm:mb-2">Welcome, {profile.name}!</h1>
          <p className="text-sm sm:text-base text-muted-foreground">View your profile information</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Enrollment Number</CardTitle>
              <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold break-all">{profile.enrollment_number}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Student ID</CardTitle>
              <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold break-all">{profile.student_id}</div>
            </CardContent>
          </Card>

          <Card className="sm:col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Course & Year</CardTitle>
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{profile.course_name} - Year {profile.year}</div>
              <p className="text-xs text-muted-foreground mt-1">Section {profile.section}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <User className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium">Full Name</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{profile.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 sm:gap-3">
              <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium">Email</p>
                <p className="text-xs sm:text-sm text-muted-foreground break-all">{profile.email}</p>
              </div>
            </div>
            {profile.phone && (
              <div className="flex items-center gap-2.5 sm:gap-3">
                <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium">Phone</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{profile.phone}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </StudentLayout>
  );
}
