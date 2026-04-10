import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import FacultyLayout from "@/components/FacultyLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User, Mail, Phone, Building, BookOpen, Users, UserCheck, Clock, TrendingUp, Activity, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useFacultyRole } from "@/hooks/useFacultyRole";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { StaggeredContent, StaggeredItem } from "@/components/StaggeredContent";
import { AnimatedLoader } from "@/components/AnimatedLoader";
import { FacultyDashboardSkeleton } from "@/components/PageSkeletons";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/PullToRefreshIndicator";
import { toast } from "sonner";

interface DashboardStats {
  totalStudents: number;
  pendingApprovals: number;
  averageAttendance: number;
  attendanceBySubject: { subject: string; percentage: number }[];
  gradeDistribution: { grade: string; count: number; fill: string }[];
  recentActivity: { date: string; count: number }[];
}

interface ClassRepresentative {
  id: string;
  name: string;
  enrollment_number: string;
  course_name: string;
  year: number;
  section: string;
  designated_at: string;
}

export default function FacultyDashboard() {
  const { profile, isAdmin, isModerator, isClassCoordinator, loading } = useFacultyRole();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    pendingApprovals: 0,
    averageAttendance: 0,
    attendanceBySubject: [],
    gradeDistribution: [],
    recentActivity: [],
  });
  const [classReps, setClassReps] = useState<ClassRepresentative[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  const GRADE_COLORS = ['#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444', '#6b7280'];

  useEffect(() => {
    if (profile) {
      loadDashboardStats();
      loadClassRepresentatives();
    }
  }, [profile, isAdmin, isClassCoordinator]);

  const loadClassRepresentatives = useCallback(async () => {
    try {
      let query = supabase.from("class_representatives").select("*");
      
      if (!isAdmin && isClassCoordinator && profile) {
        query = query
          .eq("course_name", profile.assigned_course)
          .eq("year", profile.assigned_year)
          .eq("section", profile.assigned_section);
      }

      const { data } = await query.order("course_name").order("year").order("section");
      
      if (data) {
        setClassReps(data);
      }
    } catch (error) {
      console.error("Error loading class representatives:", error);
    }
  }, [isAdmin, isClassCoordinator, profile]);

  const loadDashboardStats = useCallback(async () => {
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

      // Get grade distribution from marks
      const { data: marksData } = await supabase.from("student_marks").select("grade");
      const gradeCount: Record<string, number> = {};
      (marksData || []).forEach(m => {
        const grade = m.grade || 'N/A';
        gradeCount[grade] = (gradeCount[grade] || 0) + 1;
      });
      const gradeOrder = ['A+', 'A', 'B+', 'B', 'C', 'F', 'N/A'];
      const gradeDistribution = gradeOrder
        .filter(g => gradeCount[g])
        .map((grade, i) => ({
          grade,
          count: gradeCount[grade],
          fill: GRADE_COLORS[i % GRADE_COLORS.length],
        }));

      // Get recent registrations (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split('T')[0];
      });
      const { data: recentStudents } = await supabase
        .from("profiles")
        .select("created_at")
        .gte("created_at", last7Days[0]);
      
      const activityByDate: Record<string, number> = {};
      last7Days.forEach(d => activityByDate[d] = 0);
      (recentStudents || []).forEach(s => {
        const date = s.created_at?.split('T')[0];
        if (date && activityByDate[date] !== undefined) {
          activityByDate[date]++;
        }
      });
      const recentActivity = last7Days.map(date => ({
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        count: activityByDate[date],
      }));

      setStats({
        totalStudents: totalStudents || 0,
        pendingApprovals: pendingApprovals || 0,
        averageAttendance: Math.round(averageAttendance),
        attendanceBySubject,
        gradeDistribution,
        recentActivity,
      });
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
    } finally {
      setLoadingStats(false);
    }
  }, [profile, isAdmin, isClassCoordinator, GRADE_COLORS]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([loadDashboardStats(), loadClassRepresentatives()]);
    toast.success("Dashboard refreshed!");
  }, [loadDashboardStats, loadClassRepresentatives]);

  const { isRefreshing, pullDistance, threshold } = usePullToRefresh({
    onRefresh: handleRefresh,
  });

  if (loading || !profile) {
    return (
      <FacultyLayout>
        <FacultyDashboardSkeleton />
      </FacultyLayout>
    );
  }

  return (
    <FacultyLayout>
      <PullToRefreshIndicator 
        pullDistance={pullDistance} 
        threshold={threshold} 
        isRefreshing={isRefreshing} 
      />
      <div data-pull-to-refresh className="h-full overflow-y-auto">
      <StaggeredContent className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
        <StaggeredItem>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1.5 sm:mb-2 break-words">Welcome, {profile.name}!</h1>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground">View your faculty profile and responsibilities</p>
          </div>
        </StaggeredItem>

        <StaggeredItem>
          <div className="flex gap-2 flex-wrap">
            {isAdmin && <Badge variant="default">Administrator</Badge>}
            {isModerator && <Badge variant="secondary">Moderator</Badge>}
            {isClassCoordinator && <Badge variant="outline">Class Coordinator</Badge>}
          </div>
        </StaggeredItem>

        <StaggeredItem>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 w-full">
            <Card className="min-w-0 border border-border/60 bg-card/70">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="text-[10px] sm:text-xs md:text-sm font-medium truncate">Total Students</CardTitle>
                <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-base sm:text-lg md:text-2xl font-bold">{loadingStats ? "..." : stats.totalStudents}</div>
                <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">
                  {isClassCoordinator && !isAdmin ? "In your class" : "All students"}
                </p>
              </CardContent>
            </Card>

            <Card className="min-w-0 border border-border/60 bg-card/70">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="text-[10px] sm:text-xs md:text-sm font-medium truncate">Pending</CardTitle>
                <UserCheck className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-base sm:text-lg md:text-2xl font-bold">{loadingStats ? "..." : stats.pendingApprovals}</div>
                <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">Awaiting verification</p>
              </CardContent>
            </Card>

            <Card className="min-w-0 border border-border/60 bg-card/70">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="text-[10px] sm:text-xs md:text-sm font-medium truncate">Avg Attendance</CardTitle>
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-base sm:text-lg md:text-2xl font-bold">{loadingStats ? "..." : `${stats.averageAttendance}%`}</div>
                <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">Class average</p>
              </CardContent>
            </Card>

            <Card className="min-w-0 border border-border/60 bg-card/70">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="text-[10px] sm:text-xs md:text-sm font-medium truncate">Faculty ID</CardTitle>
                <User className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-xs sm:text-sm md:text-base font-bold truncate">{profile.faculty_id}</div>
              </CardContent>
            </Card>
          </div>
        </StaggeredItem>

        {stats.attendanceBySubject.length > 0 && (
          <StaggeredItem>
            <Card className="overflow-hidden w-full border border-border/60 bg-card/70">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm sm:text-base md:text-lg">Attendance by Subject</CardTitle>
                <CardDescription className="text-[10px] sm:text-xs md:text-sm">Average attendance percentage</CardDescription>
              </CardHeader>
              <CardContent className="px-1 sm:px-4 md:px-6">
                <ChartContainer
                  config={{
                    percentage: {
                      label: "Attendance %",
                      color: "hsl(var(--primary))",
                    },
                  }}
                  className="h-[140px] sm:h-[180px] md:h-[240px] w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.attendanceBySubject} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="subject" 
                        tick={{ fill: 'hsl(var(--foreground))', fontSize: 8 }}
                        tickLine={false}
                        axisLine={false}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={40}
                      />
                      <YAxis 
                        tick={{ fill: 'hsl(var(--foreground))', fontSize: 8 }}
                        tickLine={false}
                        axisLine={false}
                        domain={[0, 100]}
                        width={25}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="percentage" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </StaggeredItem>
        )}

        <StaggeredItem>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 md:gap-4 w-full">
            {stats.gradeDistribution.length > 0 && (
              <Card className="overflow-hidden min-w-0 border border-border/60 bg-card/70">
                <CardHeader className="pb-2 px-3 sm:px-6">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
                    <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                    Grade Distribution
                  </CardTitle>
                  <CardDescription className="text-[10px] sm:text-xs">Overall grade breakdown</CardDescription>
                </CardHeader>
                <CardContent className="px-1 sm:px-4 md:px-6">
                  <ChartContainer
                    config={{
                      count: {
                        label: "Students",
                        color: "hsl(var(--primary))",
                      },
                    }}
                    className="h-[120px] sm:h-[160px] md:h-[180px] w-full"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <Pie
                          data={stats.gradeDistribution}
                          dataKey="count"
                          nameKey="grade"
                          cx="50%"
                          cy="50%"
                          outerRadius={40}
                          innerRadius={15}
                          label={({ grade, count }) => `${grade}: ${count}`}
                          labelLine={false}
                          fontSize={8}
                        >
                          {stats.gradeDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}

            {stats.recentActivity.length > 0 && (
              <Card className="overflow-hidden min-w-0 border border-border/60 bg-card/70">
                <CardHeader className="pb-2 px-3 sm:px-6">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
                    <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
                    Registration Trend
                  </CardTitle>
                  <CardDescription className="text-[10px] sm:text-xs">Last 7 days</CardDescription>
                </CardHeader>
                <CardContent className="px-1 sm:px-4 md:px-6">
                  <ChartContainer
                    config={{
                      count: {
                        label: "Registrations",
                        color: "hsl(var(--primary))",
                      },
                    }}
                    className="h-[120px] sm:h-[160px] md:h-[180px] w-full"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stats.recentActivity} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fill: 'hsl(var(--foreground))', fontSize: 8 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis 
                          tick={{ fill: 'hsl(var(--foreground))', fontSize: 8 }}
                          tickLine={false}
                          axisLine={false}
                          allowDecimals={false}
                          width={20}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line 
                          type="monotone" 
                          dataKey="count" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          dot={{ fill: 'hsl(var(--primary))', r: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}
          </div>
        </StaggeredItem>

        <StaggeredItem>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 w-full">
            {profile.department && (
              <Card className="min-w-0 border border-border/60 bg-card/70">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Department</CardTitle>
                  <Building className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="text-sm sm:text-lg md:text-xl font-bold truncate">{profile.department}</div>
                </CardContent>
              </Card>
            )}

            {isClassCoordinator && (
              <Card className="min-w-0 border border-border/60 bg-card/70">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Assigned Class</CardTitle>
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="text-sm sm:text-lg md:text-xl font-bold truncate">
                    {profile.assigned_course} - Y{profile.assigned_year} ({profile.assigned_section})
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </StaggeredItem>

        <StaggeredItem>
          <Card className="w-full border border-border/60 bg-card/70">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-sm sm:text-base">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
              <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-muted/50 min-w-0">
                <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Full Name</p>
                  <p className="text-xs sm:text-sm font-medium truncate">{profile.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-muted/50 min-w-0">
                <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Email</p>
                  <p className="text-xs sm:text-sm font-medium truncate">{profile.email}</p>
                </div>
              </div>
              {profile.phone && (
                <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-muted/50 min-w-0">
                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Phone</p>
                    <p className="text-xs sm:text-sm font-medium">{profile.phone}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </StaggeredItem>

        {classReps.length > 0 && (
          <StaggeredItem>
            <Card className="w-full border border-border/60 bg-card/70">
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="text-sm sm:text-base">Class Representatives</CardTitle>
                <CardDescription className="text-[10px] sm:text-xs">Current CRs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:gap-3">
                  {classReps.map((cr) => (
                    <div key={cr.id} className="flex items-center justify-between p-2 sm:p-3 border rounded-lg gap-2 min-w-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium truncate">{cr.name}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                          {cr.enrollment_number}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[9px] sm:text-xs flex-shrink-0">
                        {cr.course_name} Y{cr.year}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </StaggeredItem>
        )}
      </StaggeredContent>
      </div>
    </FacultyLayout>
  );
}
