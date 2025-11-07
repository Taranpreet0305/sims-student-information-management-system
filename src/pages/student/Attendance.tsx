import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import StudentLayout from "@/components/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Calendar, TrendingUp, TrendingDown } from "lucide-react";

export default function StudentAttendance() {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, percentage: 0 });

  useEffect(() => {
    loadAttendance();
  }, []);

  const loadAttendance = async () => {
    const enrollmentNumber = localStorage.getItem("enrollment_number");
    
    const { data } = await supabase
      .from("attendance")
      .select("*")
      .eq("enrollment_number", enrollmentNumber);

    if (data) {
      setAttendance(data);
      
      const totalClasses = data.reduce((sum, record) => sum + (record.total_classes || 0), 0);
      const attended = data.reduce((sum, record) => sum + (record.classes_attended || 0), 0);
      const percentage = totalClasses > 0 ? (attended / totalClasses) * 100 : 0;
      
      setStats({
        total: totalClasses,
        present: attended,
        absent: totalClasses - attended,
        percentage: Math.round(percentage),
      });
    }
  };

  const subjectWiseData = attendance.reduce((acc, record) => {
    const existing = acc.find((item: any) => item.subject === record.subject);
    if (existing) {
      existing.total += record.total_classes || 0;
      existing.attended += record.classes_attended || 0;
    } else {
      acc.push({
        subject: record.subject,
        total: record.total_classes || 0,
        attended: record.classes_attended || 0,
      });
    }
    return acc;
  }, []);

  const chartData = subjectWiseData.map((item: any) => ({
    name: item.subject,
    value: item.total > 0 ? Math.round((item.attended / item.total) * 100) : 0,
  }));

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Attendance</h1>
          <p className="text-muted-foreground">View your attendance records</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Classes Attended</CardTitle>
              <TrendingUp className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{stats.present}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Classes Missed</CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.absent}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance %</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.percentage >= 75 ? 'text-accent' : 'text-destructive'}`}>
                {stats.percentage}%
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Subject-wise Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <div className="h-[300px] md:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No attendance data available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </StudentLayout>
  );
}
