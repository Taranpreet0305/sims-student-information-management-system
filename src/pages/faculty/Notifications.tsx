import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import FacultyLayout from "@/components/FacultyLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Send, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useFacultyRole } from "@/hooks/useFacultyRole";

export default function Notifications() {
  const { profile, isAdmin, isModerator, isClassCoordinator, loading: roleLoading } = useFacultyRole();
  const [loading, setLoading] = useState(false);
  const [targetType, setTargetType] = useState("class");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const { data: { user } } = await supabase.auth.getUser();

    let notificationData: any = {
      title: formData.get("title") as string,
      message: formData.get("message") as string,
      created_by: user?.id,
      target_course: null,
      target_year: null,
      target_section: null,
    };

    // Class coordinators can only send to their assigned class
    if (!isAdmin && !isModerator && isClassCoordinator) {
      notificationData.target_course = profile?.assigned_course;
      notificationData.target_year = profile?.assigned_year;
      notificationData.target_section = profile?.assigned_section;
    } else {
      // Admins and moderators can target specific groups
      if (targetType === "class") {
        notificationData.target_course = formData.get("course") as string || null;
        notificationData.target_year = formData.get("year") ? parseInt(formData.get("year") as string) : null;
        notificationData.target_section = formData.get("section") as string || null;
      }
      // If targetType is "all", leave targets as null (broadcasts to everyone)
    }

    const { error } = await supabase.from("notifications").insert(notificationData);

    if (error) {
      toast.error("Failed to create notification");
    } else {
      toast.success("Notification sent successfully!");
      e.currentTarget.reset();
    }

    setLoading(false);
  };

  if (roleLoading) {
    return (
      <FacultyLayout>
        <div className="flex items-center justify-center h-96">Loading...</div>
      </FacultyLayout>
    );
  }

  if (!isAdmin && !isModerator && !isClassCoordinator) {
    return (
      <FacultyLayout>
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-4">
              <AlertCircle className="h-12 w-12 text-muted-foreground" />
              <p className="text-center text-muted-foreground">
                Access Denied: Only Class Coordinators, Moderators, and Administrators can create notifications
              </p>
            </div>
          </CardContent>
        </Card>
      </FacultyLayout>
    );
  }

  return (
    <FacultyLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Create Announcement</h1>
          <p className="text-muted-foreground">
            Send notifications to students
            {!isAdmin && !isModerator && isClassCoordinator && 
              ` in ${profile?.assigned_course} Year ${profile?.assigned_year} (${profile?.assigned_section})`
            }
          </p>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle>New Notification</CardTitle>
            </div>
            <CardDescription>
              Create an announcement for students
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Notification title"
                  required
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="Notification message..."
                  rows={6}
                  required
                  maxLength={1000}
                />
              </div>

              {(isAdmin || isModerator) && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="targetType">Target Audience</Label>
                    <Select value={targetType} onValueChange={setTargetType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Students</SelectItem>
                        <SelectItem value="class">Specific Class</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {targetType === "class" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="course">Course</Label>
                        <Input
                          id="course"
                          name="course"
                          placeholder="e.g., CSE"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="year">Year</Label>
                        <Input
                          id="year"
                          name="year"
                          type="number"
                          min="1"
                          max="6"
                          placeholder="1-6"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="section">Section</Label>
                        <Input
                          id="section"
                          name="section"
                          placeholder="e.g., A"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              {!isAdmin && !isModerator && isClassCoordinator && (
                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    This notification will be sent to: {profile?.assigned_course} Year {profile?.assigned_year} ({profile?.assigned_section})
                  </p>
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full">
                <Send className="mr-2 h-4 w-4" />
                {loading ? "Sending..." : "Send Notification"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </FacultyLayout>
  );
}
