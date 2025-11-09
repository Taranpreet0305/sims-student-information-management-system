import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import FacultyLayout from "@/components/FacultyLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, TrendingUp, TrendingDown, Download, FileDown } from "lucide-react";
import { useFacultyRole } from "@/hooks/useFacultyRole";
import { toast } from "sonner";
import { generateStudentPerformancePDF } from "@/lib/pdfGenerator";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from "recharts";

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
    try {
      const student = students.find(s => s.id === studentId);
      if (!student) return;

      // Get attendance data
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

      // Get marks data
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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Student Performance Tracking</h1>
          <p className="text-muted-foreground">View detailed student performance, attendance, and academic trends</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Select Student</CardTitle>
              <CardDescription>Search and view student details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or enrollment..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {filteredStudents.map((student) => (
                  <Button
                    key={student.id}
                    variant={selectedStudent?.enrollment_number === student.enrollment_number ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => loadStudentPerformance(student.id, student.enrollment_number)}
                  >
                    <div className="text-left">
                      <p className="font-medium">{student.name}</p>
                      <p className="text-xs text-muted-foreground">{student.enrollment_number}</p>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="md:col-span-2 space-y-6">
            {loading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Loading student performance...</p>
                </CardContent>
              </Card>
            ) : selectedStudent ? (
              <>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{selectedStudent.name}</CardTitle>
                        <CardDescription>
                          {selectedStudent.enrollment_number} • {selectedStudent.course_name} Year {selectedStudent.year} ({selectedStudent.section})
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={generateReport} size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Save Report
                        </Button>
                        <Button onClick={downloadPDF} size="sm">
                          <FileDown className="h-4 w-4 mr-2" />
                          Download PDF
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Attendance</CardTitle>
                      {selectedStudent.attendance_percentage >= 75 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedStudent.attendance_percentage}%</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedStudent.attendance_percentage >= 75 ? "Good attendance" : "Below requirement"}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Average Marks</CardTitle>
                      {selectedStudent.average_marks >= 60 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedStudent.average_marks}%</div>
                      <p className="text-xs text-muted-foreground mt-1">Overall performance</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Subjects</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedStudent.total_subjects}</div>
                      <p className="text-xs text-muted-foreground mt-1">Enrolled courses</p>
                    </CardContent>
                  </Card>
                </div>

                {selectedStudent.marks_trend.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Subject-wise Performance</CardTitle>
                      <CardDescription>Marks distribution across subjects</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={{
                          marks: {
                            label: "Marks",
                            color: "hsl(var(--primary))",
                          },
                        }}
                        className="h-[300px]"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={selectedStudent.marks_trend}>
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
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Select a student to view their performance details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </FacultyLayout>
  );
}
