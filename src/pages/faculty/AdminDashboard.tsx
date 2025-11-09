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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">System-wide statistics and recent activities</p>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button asChild variant="outline">
                <Link to="/faculty/approve-students">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Approve Students
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/faculty/approve-faculty">
                  <Users className="h-4 w-4 mr-2" />
                  Approve Faculty
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/faculty/notices">
                  <Bell className="h-4 w-4 mr-2" />
                  Post Notice
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/faculty/placements">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Manage Placements
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/faculty/manage-elections">
                  <Vote className="h-4 w-4 mr-2" />
                  Elections
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/faculty/manage-roles">
                  <Shield className="h-4 w-4 mr-2" />
                  Manage Roles
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/faculty/analytics">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Analytics
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/faculty/student-performance">
                  <Activity className="h-4 w-4 mr-2" />
                  Performance
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.verifiedStudents} verified, {stats.pendingStudents} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Faculty</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : stats.totalFaculty}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.verifiedFaculty} verified
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Placements</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : stats.totalPlacements}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.activePlacements} active drives
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Elections</CardTitle>
              <Vote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : stats.totalElections}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.activeElections} ongoing
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Attendance</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : `${stats.averageAttendance}%`}</div>
              <p className="text-xs text-muted-foreground mt-1">System-wide average</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : stats.totalFeedback}</div>
              <p className="text-xs text-muted-foreground mt-1">From students</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notifications</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : stats.totalNotifications}</div>
              <p className="text-xs text-muted-foreground mt-1">Total notices posted</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <Activity className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">Active</div>
              <p className="text-xs text-muted-foreground mt-1">All systems operational</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Course Distribution */}
          {courseDistribution.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Student Distribution by Course</CardTitle>
                <CardDescription>Number of verified students per course</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    students: {
                      label: "Students",
                      color: "hsl(var(--primary))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={courseDistribution}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="course" 
                        className="text-xs"
                        tick={{ fill: 'hsl(var(--foreground))' }}
                      />
                      <YAxis 
                        className="text-xs"
                        tick={{ fill: 'hsl(var(--foreground))' }}
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
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>Latest system events and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivities.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No recent activities</p>
                ) : (
                  recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <Activity className="h-5 w-5 text-primary mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
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
