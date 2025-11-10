import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import StudentLayout from "@/components/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bell } from "lucide-react";
import { format } from "date-fns";

export default function Notices() {
  const [notices, setNotices] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (profile) {
      loadNotices();
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
      if (data) {
        setProfile(data);
      }
    }
  };

  const loadNotices = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("type", "notice")
      .order("created_at", { ascending: false });

    if (data) {
      // Filter notices based on targeting
      const filteredNotices = data.filter((notice) => {
        const courseMatch = !notice.target_course || notice.target_course === profile.course_name;
        const yearMatch = !notice.target_year || notice.target_year === profile.year;
        const sectionMatch = !notice.target_section || notice.target_section === profile.section;
        return courseMatch && yearMatch && sectionMatch;
      });
      setNotices(filteredNotices);
    }
  };

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Notice Board</h1>
          <p className="text-muted-foreground">Important announcements and updates</p>
        </div>

        {notices.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">No notices available</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {notices.map((notice) => (
              <Card key={notice.id}>
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bell className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{notice.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {format(new Date(notice.created_at), "PPP")}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {notice.message}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
