import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import FacultyLayout from "@/components/FacultyLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Plus, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useFacultyRole } from "@/hooks/useFacultyRole";

export default function ManageTimetable() {
  const { profile, isAdmin, isClassCoordinator, loading: roleLoading } = useFacultyRole();
  const [timetable, setTimetable] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  useEffect(() => {
    if (profile) {
      loadTimetable();
    }
  }, [profile]);

  const loadTimetable = async () => {
    if (!profile) return;

    let query = supabase.from("timetables").select("*");

    if (!isAdmin && isClassCoordinator) {
      query = query
        .eq("course_name", profile.assigned_course)
        .eq("year", profile.assigned_year)
        .eq("section", profile.assigned_section);
    }

    const { data } = await query.order("day_of_week").order("start_time");

    if (data) {
      setTimetable(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from("timetables").insert({
      course_name: formData.get("course_name") as string,
      year: parseInt(formData.get("year") as string),
      section: formData.get("section") as string,
      day_of_week: formData.get("day_of_week") as string,
      start_time: formData.get("start_time") as string,
      end_time: formData.get("end_time") as string,
      subject: formData.get("subject") as string,
      faculty_name: formData.get("faculty_name") as string,
      room_number: formData.get("room_number") as string,
      created_by: user?.id,
    });

    if (error) {
      toast.error("Failed to add timetable entry");
    } else {
      toast.success("Timetable entry added successfully!");
      e.currentTarget.reset();
      setShowForm(false);
      await loadTimetable();
    }

    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("timetables").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete entry");
    } else {
      toast.success("Entry deleted successfully!");
      await loadTimetable();
    }
  };

  if (roleLoading) {
    return (
      <FacultyLayout>
        <div className="flex items-center justify-center h-96">Loading...</div>
      </FacultyLayout>
    );
  }

  if (!isAdmin && !isClassCoordinator) {
    return (
      <FacultyLayout>
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-4">
              <AlertCircle className="h-12 w-12 text-muted-foreground" />
              <p className="text-center text-muted-foreground">
                Access Denied: Only Class Coordinators and Administrators can manage timetables
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Manage Timetable</h1>
            <p className="text-muted-foreground">
              {profile && isClassCoordinator && !isAdmin
                ? `${profile.assigned_course} - Year ${profile.assigned_year} - Section ${profile.assigned_section}`
                : "Manage all timetables"}
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Entry
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>Add Timetable Entry</CardTitle>
              <CardDescription>Create a new class schedule entry</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="course_name">Course</Label>
                    <Input
                      id="course_name"
                      name="course_name"
                      defaultValue={isClassCoordinator && !isAdmin ? profile?.assigned_course : ""}
                      readOnly={isClassCoordinator && !isAdmin}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      name="year"
                      type="number"
                      defaultValue={isClassCoordinator && !isAdmin ? profile?.assigned_year : ""}
                      readOnly={isClassCoordinator && !isAdmin}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="section">Section</Label>
                    <Input
                      id="section"
                      name="section"
                      defaultValue={isClassCoordinator && !isAdmin ? profile?.assigned_section : ""}
                      readOnly={isClassCoordinator && !isAdmin}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="day_of_week">Day</Label>
                    <Select name="day_of_week" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                      <SelectContent>
                        {daysOfWeek.map((day) => (
                          <SelectItem key={day} value={day}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input id="subject" name="subject" required />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_time">Start Time</Label>
                    <Input id="start_time" name="start_time" type="time" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_time">End Time</Label>
                    <Input id="end_time" name="end_time" type="time" required />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="faculty_name">Faculty Name</Label>
                    <Input id="faculty_name" name="faculty_name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="room_number">Room Number</Label>
                    <Input id="room_number" name="room_number" />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={loading}>
                    {loading ? "Adding..." : "Add Entry"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {daysOfWeek.map((day) => {
            const daySchedule = timetable.filter((entry) => entry.day_of_week === day);
            return (
              <Card key={day}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    {day}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {daySchedule.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No classes scheduled</p>
                  ) : (
                    <div className="space-y-3">
                      {daySchedule.map((entry) => (
                        <div key={entry.id} className="p-3 rounded-lg bg-muted/50 space-y-1 relative group">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDelete(entry.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <div className="text-sm font-medium">
                            {entry.start_time} - {entry.end_time}
                          </div>
                          <p className="text-sm font-semibold">{entry.subject}</p>
                          <p className="text-xs text-muted-foreground">
                            {entry.course_name} Y{entry.year} - {entry.section}
                          </p>
                          {entry.faculty_name && (
                            <p className="text-xs text-muted-foreground">{entry.faculty_name}</p>
                          )}
                          {entry.room_number && (
                            <p className="text-xs text-muted-foreground">Room: {entry.room_number}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </FacultyLayout>
  );
}
