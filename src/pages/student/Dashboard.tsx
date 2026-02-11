import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import StudentLayout from "@/components/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Phone, BookOpen, Calendar, GraduationCap, TrendingUp, Clock, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { StaggeredContent, StaggeredItem } from "@/components/StaggeredContent";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { DashboardSkeleton } from "@/components/PageSkeletons";
import { PullToRefreshIndicator } from "@/components/PullToRefreshIndicator";
import { toast } from "sonner";

export default function StudentDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    attendance: 0,
    totalMarks: 0,
    pendingNotices: 0
  });

  const loadProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(data);
        
        if (data) {
          const { data: attendance } = await supabase
            .from("attendance")
            .select("total_classes, classes_attended")
            .eq("enrollment_number", data.enrollment_number);
          
          if (attendance && attendance.length > 0) {
            const totalClasses = attendance.reduce((sum, r) => sum + (r.total_classes || 0), 0);
            const attended = attendance.reduce((sum, r) => sum + (r.classes_attended || 0), 0);
            setStats(prev => ({
              ...prev,
              attendance: totalClasses > 0 ? Math.round((attended / totalClasses) * 100) : 0
            }));
          }

          const { count: noticeCount } = await supabase
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .or(`target_course.is.null,target_course.eq.${data.course_name}`)
            .or(`target_year.is.null,target_year.eq.${data.year}`);
          
          setStats(prev => ({
            ...prev,
            pendingNotices: noticeCount || 0
          }));
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleRefresh = useCallback(async () => {
    await loadProfile();
    toast.success("Dashboard refreshed!");
  }, [loadProfile]);

  const { isRefreshing, pullDistance, threshold } = usePullToRefresh({
    onRefresh: handleRefresh,
  });

  if (loading) {
    return (
      <StudentLayout>
        <DashboardSkeleton />
      </StudentLayout>
    );
  }

  if (!profile) return null;

  const quickLinks = [
    { path: "/student/attendance", icon: Calendar, label: "Attendance", color: "from-blue-500 to-blue-600" },
    { path: "/student/marks", icon: FileText, label: "View Marks", color: "from-green-500 to-green-600" },
    { path: "/student/timetable", icon: Clock, label: "Timetable", color: "from-purple-500 to-purple-600" },
    { path: "/student/notices", icon: TrendingUp, label: "Notices", color: "from-orange-500 to-orange-600" },
  ];

  return (
    <StudentLayout>
      <PullToRefreshIndicator 
        pullDistance={pullDistance} 
        threshold={threshold} 
        isRefreshing={isRefreshing} 
      />
      <div data-pull-to-refresh className="h-full overflow-y-auto">
      <StaggeredContent className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
        <StaggeredItem>
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary to-accent p-4 sm:p-6 text-primary-foreground">
            <div className="relative z-10">
              <h1 className="text-lg sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2 break-words">Welcome back, {profile.name}!</h1>
              <p className="text-primary-foreground/80 text-xs sm:text-sm md:text-base">
                {profile.course_name} • Year {profile.year} • Section {profile.section}
              </p>
            </div>
            <GraduationCap className="absolute right-2 sm:right-4 bottom-2 sm:bottom-4 h-16 w-16 sm:h-24 sm:w-24 text-primary-foreground/10" />
          </div>
        </StaggeredItem>

        <StaggeredItem>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 w-full">
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20 min-w-0">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Attendance</p>
                    <p className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.attendance}%</p>
                  </div>
                  <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500/50 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20 min-w-0">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Enrollment</p>
                    <p className="text-xs sm:text-sm font-bold text-green-600 dark:text-green-400 truncate">{profile.enrollment_number}</p>
                  </div>
                  <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-green-500/50 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20 min-w-0">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Student ID</p>
                    <p className="text-xs sm:text-sm font-bold text-purple-600 dark:text-purple-400 truncate">{profile.student_id}</p>
                  </div>
                  <User className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500/50 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20 min-w-0">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Notices</p>
                    <p className="text-lg sm:text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.pendingNotices}</p>
                  </div>
                  <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500/50 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          </div>
        </StaggeredItem>

        <StaggeredItem>
          <div>
            <h2 className="text-sm sm:text-base md:text-lg font-semibold mb-2 sm:mb-3">Quick Access</h2>
            <div className="grid grid-cols-4 gap-2 sm:gap-3 w-full">
              {quickLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link key={link.path} to={link.path}>
                    <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group min-w-0">
                      <CardContent className="p-2 sm:p-4 flex flex-col items-center text-center gap-1 sm:gap-2">
                        <div className={`h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-full bg-gradient-to-r ${link.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <Icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                        </div>
                        <span className="text-[10px] sm:text-xs md:text-sm font-medium truncate w-full">{link.label}</span>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </StaggeredItem>

        <StaggeredItem>
          <Card className="w-full">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-2">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 sm:gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-muted/50 min-w-0">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Full Name</p>
                  <p className="text-xs sm:text-sm font-medium truncate">{profile.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-muted/50 min-w-0">
                <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Email</p>
                  <p className="text-xs sm:text-sm font-medium truncate">{profile.email}</p>
                </div>
              </div>
              {profile.phone && (
                <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-muted/50 min-w-0">
                  <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Phone</p>
                    <p className="text-xs sm:text-sm font-medium">{profile.phone}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-muted/50 min-w-0">
                <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Course Details</p>
                  <p className="text-xs sm:text-sm font-medium truncate">{profile.course_name} • Y{profile.year} • {profile.section}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </StaggeredItem>
      </StaggeredContent>
      </div>
    </StudentLayout>
  );
}
