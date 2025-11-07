import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import StudentLayout from "@/components/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bell } from "lucide-react";
import { format } from "date-fns";

export default function StudentNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (profile) {
      loadNotifications();
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

  const loadNotifications = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .or(`target_course.is.null,target_course.eq.${profile.course_name}`)
      .or(`target_year.is.null,target_year.eq.${profile.year}`)
      .or(`target_section.is.null,target_section.eq.${profile.section}`)
      .order("created_at", { ascending: false });

    if (data) {
      setNotifications(data);
    }
  };

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Notifications</h1>
          <p className="text-muted-foreground">Stay updated with announcements</p>
        </div>

        {notifications.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">No notifications yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card key={notification.id}>
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bell className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg">{notification.title}</CardTitle>
                      <CardDescription>
                        {format(new Date(notification.created_at), "PPp")}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{notification.message}</p>
                  {notification.target_course && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                        {notification.target_course}
                      </span>
                      {notification.target_year && (
                        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                          Year {notification.target_year}
                        </span>
                      )}
                      {notification.target_section && (
                        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                          Section {notification.target_section}
                        </span>
                      )}
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
