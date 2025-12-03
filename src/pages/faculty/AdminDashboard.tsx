import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import FacultyLayout from "@/components/FacultyLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserCheck, Calendar, FileText, TrendingUp, Bell, Briefcase, Vote, Shield, Activity } from "lucide-react";
import { useFacultyRole } from "@/hooks/useFacultyRole";
import { Link } from "react-router-dom";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line } from "recharts";

interface SystemStats {
  totalStudents: number;
  verifiedStudents: number;
  pendingStudents: number;
  totalFaculty: number;
  verifiedFaculty: number;
  totalPlacements: number;
  activePlacements: number;
  totalElections: number;
  activeElections: number;
  totalFeedback: number;
  averageAttendance: number;
  totalNotifications: number;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
}

export default function AdminDashboard() {
  const { isAdmin } = useFacultyRole();
  const [stats, setStats] = useState<SystemStats>({
    totalStudents: 0,
    verifiedStudents: 0,
    pendingStudents: 0,
    totalFaculty: 0,
    verifiedFaculty: 0,
    totalPlacements: 0,
    activePlacements: 0,
    totalElections: 0,
    activeElections: 0,
    totalFeedback: 0,
    averageAttendance: 0,
    totalNotifications: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [courseDistribution, setCourseDistribution] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      loadSystemStats();
      loadRecentActivities();
      loadCourseDistribution();
    }
  }, [isAdmin]);

  const loadSystemStats = async () => {
    try {
      setLoading(true);

      // Students
      const { count: totalStudents } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
      
      const { count: verifiedStudents } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("verify", true);

      // Faculty
      const { count: totalFaculty } = await supabase
        .from("faculty_profiles")
        .select("*", { count: "exact", head: true });
      
      const { count: verifiedFaculty } = await supabase
        .from("faculty_profiles")
        .select("*", { count: "exact", head: true })
        .eq("verify", true);

      // Placements
      const { count: totalPlacements } = await supabase
        .from("placements")
        .select("*", { count: "exact", head: true });
      
      const { count: activePlacements } = await supabase
        .from("placements")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      // Elections
      const { count: totalElections } = await supabase
        .from("elections")
        .select("*", { count: "exact", head: true });
      
      const { count: activeElections } = await supabase
        .from("elections")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      // Feedback
      const { count: totalFeedback } = await supabase
        .from("feedback")
        .select("*", { count: "exact", head: true });

      // Notifications
      const { count: totalNotifications } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true });

      // Attendance
      const { data: attendanceData } = await supabase
        .from("attendance")
        .select("classes_attended, total_classes");

      let avgAttendance = 0;
      if (attendanceData && attendanceData.length > 0) {
        const totalPercentage = attendanceData.reduce((sum, record) => {
          if (record.total_classes > 0) {
            return sum + (record.classes_attended / record.total_classes) * 100;
          }
          return sum;
        }, 0);
        avgAttendance = totalPercentage / attendanceData.length;
      }

      setStats({
        totalStudents: totalStudents || 0,
        verifiedStudents: verifiedStudents || 0,
        pendingStudents: (totalStudents || 0) - (verifiedStudents || 0),
        totalFaculty: totalFaculty || 0,
        verifiedFaculty: verifiedFaculty || 0,
        totalPlacements: totalPlacements || 0,
        activePlacements: activePlacements || 0,
        totalElections: totalElections || 0,
        activeElections: activeElections || 0,
        totalFeedback: totalFeedback || 0,
        averageAttendance: Math.round(avgAttendance),
        totalNotifications: totalNotifications || 0,
      });
    } catch (error) {
      console.error("Error loading system stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentActivities = async () => {
    try {
      const activities: RecentActivity[] = [];

      // Recent student registrations
      const { data: recentStudents } = await supabase
        .from("profiles")
        .select("name, created_at")
        .order("created_at", { ascending: false })
        .limit(3);

      recentStudents?.forEach((student) => {
        activities.push({
          id: `student-${student.name}`,
          type: "student_registration",
          description: `${student.name} registered as a student`,
          timestamp: student.created_at,
        });
      });

      // Recent placements
      const { data: recentPlacements } = await supabase
        .from("placements")
        .select("company_name, created_at")
        .order("created_at", { ascending: false })
        .limit(3);

      recentPlacements?.forEach((placement) => {
        activities.push({
          id: `placement-${placement.company_name}`,
          type: "placement",
          description: `New placement drive posted: ${placement.company_name}`,
          timestamp: placement.created_at,
        });
      });

      // Sort by timestamp
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentActivities(activities.slice(0, 10));
    } catch (error) {
      console.error("Error loading recent activities:", error);
    }
  };

  const loadCourseDistribution = async () => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("course_name")
        .eq("verify", true);

      if (data) {
        const distribution: Record<string, number> = {};
        data.forEach((student) => {
          distribution[student.course_name] = (distribution[student.course_name] || 0) + 1;
        });

        const chartData = Object.entries(distribution).map(([course, count]) => ({
          course,
          students: count,
        }));

        setCourseDistribution(chartData);
      }
    } catch (error) {
      console.error("Error loading course distribution:", error);
    }
  };

  if (!isAdmin) {
    return (
      <FacultyLayout>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Access denied. Admin privileges required.</p>
          </CardContent>
        </Card>
      </FacultyLayout>
    );
  }

  return (
    <FacultyLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">Admin Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground">System-wide statistics and recent activities</p>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
              <Button asChild variant="outline" size="sm" className="h-auto py-2 px-3">
                <Link to="/faculty/approve-students" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                  <UserCheck className="h-4 w-4" />
                  <span className="text-xs sm:text-sm">Approve Students</span>
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="h-auto py-2 px-3">
                <Link to="/faculty/approve-faculty" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                  <Users className="h-4 w-4" />
                  <span className="text-xs sm:text-sm">Approve Faculty</span>
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="h-auto py-2 px-3">
                <Link to="/faculty/notices" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                  <Bell className="h-4 w-4" />
                  <span className="text-xs sm:text-sm">Post Notice</span>
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="h-auto py-2 px-3">
                <Link to="/faculty/placements" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                  <Briefcase className="h-4 w-4" />
                  <span className="text-xs sm:text-sm">Placements</span>
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="h-auto py-2 px-3">
                <Link to="/faculty/manage-elections" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                  <Vote className="h-4 w-4" />
                  <span className="text-xs sm:text-sm">Elections</span>
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="h-auto py-2 px-3">
                <Link to="/faculty/manage-roles" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                  <Shield className="h-4 w-4" />
                  <span className="text-xs sm:text-sm">Manage Roles</span>
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="h-auto py-2 px-3">
                <Link to="/faculty/analytics" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs sm:text-sm">Analytics</span>
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="h-auto py-2 px-3">
                <Link to="/faculty/student-performance" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                  <Activity className="h-4 w-4" />
                  <span className="text-xs sm:text-sm">Performance</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-4">
              <CardTitle className="text-xs md:text-sm font-medium">Total Students</CardTitle>
              <Users className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 md:p-4 pt-0">
              <div className="text-xl md:text-2xl font-bold">{loading ? "..." : stats.totalStudents}</div>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                {stats.verifiedStudents} verified
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-4">
              <CardTitle className="text-xs md:text-sm font-medium">Total Faculty</CardTitle>
              <UserCheck className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 md:p-4 pt-0">
              <div className="text-xl md:text-2xl font-bold">{loading ? "..." : stats.totalFaculty}</div>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                {stats.verifiedFaculty} verified
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-4">
              <CardTitle className="text-xs md:text-sm font-medium">Placements</CardTitle>
              <Briefcase className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 md:p-4 pt-0">
              <div className="text-xl md:text-2xl font-bold">{loading ? "..." : stats.totalPlacements}</div>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                {stats.activePlacements} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-4">
              <CardTitle className="text-xs md:text-sm font-medium">Elections</CardTitle>
              <Vote className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 md:p-4 pt-0">
              <div className="text-xl md:text-2xl font-bold">{loading ? "..." : stats.totalElections}</div>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                {stats.activeElections} ongoing
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-4">
              <CardTitle className="text-xs md:text-sm font-medium">Attendance</CardTitle>
              <Calendar className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 md:p-4 pt-0">
              <div className="text-xl md:text-2xl font-bold">{loading ? "..." : `${stats.averageAttendance}%`}</div>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-1">Average</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-4">
              <CardTitle className="text-xs md:text-sm font-medium">Feedback</CardTitle>
              <FileText className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 md:p-4 pt-0">
              <div className="text-xl md:text-2xl font-bold">{loading ? "..." : stats.totalFeedback}</div>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-1">Total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-4">
              <CardTitle className="text-xs md:text-sm font-medium">Notices</CardTitle>
              <Bell className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 md:p-4 pt-0">
              <div className="text-xl md:text-2xl font-bold">{loading ? "..." : stats.totalNotifications}</div>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-1">Posted</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-4">
              <CardTitle className="text-xs md:text-sm font-medium">Status</CardTitle>
              <Activity className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
            </CardHeader>
            <CardContent className="p-3 md:p-4 pt-0">
              <div className="text-xl md:text-2xl font-bold text-green-500">Active</div>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-1">Operational</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Course Distribution */}
          {courseDistribution.length > 0 && (
            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-base md:text-lg">Student Distribution</CardTitle>
                <CardDescription className="text-xs md:text-sm">Verified students per course</CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0">
                <ChartContainer
                  config={{
                    students: {
                      label: "Students",
                      color: "hsl(var(--primary))",
                    },
                  }}
                  className="h-[200px] md:h-[300px] w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={courseDistribution} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="course" 
                        tick={{ fill: 'hsl(var(--foreground))', fontSize: 10 }}
                        angle={-45}
                        textAnchor="end"
                        height={50}
                        interval={0}
                      />
                      <YAxis 
                        tick={{ fill: 'hsl(var(--foreground))', fontSize: 10 }}
                        width={25}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="students" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Recent Activities */}
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-base md:text-lg">Recent Activities</CardTitle>
              <CardDescription className="text-xs md:text-sm">Latest system events</CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0">
              <div className="space-y-2 md:space-y-3 max-h-[300px] overflow-y-auto">
                {recentActivities.length === 0 ? (
                  <p className="text-xs md:text-sm text-muted-foreground text-center py-4">No recent activities</p>
                ) : (
                  recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-2 md:gap-3 p-2 md:p-3 border rounded-lg">
                      <Activity className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs md:text-sm font-medium truncate">{activity.description}</p>
                        <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </FacultyLayout>
  );
}
