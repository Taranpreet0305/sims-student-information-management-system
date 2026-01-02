import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import StudentLayout from "@/components/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Phone, BookOpen, Calendar, GraduationCap, TrendingUp, Clock, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function StudentDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    attendance: 0,
    totalMarks: 0,
    pendingNotices: 0
  });

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
      
      if (data) {
        // Load stats
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
  };

  if (!profile) return null;

  const quickLinks = [
    { path: "/student/attendance", icon: Calendar, label: "Attendance", color: "from-blue-500 to-blue-600" },
    { path: "/student/marks", icon: FileText, label: "View Marks", color: "from-green-500 to-green-600" },
    { path: "/student/timetable", icon: Clock, label: "Timetable", color: "from-purple-500 to-purple-600" },
    { path: "/student/notices", icon: TrendingUp, label: "Notices", color: "from-orange-500 to-orange-600" },
  ];

  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary to-accent p-6 text-primary-foreground">
          <div className="relative z-10">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Welcome back, {profile.name}!</h1>
            <p className="text-primary-foreground/80 text-sm sm:text-base">
              {profile.course_name} • Year {profile.year} • Section {profile.section}
            </p>
          </div>
          <GraduationCap className="absolute right-4 bottom-4 h-24 w-24 text-primary-foreground/10" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Attendance</p>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.attendance}%</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500/50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Enrollment</p>
                  <p className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400 truncate">{profile.enrollment_number}</p>
                </div>
                <BookOpen className="h-8 w-8 text-green-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Student ID</p>
                  <p className="text-lg sm:text-xl font-bold text-purple-600 dark:text-purple-400 truncate">{profile.student_id}</p>
                </div>
                <User className="h-8 w-8 text-purple-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Notices</p>
                  <p className="text-2xl sm:text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.pendingNotices}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-500/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Quick Access</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link key={link.path} to={link.path}>
                  <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
                    <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                      <div className={`h-12 w-12 rounded-full bg-gradient-to-r ${link.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <span className="text-sm font-medium">{link.label}</span>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <User className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Full Name</p>
                <p className="text-sm font-medium truncate">{profile.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Mail className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium truncate">{profile.email}</p>
              </div>
            </div>
            {profile.phone && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Phone className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm font-medium">{profile.phone}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <GraduationCap className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Course Details</p>
                <p className="text-sm font-medium">{profile.course_name} • Year {profile.year} • Section {profile.section}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </StudentLayout>
  );
}
