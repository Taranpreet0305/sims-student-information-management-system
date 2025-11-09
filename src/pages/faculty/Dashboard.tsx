import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import FacultyLayout from "@/components/FacultyLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User, Mail, Phone, Building, BookOpen, Users, UserCheck, Clock, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useFacultyRole } from "@/hooks/useFacultyRole";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

interface DashboardStats {
  totalStudents: number;
  pendingApprovals: number;
  averageAttendance: number;
  attendanceBySubject: { subject: string; percentage: number }[];
}

export default function FacultyDashboard() {
  const { profile, isAdmin, isModerator, isClassCoordinator, loading } = useFacultyRole();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    pendingApprovals: 0,
    averageAttendance: 0,
    attendanceBySubject: [],
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (profile) {
      loadDashboardStats();
    }
  }, [profile, isAdmin, isClassCoordinator]);

  const loadDashboardStats = async () => {
    if (!profile) return;

    try {
      setLoadingStats(true);

      // Get total students count
      let studentsQuery = supabase.from("profiles").select("*", { count: "exact", head: true });
      
      if (!isAdmin && isClassCoordinator) {
        studentsQuery = studentsQuery
          .eq("course_name", profile.assigned_course)
          .eq("year", profile.assigned_year)
          .eq("section", profile.assigned_section);
      }

      const { count: totalStudents } = await studentsQuery;

      // Get pending approvals count
      let approvalsQuery = supabase.from("profiles").select("*", { count: "exact", head: true }).eq("verify", false);
      
      if (!isAdmin && isClassCoordinator) {
        approvalsQuery = approvalsQuery
          .eq("course_name", profile.assigned_course)
          .eq("year", profile.assigned_year)
          .eq("section", profile.assigned_section);
      }

      const { count: pendingApprovals } = await approvalsQuery;

      // Get attendance data
      let attendanceQuery = supabase.from("attendance").select("*");
      
      if (!isAdmin && isClassCoordinator) {
        const { data: students } = await supabase
          .from("profiles")
          .select("enrollment_number")
          .eq("course_name", profile.assigned_course)
          .eq("year", profile.assigned_year)
          .eq("section", profile.assigned_section);

        if (students && students.length > 0) {
          const enrollmentNumbers = students.map(s => s.enrollment_number);
          attendanceQuery = attendanceQuery.in("enrollment_number", enrollmentNumbers);
        }
      }

      const { data: attendanceData } = await attendanceQuery;

      // Calculate average attendance
      let totalAttendance = 0;
      let attendanceCount = 0;
      const subjectAttendance: Record<string, { total: number; attended: number }> = {};

      if (attendanceData && attendanceData.length > 0) {
        attendanceData.forEach(record => {
          if (record.total_classes > 0) {
            const percentage = (record.classes_attended / record.total_classes) * 100;
            totalAttendance += percentage;
            attendanceCount++;

            if (!subjectAttendance[record.subject]) {
              subjectAttendance[record.subject] = { total: 0, attended: 0 };
            }
            subjectAttendance[record.subject].total += record.total_classes;
            subjectAttendance[record.subject].attended += record.classes_attended;
          }
        });
      }

      const averageAttendance = attendanceCount > 0 ? totalAttendance / attendanceCount : 0;

      const attendanceBySubject = Object.entries(subjectAttendance).map(([subject, data]) => ({
        subject,
        percentage: data.total > 0 ? (data.attended / data.total) * 100 : 0,
      }));

      setStats({
        totalStudents: totalStudents || 0,
        pendingApprovals: pendingApprovals || 0,
        averageAttendance: Math.round(averageAttendance),
        attendanceBySubject,
      });
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  if (loading || !profile) {
    return (
      <FacultyLayout>
        <div className="flex items-center justify-center h-96">Loading...</div>
      </FacultyLayout>
    );
  }

  return (
    <FacultyLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Welcome, {profile.name}!</h1>
          <p className="text-muted-foreground">View your faculty profile and responsibilities</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {isAdmin && <Badge variant="default">Administrator</Badge>}
          {isModerator && <Badge variant="secondary">Moderator</Badge>}
          {isClassCoordinator && <Badge variant="outline">Class Coordinator</Badge>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loadingStats ? "..." : stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {isClassCoordinator && !isAdmin ? "In your class" : "All students"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loadingStats ? "..." : stats.pendingApprovals}</div>
              <p className="text-xs text-muted-foreground mt-1">Students awaiting verification</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Attendance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loadingStats ? "..." : `${stats.averageAttendance}%`}</div>
              <p className="text-xs text-muted-foreground mt-1">Overall class average</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faculty ID</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile.faculty_id}</div>
            </CardContent>
          </Card>
        </div>

        {stats.attendanceBySubject.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Attendance by Subject</CardTitle>
              <CardDescription>Average attendance percentage across subjects</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  percentage: {
                    label: "Attendance %",
                    color: "hsl(var(--primary))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.attendanceBySubject}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="subject" 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--foreground))' }}
                    />
                    <YAxis 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--foreground))' }}
                      domain={[0, 100]}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="percentage" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profile.department && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Department</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{profile.department}</div>
              </CardContent>
            </Card>
          )}

          {isClassCoordinator && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assigned Class</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {profile.assigned_course} - Year {profile.assigned_year} ({profile.assigned_section})
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Full Name</p>
                <p className="text-sm text-muted-foreground">{profile.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
              </div>
            </div>
            {profile.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">{profile.phone}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </FacultyLayout>
  );
}
