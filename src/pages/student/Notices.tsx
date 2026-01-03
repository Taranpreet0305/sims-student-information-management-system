import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import StudentLayout from "@/components/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bell, Paperclip } from "lucide-react";
import { format } from "date-fns";
import { PDFPreview } from "@/components/PDFPreview";
import { Badge } from "@/components/ui/badge";

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
      <div className="space-y-4 sm:space-y-6 px-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Notice Board</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Important announcements and updates</p>
        </div>

        {notices.length === 0 ? (
          <Card className="modern-card">
            <CardContent className="py-8 sm:py-12 text-center">
              <Bell className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No notices available</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {notices.map((notice) => (
              <Card key={notice.id} className="modern-card card-hover">
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                      <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <CardTitle className="text-base sm:text-lg">{notice.title}</CardTitle>
                        {notice.attachment_url && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <Paperclip className="h-3 w-3" />
                            Attachment
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="mt-1 text-xs sm:text-sm">
                        {format(new Date(notice.created_at), "PPP 'at' p")}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6 pt-0">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {notice.message}
                  </p>
                  {notice.attachment_url && (
                    <div className="mt-4 pt-4 border-t">
                      <PDFPreview 
                        url={notice.attachment_url} 
                        title={`Attachment: ${notice.title}`}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
