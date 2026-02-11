import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import StudentLayout from "@/components/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/PullToRefreshIndicator";
import { TimetableSkeleton } from "@/components/PageSkeletons";
import { AnimatedTransition } from "@/components/AnimatedTransition";

export default function Timetable() {
  const [timetable, setTimetable] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const loadProfile = useCallback(async () => {
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
  }, []);

  const loadTimetable = useCallback(async () => {
    if (!profile) return;
    try {
      const { data } = await supabase
        .from("timetables")
        .select("*")
        .eq("course_name", profile.course_name)
        .eq("year", profile.year)
        .eq("section", profile.section)
        .order("day_of_week")
        .order("start_time");

      if (data) {
        setTimetable(data);
      }
    } finally {
      setLoading(false);
    }
  }, [profile]);

  const handleRefresh = useCallback(async () => {
    await loadTimetable();
  }, [loadTimetable]);

  const { isRefreshing, pullDistance, threshold } = usePullToRefresh({ onRefresh: handleRefresh });

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (profile) {
      loadTimetable();
    }
  }, [profile, loadTimetable]);

  const getTimetableForDay = (day: string) => {
    return timetable.filter((entry) => entry.day_of_week === day);
  };

  return (
    <StudentLayout>
      <PullToRefreshIndicator 
        pullDistance={pullDistance} 
        threshold={threshold} 
        isRefreshing={isRefreshing} 
      />
      <div data-pull-to-refresh className="space-y-4 sm:space-y-6 h-full overflow-y-auto">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Class Timetable</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {profile && `${profile.course_name} - Year ${profile.year} - Section ${profile.section}`}
          </p>
        </div>

        <AnimatedTransition
          show={!loading}
          fallback={<TimetableSkeleton />}
        >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {daysOfWeek.map((day) => {
            const daySchedule = getTimetableForDay(day);
            return (
              <Card key={day}>
                <CardHeader>
                  <CardTitle className="text-lg">{day}</CardTitle>
                </CardHeader>
                <CardContent>
                  {daySchedule.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No classes</p>
                  ) : (
                    <div className="space-y-3">
                      {daySchedule.map((entry) => (
                        <div key={entry.id} className="p-3 rounded-lg bg-muted/50 space-y-1">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Clock className="h-4 w-4" />
                            {entry.start_time} - {entry.end_time}
                          </div>
                          <p className="text-sm font-semibold">{entry.subject}</p>
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
        </AnimatedTransition>
      </div>
    </StudentLayout>
  );
}
