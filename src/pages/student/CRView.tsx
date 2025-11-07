import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import StudentLayout from "@/components/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, User, BookOpen } from "lucide-react";

export default function CRView() {
  const [cr, setCr] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (profile) {
      loadCR();
    }
  }, [profile]);

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

  const loadCR = async () => {
    const { data } = await supabase
      .from("class_representatives")
      .select("*")
      .eq("course_name", profile.course_name)
      .eq("year", profile.year)
      .eq("section", profile.section)
      .maybeSingle();

    if (data) {
      setCr(data);
    }
  };

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Class Representative</h1>
          <p className="text-muted-foreground">Your class CR information</p>
        </div>

        {!cr ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">
                No Class Representative assigned for your class yet
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="max-w-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle>Class Representative</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Name</p>
                  <p className="text-sm text-muted-foreground">{cr.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Student ID</p>
                  <p className="text-sm text-muted-foreground">{cr.student_id}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Enrollment Number</p>
                  <p className="text-sm text-muted-foreground">{cr.enrollment_number}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Class</p>
                  <p className="text-sm text-muted-foreground">
                    {cr.course_name} - Year {cr.year}, Section {cr.section}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </StudentLayout>
  );
}
