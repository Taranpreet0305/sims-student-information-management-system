import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import FacultyLayout from "@/components/FacultyLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, TrendingUp, TrendingDown, Download, FileDown, Sparkles, Loader2 } from "lucide-react";
import { useFacultyRole } from "@/hooks/useFacultyRole";
import { toast } from "sonner";
import { generateStudentPerformancePDF } from "@/lib/pdfGenerator";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

interface StudentPerformance {
  student_id: string;
  enrollment_number: string;
  name: string;
  course_name: string;
  year: number;
  section: string;
  attendance_percentage: number;
  average_marks: number;
  total_subjects: number;
  marks_trend: { subject: string; marks: number }[];
}

export default function StudentPerformance() {
  const { profile, isAdmin, isClassCoordinator } = useFacultyRole();
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentPerformance | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      loadStudents();
    }
  }, [profile]);

  const loadStudents = async () => {
    if (!profile) return;

    let query = supabase.from("profiles").select("*").eq("verify", true);

    if (!isAdmin && isClassCoordinator) {
      query = query
        .eq("course_name", profile.assigned_course)
        .eq("year", profile.assigned_year)
        .eq("section", profile.assigned_section);
    }

    const { data } = await query.order("name");
    if (data) {
      setStudents(data);
    }
  };

  const loadStudentPerformance = async (studentId: string, enrollmentNumber: string) => {
    setLoading(true);
    setAiAnalysis(null);
    try {
      const student = students.find(s => s.id === studentId);
      if (!student) return;

      const { data: attendanceData } = await supabase
        .from("attendance")
        .select("*")
        .eq("enrollment_number", enrollmentNumber);

      let attendancePercentage = 0;
      if (attendanceData && attendanceData.length > 0) {
        const totalClasses = attendanceData.reduce((sum, r) => sum + r.total_classes, 0);
        const attendedClasses = attendanceData.reduce((sum, r) => sum + r.classes_attended, 0);
        attendancePercentage = totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0;
      }

      const { data: marksData } = await supabase
        .from("student_marks")
        .select("*")
        .eq("enrollment_number", enrollmentNumber);

      let averageMarks = 0;
      let marksTrend: { subject: string; marks: number }[] = [];
      
      if (marksData && marksData.length > 0) {
        const totalMarks = marksData.reduce((sum, r) => sum + (Number(r.total_marks) || 0), 0);
        averageMarks = totalMarks / marksData.length;
        marksTrend = marksData.map(m => ({
          subject: m.subject,
          marks: Number(m.total_marks) || 0
        }));
      }

      setSelectedStudent({
        student_id: student.student_id,
        enrollment_number: student.enrollment_number,
        name: student.name,
        course_name: student.course_name,
        year: student.year,
        section: student.section,
        attendance_percentage: Math.round(attendancePercentage),
        average_marks: Math.round(averageMarks),
        total_subjects: marksData?.length || 0,
        marks_trend: marksTrend,
      });
    } catch (error) {
      console.error("Error loading student performance:", error);
      toast.error("Failed to load student performance");
    } finally {
      setLoading(false);
    }
  };

  const getAIAnalysis = async () => {
    if (!selectedStudent) return;
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          action: 'analyze_performance',
          data: {
            performance: {
              name: selectedStudent.name,
              attendance: selectedStudent.attendance_percentage,
              average_marks: selectedStudent.average_marks,
              subjects: selectedStudent.marks_trend,
            }
          }
        }
      });

      if (error) throw error;
      setAiAnalysis(data.response);
    } catch (error) {
      console.error("AI analysis error:", error);
      toast.error("Failed to generate AI analysis");
    } finally {
      setAiLoading(false);
    }
  };

  const generateReport = async () => {
    if (!selectedStudent || !profile) return;

    try {
      const reportData = {
        student_info: {
          name: selectedStudent.name,
          enrollment: selectedStudent.enrollment_number,
          course: selectedStudent.course_name,
          year: selectedStudent.year,
          section: selectedStudent.section,
        },
        performance: {
          attendance: selectedStudent.attendance_percentage,
          average_marks: selectedStudent.average_marks,
          total_subjects: selectedStudent.total_subjects,
        },
        marks_by_subject: selectedStudent.marks_trend,
        generated_at: new Date().toISOString(),
      };

      await supabase.from("performance_reports").insert({
        student_id: selectedStudent.student_id,
        enrollment_number: selectedStudent.enrollment_number,
        generated_by: profile.id,
        report_data: reportData,
        term: "Current",
      });

      toast.success("Performance report generated successfully");
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report");
    }
  };

  const downloadPDF = () => {
    if (!selectedStudent) return;

    const reportData = {
      student_info: {
        name: selectedStudent.name,
        enrollment: selectedStudent.enrollment_number,
        course: selectedStudent.course_name,
        year: selectedStudent.year,
        section: selectedStudent.section,
      },
      performance: {
        attendance: selectedStudent.attendance_percentage,
        average_marks: selectedStudent.average_marks,
        total_subjects: selectedStudent.total_subjects,
      },
      marks_by_subject: selectedStudent.marks_trend,
      generated_at: new Date().toISOString(),
    };

    generateStudentPerformancePDF(reportData);
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.enrollment_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <FacultyLayout>
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2">Student Performance Tracking</h1>
          <p className="text-sm sm:text-base text-muted-foreground">View detailed student performance and AI insights</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="lg:col-span-1">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Select Student</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Search and view details</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-3 sm:space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or enrollment..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>
              <div className="space-y-2 max-h-[300px] sm:max-h-[400px] overflow-y-auto">
                {filteredStudents.map((student) => (
                  <Button
                    key={student.id}
                    variant={selectedStudent?.enrollment_number === student.enrollment_number ? "default" : "outline"}
                    className="w-full justify-start h-auto py-2 sm:py-3"
                    onClick={() => loadStudentPerformance(student.id, student.enrollment_number)}
                  >
                    <div className="text-left">
                      <p className="font-medium text-sm">{student.name}</p>
                      <p className="text-xs text-muted-foreground">{student.enrollment_number}</p>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {loading ? (
              <Card>
                <CardContent className="py-8 sm:py-12 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Loading performance...</p>
                </CardContent>
              </Card>
            ) : selectedStudent ? (
              <>
                <Card>
                  <CardHeader className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <CardTitle className="text-base sm:text-lg">{selectedStudent.name}</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                          {selectedStudent.enrollment_number} • {selectedStudent.course_name} Y{selectedStudent.year} ({selectedStudent.section})
                        </CardDescription>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={getAIAnalysis} size="sm" variant="secondary" disabled={aiLoading} className="text-xs sm:text-sm">
                          {aiLoading ? <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" /> : <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />}
                          AI Insights
                        </Button>
                        <Button onClick={generateReport} size="sm" variant="outline" className="text-xs sm:text-sm">
                          <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          Save
                        </Button>
                        <Button onClick={downloadPDF} size="sm" className="text-xs sm:text-sm">
                          <FileDown className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          PDF
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {aiAnalysis && (
                  <Card className="border-primary/20 bg-primary/5">
                    <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
                      <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        AI Performance Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0">
                      <p className="text-xs sm:text-sm whitespace-pre-wrap">{aiAnalysis}</p>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
                      <CardTitle className="text-xs sm:text-sm font-medium">Attendance</CardTitle>
                      {selectedStudent.attendance_percentage >= 75 ? (
                        <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                      )}
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 pt-0">
                      <div className="text-lg sm:text-2xl font-bold">{selectedStudent.attendance_percentage}%</div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        {selectedStudent.attendance_percentage >= 75 ? "Good" : "Below requirement"}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
                      <CardTitle className="text-xs sm:text-sm font-medium">Average Marks</CardTitle>
                      {selectedStudent.average_marks >= 60 ? (
                        <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                      )}
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 pt-0">
                      <div className="text-lg sm:text-2xl font-bold">{selectedStudent.average_marks}%</div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Overall performance</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
                      <CardTitle className="text-xs sm:text-sm font-medium">Subjects</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 pt-0">
                      <div className="text-lg sm:text-2xl font-bold">{selectedStudent.total_subjects}</div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Enrolled courses</p>
                    </CardContent>
                  </Card>
                </div>

                {selectedStudent.marks_trend.length > 0 && (
                  <Card>
                    <CardHeader className="p-4 sm:p-6">
                      <CardTitle className="text-sm sm:text-base">Subject-wise Performance</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">Marks distribution</CardDescription>
                    </CardHeader>
                    <CardContent className="p-2 sm:p-6 pt-0">
                      <ChartContainer
                        config={{
                          marks: {
                            label: "Marks",
                            color: "hsl(var(--primary))",
                          },
                        }}
                        className="h-[200px] sm:h-[300px] w-full"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={selectedStudent.marks_trend} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis 
                              dataKey="subject" 
                              tick={{ fill: 'hsl(var(--foreground))', fontSize: 10 }}
                              tickLine={false}
                              axisLine={false}
                            />
                            <YAxis 
                              tick={{ fill: 'hsl(var(--foreground))', fontSize: 10 }}
                              tickLine={false}
                              axisLine={false}
                              domain={[0, 100]}
                            />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="marks" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="py-8 sm:py-12 text-center">
                  <p className="text-sm text-muted-foreground">Select a student to view their performance</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </FacultyLayout>
  );
}
