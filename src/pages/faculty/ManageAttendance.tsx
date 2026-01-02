import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import FacultyLayout from "@/components/FacultyLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Download, UserPlus, FileText, Sparkles, Loader2, AlertTriangle, TrendingDown, Users } from "lucide-react";
import { toast } from "sonner";
import { useFacultyRole } from "@/hooks/useFacultyRole";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface AttendanceRecord {
  enrollment_number: string;
  student_id: string;
  total_classes: number;
  classes_attended: number;
  percentage: number;
}

interface AIInsight {
  atRiskStudents: AttendanceRecord[];
  summary: string;
  recommendations: string[];
}

export default function ManageAttendance() {
  const { profile, isAdmin, isClassCoordinator } = useFacultyRole();
  const [csvData, setCsvData] = useState("");
  const [singleStudentData, setSingleStudentData] = useState({
    enrollment_number: "",
    date: "",
    subject: "",
    status: "",
  });
  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    loadAttendanceData();
  }, [profile, isAdmin, isClassCoordinator]);

  const loadAttendanceData = async () => {
    try {
      let query = supabase.from("attendance").select("*");

      if (!isAdmin && isClassCoordinator && profile) {
        const { data: students } = await supabase
          .from("profiles")
          .select("enrollment_number")
          .eq("course_name", profile.assigned_course)
          .eq("year", profile.assigned_year)
          .eq("section", profile.assigned_section);

        if (students && students.length > 0) {
          const enrollmentNumbers = students.map(s => s.enrollment_number);
          query = query.in("enrollment_number", enrollmentNumbers);
        }
      }

      const { data } = await query;

      if (data) {
        // Aggregate attendance by student
        const aggregated: Record<string, AttendanceRecord> = {};
        data.forEach((record: any) => {
          if (!aggregated[record.enrollment_number]) {
            aggregated[record.enrollment_number] = {
              enrollment_number: record.enrollment_number,
              student_id: record.student_id,
              total_classes: 0,
              classes_attended: 0,
              percentage: 0
            };
          }
          aggregated[record.enrollment_number].total_classes += record.total_classes || 0;
          aggregated[record.enrollment_number].classes_attended += record.classes_attended || 0;
        });

        const records = Object.values(aggregated).map(r => ({
          ...r,
          percentage: r.total_classes > 0 ? (r.classes_attended / r.total_classes) * 100 : 0
        }));

        setAttendanceData(records);
      }
    } catch (error) {
      console.error("Error loading attendance:", error);
    }
  };

  const generateAIInsights = async () => {
    setLoadingInsights(true);
    try {
      const atRiskStudents = attendanceData.filter(s => s.percentage < 75);
      
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: {
          action: "attendance_insights",
          data: { 
            attendance: {
              totalStudents: attendanceData.length,
              atRiskCount: atRiskStudents.length,
              averageAttendance: attendanceData.length > 0 
                ? (attendanceData.reduce((sum, s) => sum + s.percentage, 0) / attendanceData.length).toFixed(1)
                : 0,
              atRiskStudents: atRiskStudents.slice(0, 10).map(s => ({
                id: s.student_id,
                percentage: s.percentage.toFixed(1)
              }))
            }
          }
        }
      });

      if (error) throw error;

      setAiInsight({
        atRiskStudents,
        summary: data.response || "No insights available",
        recommendations: []
      });

      toast.success("AI insights generated!");
    } catch (error) {
      console.error("AI insights error:", error);
      toast.error("Failed to generate insights");
    } finally {
      setLoadingInsights(false);
    }
  };

  const exportToCSV = async () => {
    try {
      let query = supabase.from("attendance").select("*");

      if (!isAdmin && isClassCoordinator && profile) {
        const { data: students } = await supabase
          .from("profiles")
          .select("enrollment_number")
          .eq("course_name", profile.assigned_course)
          .eq("year", profile.assigned_year)
          .eq("section", profile.assigned_section);

        if (students && students.length > 0) {
          const enrollmentNumbers = students.map(s => s.enrollment_number);
          query = query.in("enrollment_number", enrollmentNumbers);
        }
      }

      const { data: attendanceRecords } = await query.order("date", { ascending: false });

      if (!attendanceRecords || attendanceRecords.length === 0) {
        toast.error("No attendance data to export");
        return;
      }

      const headers = ["Enrollment Number", "Student ID", "Subject", "Date", "Total Classes", "Classes Attended", "Percentage"];
      const rows = attendanceRecords.map((record: any) => [
        record.enrollment_number,
        record.student_id,
        record.subject,
        record.date,
        record.total_classes,
        record.classes_attended,
        record.total_classes > 0 ? ((record.classes_attended / record.total_classes) * 100).toFixed(2) + "%" : "0%"
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `attendance-report-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success("Attendance report exported successfully");
    } catch (error) {
      console.error("Error exporting attendance:", error);
      toast.error("Failed to export attendance report");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvData(text);
    };
    reader.readAsText(file);
  };

  const handleSingleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: studentData } = await supabase
        .from("profiles")
        .select("student_id, enrollment_number")
        .eq("enrollment_number", singleStudentData.enrollment_number)
        .single();

      if (!studentData) {
        toast.error("Student not found");
        return;
      }

      const { error } = await supabase.from("attendance").insert({
        student_id: studentData.student_id,
        enrollment_number: studentData.enrollment_number,
        date: singleStudentData.date,
        subject: singleStudentData.subject,
        status: singleStudentData.status,
        total_classes: 1,
        classes_attended: singleStudentData.status === "present" ? 1 : 0,
      });

      if (error) throw error;

      toast.success("Attendance recorded successfully");
      setSingleStudentData({
        enrollment_number: "",
        date: "",
        subject: "",
        status: "",
      });
      loadAttendanceData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const date = formData.get("date") as string;
    const subject = formData.get("subject") as string;

    if (!csvData) {
      toast.error("Please upload a CSV file");
      return;
    }

    try {
      const lines = csvData.trim().split("\n");
      const records = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",");
        if (values.length >= 5) {
          records.push({
            enrollment_number: values[0].trim(),
            student_id: values[1].trim(),
            status: values[2].trim(),
            total_classes: parseInt(values[3].trim()) || 0,
            classes_attended: parseInt(values[4].trim()) || 0,
            date,
            subject,
          });
        }
      }

      const { error } = await supabase.from("attendance").insert(records);

      if (error) {
        toast.error("Failed to upload attendance");
      } else {
        toast.success(`${records.length} attendance records uploaded successfully!`);
        e.currentTarget.reset();
        setCsvData("");
        loadAttendanceData();
      }
    } catch (error) {
      toast.error("Error parsing CSV file");
    }
  };

  return (
    <FacultyLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Manage Attendance</h1>
            <p className="text-sm md:text-base text-muted-foreground">Upload and export attendance records</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={generateAIInsights} disabled={loadingInsights} variant="outline" size="sm">
              {loadingInsights ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              AI Insights
            </Button>
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* AI Insights Panel */}
        {aiInsight && (
          <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">AI Attendance Insights</CardTitle>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setAiInsight(null)}>×</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
                  <Users className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{attendanceData.length}</p>
                    <p className="text-xs text-muted-foreground">Total Students</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                  <div>
                    <p className="text-2xl font-bold">{aiInsight.atRiskStudents.length}</p>
                    <p className="text-xs text-muted-foreground">At Risk (&lt;75%)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
                  <TrendingDown className="h-8 w-8 text-accent" />
                  <div>
                    <p className="text-2xl font-bold">
                      {attendanceData.length > 0 
                        ? (attendanceData.reduce((sum, s) => sum + s.percentage, 0) / attendanceData.length).toFixed(1)
                        : 0}%
                    </p>
                    <p className="text-xs text-muted-foreground">Average Attendance</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-background rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{aiInsight.summary}</p>
              </div>

              {aiInsight.atRiskStudents.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-sm">Students Needing Attention:</h4>
                  <div className="flex flex-wrap gap-2">
                    {aiInsight.atRiskStudents.slice(0, 10).map(student => (
                      <Badge key={student.enrollment_number} variant="destructive" className="text-xs">
                        {student.student_id} ({student.percentage.toFixed(1)}%)
                      </Badge>
                    ))}
                    {aiInsight.atRiskStudents.length > 10 && (
                      <Badge variant="outline">+{aiInsight.atRiskStudents.length - 10} more</Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="single" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">Single Student</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="single">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Record Single Student Attendance</CardTitle>
                <CardDescription className="text-sm">Mark attendance for one student</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSingleStudentSubmit} className="space-y-4">
                  <div>
                    <Label>Enrollment Number</Label>
                    <Input
                      value={singleStudentData.enrollment_number}
                      onChange={(e) => setSingleStudentData({ ...singleStudentData, enrollment_number: e.target.value })}
                      placeholder="Enter enrollment number"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={singleStudentData.date}
                        onChange={(e) => setSingleStudentData({ ...singleStudentData, date: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label>Subject</Label>
                      <Input
                        value={singleStudentData.subject}
                        onChange={(e) => setSingleStudentData({ ...singleStudentData, subject: e.target.value })}
                        placeholder="e.g., Mathematics"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select
                      value={singleStudentData.status}
                      onValueChange={(value) => setSingleStudentData({ ...singleStudentData, status: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="present">Present</SelectItem>
                        <SelectItem value="absent">Absent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Record Attendance
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bulk">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Upload className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg md:text-xl">Upload Attendance</CardTitle>
                  </div>
                  <CardDescription className="text-sm">
                    Upload attendance data in CSV format
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input id="date" name="date" type="date" required />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input id="subject" name="subject" placeholder="e.g., Mathematics" required />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="csv">CSV File</Label>
                      <Input id="csv" type="file" accept=".csv" onChange={handleFileUpload} required />
                      <p className="text-xs text-muted-foreground">
                        Upload a CSV file with columns: enrollment_number, student_id, status, total_classes, classes_attended
                      </p>
                    </div>

                    {csvData && (
                      <div className="space-y-2">
                        <Label>Preview</Label>
                        <Textarea
                          value={csvData.split("\n").slice(0, 5).join("\n")}
                          readOnly
                          rows={5}
                          className="font-mono text-xs"
                        />
                        <p className="text-xs text-muted-foreground">
                          Showing first 5 lines of {csvData.split("\n").length} total lines
                        </p>
                      </div>
                    )}

                    <Button type="submit" className="w-full">
                      Upload Attendance
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg md:text-xl">CSV Format Instructions</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium text-sm md:text-base mb-2">Required Columns:</h3>
                    <ul className="list-disc list-inside space-y-1 text-xs md:text-sm text-muted-foreground">
                      <li>enrollment_number: Student enrollment number</li>
                      <li>student_id: Student ID</li>
                      <li>status: Present/Absent</li>
                      <li>total_classes: Total number of classes</li>
                      <li>classes_attended: Number of classes attended</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-medium text-sm md:text-base mb-2">Example CSV:</h3>
                    <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`enrollment_number,student_id,status,total_classes,classes_attended
EN2024001,STU001,Present,20,18
EN2024002,STU002,Absent,20,15
EN2024003,STU003,Present,20,20`}
                    </pre>
                  </div>

                  <div className="bg-primary/10 p-3 rounded">
                    <p className="text-xs md:text-sm text-primary">
                      <strong>Tip:</strong> Export your attendance data from Excel or Google Sheets as CSV format.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </FacultyLayout>
  );
}
