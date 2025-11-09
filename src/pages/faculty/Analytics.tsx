import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import FacultyLayout from "@/components/FacultyLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useFacultyRole } from "@/hooks/useFacultyRole";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { toast } from "sonner";

export default function Analytics() {
  const { profile, isAdmin, isClassCoordinator } = useFacultyRole();
  const [selectedTerm, setSelectedTerm] = useState("all");
  const [gradeDistribution, setGradeDistribution] = useState<any[]>([]);
  const [performanceTrends, setPerformanceTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', 'hsl(var(--destructive))'];

  useEffect(() => {
    if (profile) {
      loadAnalytics();
    }
  }, [profile, selectedTerm]);

  const loadAnalytics = async () => {
    if (!profile) return;

    try {
      setLoading(true);

      // Get marks data
      let marksQuery = supabase.from("student_marks").select("*");

      if (selectedTerm !== "all") {
        marksQuery = marksQuery.eq("term", selectedTerm);
      }

      if (!isAdmin && isClassCoordinator) {
        const { data: students } = await supabase
          .from("profiles")
          .select("enrollment_number")
          .eq("course_name", profile.assigned_course)
          .eq("year", profile.assigned_year)
          .eq("section", profile.assigned_section);

        if (students && students.length > 0) {
          const enrollmentNumbers = students.map(s => s.enrollment_number);
          marksQuery = marksQuery.in("enrollment_number", enrollmentNumbers);
        }
      }

      const { data: marksData } = await marksQuery;

      if (marksData && marksData.length > 0) {
        // Calculate grade distribution
        const grades: Record<string, number> = {};
        const subjectPerformance: Record<string, { total: number; count: number }> = {};

        marksData.forEach(mark => {
          // Grade distribution
          const grade = mark.grade || "N/A";
          grades[grade] = (grades[grade] || 0) + 1;

          // Subject performance
          if (!subjectPerformance[mark.subject]) {
            subjectPerformance[mark.subject] = { total: 0, count: 0 };
          }
          subjectPerformance[mark.subject].total += Number(mark.total_marks) || 0;
          subjectPerformance[mark.subject].count += 1;
        });

        const gradeData = Object.entries(grades).map(([grade, count]) => ({
          grade,
          count,
        }));

        const performanceData = Object.entries(subjectPerformance).map(([subject, data]) => ({
          subject,
          average: Math.round(data.total / data.count),
        }));

        setGradeDistribution(gradeData);
        setPerformanceTrends(performanceData);
      }
    } catch (error) {
      console.error("Error loading analytics:", error);
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    const csvContent = [
      ["Subject", "Average Marks"],
      ...performanceTrends.map(p => [p.subject, p.average]),
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString()}.csv`;
    a.click();
    
    toast.success("Report exported successfully");
  };

  return (
    <FacultyLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              Comprehensive performance trends and grade distributions
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Terms</SelectItem>
                <SelectItem value="Mid-Term">Mid-Term</SelectItem>
                <SelectItem value="End-Term">End-Term</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportReport} size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Loading analytics...</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Grade Distribution</CardTitle>
                <CardDescription>Student performance by grade</CardDescription>
              </CardHeader>
              <CardContent>
                {gradeDistribution.length > 0 ? (
                  <ChartContainer
                    config={{
                      count: {
                        label: "Students",
                        color: "hsl(var(--primary))",
                      },
                    }}
                    className="h-[300px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={gradeDistribution}
                          dataKey="count"
                          nameKey="grade"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label
                        >
                          {gradeDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  <p className="text-center py-12 text-muted-foreground">No data available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subject Performance</CardTitle>
                <CardDescription>Average marks by subject</CardDescription>
              </CardHeader>
              <CardContent>
                {performanceTrends.length > 0 ? (
                  <ChartContainer
                    config={{
                      average: {
                        label: "Average Marks",
                        color: "hsl(var(--primary))",
                      },
                    }}
                    className="h-[300px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={performanceTrends}>
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
                        <Bar dataKey="average" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  <p className="text-center py-12 text-muted-foreground">No data available</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </FacultyLayout>
  );
}
