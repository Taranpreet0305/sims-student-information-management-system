
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { registerProfile, enrollmentExists, facultyIdExists } from "@/integrations/firebase/auth";
import FacultyLayout from "@/components/FacultyLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserCheck, Calendar, FileText, TrendingUp, Bell, Briefcase, Vote, Shield, Activity, Plus } from "lucide-react";
import { useFacultyRole } from "@/hooks/useFacultyRole";
import { Link } from "react-router-dom";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import * as XLSX from "xlsx";

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

interface BulkCredentialRow {
  id: string;
  password: string;
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
  const [departments, setDepartments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [studentBulkRows, setStudentBulkRows] = useState<BulkCredentialRow[]>([]);
  const [facultyBulkRows, setFacultyBulkRows] = useState<BulkCredentialRow[]>([]);
  const [studentBulkErrors, setStudentBulkErrors] = useState<string[]>([]);
  const [facultyBulkErrors, setFacultyBulkErrors] = useState<string[]>([]);
  const [studentBulkFileName, setStudentBulkFileName] = useState("");
  const [facultyBulkFileName, setFacultyBulkFileName] = useState("");
  const [studentBulkResults, setStudentBulkResults] = useState<string[]>([]);
  const [facultyBulkResults, setFacultyBulkResults] = useState<string[]>([]);

  const [studentForm, setStudentForm] = useState({
    name: "",
    enrollment_number: "",
    student_id: "",
    email: "",
    course_name: "",
    year: 1,
    admission_year: new Date().getFullYear(),
    section: "GENERAL",
    password: "",
  });

  const [facultyForm, setFacultyForm] = useState({
    name: "",
    faculty_id: "",
    email: "",
    department: "",
    role: "Assistant Professor",
    accountType: "faculty",
    password: "",
  });

  const [assignmentForm, setAssignmentForm] = useState({
    faculty_id: "",
    course: "",
    semester: 1,
    section: "",
    subject: "",
    time_slot: "",
    department: "",
  });

  const [departmentName, setDepartmentName] = useState("");
  const [courseName, setCourseName] = useState("");
  const [courseDepartment, setCourseDepartment] = useState("");

  useEffect(() => {
    if (isAdmin) {
      loadSystemStats();
      loadRecentActivities();
      loadCourseDistribution();
      loadDepartments();
      loadCourses();
      loadFacultyList();
    }
  }, [isAdmin]);

  const loadSystemStats = async () => {
    try {
      setLoading(true);

      const { count: totalStudents } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      const { count: verifiedStudents } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("verify", true);

      const { count: totalFaculty } = await supabase
        .from("faculty_profiles")
        .select("*", { count: "exact", head: true });

      const { count: verifiedFaculty } = await supabase
        .from("faculty_profiles")
        .select("*", { count: "exact", head: true })
        .eq("verify", true);

      const { count: totalPlacements } = await supabase
        .from("placements")
        .select("*", { count: "exact", head: true });

      const { count: activePlacements } = await supabase
        .from("placements")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      const { count: totalElections } = await supabase
        .from("elections")
        .select("*", { count: "exact", head: true });

      const { count: activeElections } = await supabase
        .from("elections")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      const { count: totalFeedback } = await supabase
        .from("feedback")
        .select("*", { count: "exact", head: true });

      const { count: totalNotifications } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true });

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

      const { data: recentStudents } = await supabase
        .from("profiles")
        .select("name, created_at")
        .order("created_at", { ascending: false })
        .limit(3);

      recentStudents?.forEach((student) => {
        activities.push({
          id: `student-${student.name}-${student.created_at}`,
          type: "student_registration",
          description: `${student.name} registered as a student`,
          timestamp: student.created_at,
        });
      });

      const { data: recentPlacements } = await supabase
        .from("placements")
        .select("company_name, created_at")
        .order("created_at", { ascending: false })
        .limit(3);

      recentPlacements?.forEach((placement) => {
        activities.push({
          id: `placement-${placement.company_name}-${placement.created_at}`,
          type: "placement",
          description: `New placement drive posted: ${placement.company_name}`,
          timestamp: placement.created_at,
        });
      });

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

  const loadDepartments = async () => {
    const { data } = await supabase.from("departments").select("*").order("name", { ascending: true });
    if (data) setDepartments(data);
  };

  const loadCourses = async () => {
    const { data } = await supabase.from("courses").select("*").order("name", { ascending: true });
    if (data) setCourses(data);
  };

  const loadFacultyList = async () => {
    const { data } = await supabase.from("faculty_profiles").select("id, name, faculty_id, department");
    if (data) setFacultyList(data);
  };

  const normalizeHeader = (value: unknown) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const parseBulkFile = async (file: File, mode: "student" | "faculty") => {
    let rows: unknown[][] = [];
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true }) as unknown[][];
    } catch (error) {
      if (mode === "student") {
        setStudentBulkRows([]);
        setStudentBulkErrors(["Unable to read this file. Please upload a valid .xlsx or .csv file."]);
        setStudentBulkFileName(file.name);
      } else {
        setFacultyBulkRows([]);
        setFacultyBulkErrors(["Unable to read this file. Please upload a valid .xlsx or .csv file."]);
        setFacultyBulkFileName(file.name);
      }
      toast.error("Failed to read the file. Please upload a valid Excel/CSV file.");
      return;
    }

    const errors: string[] = [];
    if (!rows.length) {
      errors.push("The file is empty.");
    }

    const headers = (rows[0] || []).map(normalizeHeader);
    const studentIdKeys = [
      "student enrollment number",
      "student enrolment number",
      "student enerolment number",
      "enrollment number",
      "enrolment number",
      "enrollment",
      "enrolment",
    ];
    const facultyIdKeys = ["faculty id", "faculty_id", "facultyid", "faculty"];
    const passwordKeys = ["password", "pass", "pwd"];

    const findIndex = (keys: string[]) =>
      headers.findIndex((h) => keys.includes(h));

    const idIndex =
      mode === "student" ? findIndex(studentIdKeys) : findIndex(facultyIdKeys);
    const passwordIndex = findIndex(passwordKeys);

    if (idIndex === -1) {
      errors.push(
        mode === "student"
          ? "Missing column: Student Enrollment Number"
          : "Missing column: Faculty ID"
      );
    }
    if (passwordIndex === -1) {
      errors.push("Missing column: Password");
    }

    const parsedRows: BulkCredentialRow[] = [];
    const seenIds = new Set<string>();
    if (idIndex !== -1 && passwordIndex !== -1) {
      rows.slice(1).forEach((row, idx) => {
        const idRaw = row[idIndex];
        const passwordRaw = row[passwordIndex];
        const id = String(idRaw || "").trim();
        const password = String(passwordRaw || "").trim();
        if (!id && !password) return;
        if (!id || !password) {
          errors.push(`Row ${idx + 2}: Missing ${!id ? "ID" : "password"}.`);
          return;
        }
        if (mode === "student" && !/^\d+$/.test(id)) {
          errors.push(`Row ${idx + 2}: Enrollment number must be numeric.`);
          return;
        }
        if (seenIds.has(id)) {
          errors.push(`Row ${idx + 2}: Duplicate ID ${id}.`);
          return;
        }
        seenIds.add(id);
        parsedRows.push({ id, password });
      });
    }

    if (mode === "student") {
      setStudentBulkRows(parsedRows);
      setStudentBulkErrors(errors);
      setStudentBulkFileName(file.name);
      setStudentBulkResults([]);
    } else {
      setFacultyBulkRows(parsedRows);
      setFacultyBulkErrors(errors);
      setFacultyBulkFileName(file.name);
      setFacultyBulkResults([]);
    }
  };

  const createBulkStudents = async () => {
    if (!studentBulkRows.length) {
      toast.error("No valid student rows to create.");
      return;
    }
    setStudentBulkResults([]);
    let success = 0;
    let failed = 0;
    const results: string[] = [];
    for (const row of studentBulkRows) {
      try {
        const exists = await enrollmentExists(row.id);
        if (exists) {
          failed += 1;
          results.push(`Enrollment ${row.id}: already exists`);
          continue;
        }
        const newId = crypto.randomUUID();
        await registerProfile(
          "profiles",
          {
            id: newId,
            name: "Student",
            enrollment_number: row.id,
            student_id: row.id,
            email: undefined,
            course_name: "UNKNOWN",
            course: "UNKNOWN",
            year: 1,
            admission_year: new Date().getFullYear(),
            section: "GENERAL",
            verify: true,
            profile_completed: false,
          },
          row.password
        );
        success += 1;
        results.push(`Enrollment ${row.id}: created (password: ${row.password})`);
      } catch (error: any) {
        failed += 1;
        results.push(`Enrollment ${row.id}: failed (${error?.message || "unknown error"})`);
      }
    }
    toast.success(`Bulk students created: ${success} success, ${failed} failed.`);
    setStudentBulkResults(results);
    loadSystemStats();
  };

  const createBulkFaculty = async () => {
    if (!facultyBulkRows.length) {
      toast.error("No valid faculty rows to create.");
      return;
    }
    setFacultyBulkResults([]);
    let success = 0;
    let failed = 0;
    const results: string[] = [];
    for (const row of facultyBulkRows) {
      try {
        const exists = await facultyIdExists(row.id);
        if (exists) {
          failed += 1;
          results.push(`Faculty ${row.id}: already exists`);
          continue;
        }
        const newId = crypto.randomUUID();
        await registerProfile(
          "faculty_profiles",
          {
            id: newId,
            name: "Faculty",
            faculty_id: row.id,
            email: undefined,
            department: "GENERAL",
            role: "Assistant Professor",
            verify: true,
            profile_completed: false,
          },
          row.password
        );
        success += 1;
        results.push(`Faculty ${row.id}: created (password: ${row.password})`);
      } catch (error: any) {
        failed += 1;
        results.push(`Faculty ${row.id}: failed (${error?.message || "unknown error"})`);
      }
    }
    toast.success(`Bulk faculty created: ${success} success, ${failed} failed.`);
    setFacultyBulkResults(results);
    loadFacultyList();
    loadSystemStats();
  };

  const createStudentAccount = async () => {
    if (!studentForm.enrollment_number || !studentForm.password) {
      toast.error("Enrollment number and password are required");
      return;
    }
    if (!/^\d+$/.test(studentForm.enrollment_number)) {
      toast.error("Enrollment number must be numeric");
      return;
    }

    try {
      const newId = crypto.randomUUID();
      await registerProfile(
        "profiles",
        {
          id: newId,
          name: studentForm.name || "Student",
          enrollment_number: studentForm.enrollment_number,
          student_id: studentForm.student_id || studentForm.enrollment_number,
          email: studentForm.email || undefined,
          course_name: studentForm.course_name,
          course: studentForm.course_name,
          year: studentForm.year,
          admission_year: studentForm.admission_year,
          section: studentForm.admission_year === 2023 ? studentForm.section : "GENERAL",
          verify: true,
          profile_completed: false,
        },
        studentForm.password
      );

      toast.success("Student account created");
      setStudentForm({
        name: "",
        enrollment_number: "",
        student_id: "",
        email: "",
        course_name: "",
        year: 1,
        admission_year: new Date().getFullYear(),
        section: "GENERAL",
        password: "",
      });
      loadSystemStats();
    } catch (error) {
      toast.error("Failed to create student account");
    }
  };

  const createFacultyAccount = async () => {
    if (!facultyForm.faculty_id || !facultyForm.password) {
      toast.error("Faculty ID and password are required");
      return;
    }

    try {
      const newId = crypto.randomUUID();
      await registerProfile(
        "faculty_profiles",
        {
          id: newId,
          name: facultyForm.name || "Faculty",
          faculty_id: facultyForm.faculty_id,
          email: facultyForm.email || undefined,
          department: facultyForm.department,
          role: facultyForm.role,
          verify: true,
          profile_completed: false,
        },
        facultyForm.password
      );

      if (facultyForm.accountType === "admin") {
        await supabase.from("user_roles").insert({
          user_id: newId,
          role: "admin",
        });
      }

      toast.success("Faculty account created");
      setFacultyForm({
        name: "",
        faculty_id: "",
        email: "",
        department: "",
        role: "Assistant Professor",
        accountType: "faculty",
        password: "",
      });
      loadFacultyList();
      loadSystemStats();
    } catch (error) {
      toast.error("Failed to create faculty account");
    }
  };

  const assignClassToFaculty = async () => {
    if (!assignmentForm.faculty_id || !assignmentForm.course || !assignmentForm.section || !assignmentForm.subject) {
      toast.error("Please fill all class assignment fields");
      return;
    }

    try {
      const { data } = await supabase
        .from("faculty_assignments")
        .select("*")
        .eq("faculty_id", assignmentForm.faculty_id)
        .maybeSingle();

      const existing = data?.assigned_classes || [];
      const next = [
        ...existing,
        {
          course: assignmentForm.course,
          semester: assignmentForm.semester,
          section: assignmentForm.section,
          subject: assignmentForm.subject,
          time_slot: assignmentForm.time_slot,
          department: assignmentForm.department || null,
        },
      ];

      if (data?.id) {
        await supabase.from("faculty_assignments").update({ assigned_classes: next }).eq("id", data.id);
      } else {
        await supabase.from("faculty_assignments").insert({
          faculty_id: assignmentForm.faculty_id,
          assigned_classes: next,
        });
      }

      await supabase
        .from("faculty_profiles")
        .update({
          assigned_course: assignmentForm.course,
          assigned_year: assignmentForm.semester,
          assigned_section: assignmentForm.section,
        })
        .eq("faculty_id", assignmentForm.faculty_id);

      toast.success("Class assigned to faculty");
      setAssignmentForm({
        faculty_id: "",
        course: "",
        semester: 1,
        section: "",
        subject: "",
        time_slot: "",
        department: "",
      });
    } catch (error) {
      toast.error("Failed to assign class");
    }
  };

  const addDepartment = async () => {
    if (!departmentName.trim()) {
      toast.error("Department name required");
      return;
    }
    await supabase.from("departments").insert({ name: departmentName.trim() });
    setDepartmentName("");
    loadDepartments();
  };

  const addCourse = async () => {
    if (!courseName.trim() || !courseDepartment) {
      toast.error("Course name and department required");
      return;
    }
    await supabase.from("courses").insert({ name: courseName.trim(), department: courseDepartment });
    setCourseName("");
    setCourseDepartment("");
    loadCourses();
  };

  if (!isAdmin) {
    return (
      <FacultyLayout>
        <Card className="border border-border/60 bg-card/70">
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
          <h1 className="text-2xl md:text-3xl font-semibold mb-1 md:mb-2">Admin Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground">System-wide statistics and recent activities</p>
        </div>

        <Card className="border border-border/60 bg-card/70">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
              <Button asChild variant="outline" size="sm" className="h-auto py-2 px-3">
                <Link to="/faculty/timetable" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs sm:text-sm">Timetable</span>
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
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-card/70">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">Bulk Credentials Upload</CardTitle>
            <CardDescription>
              Upload Excel/CSV with required columns and preview the data before creating accounts.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="text-sm font-medium">Students</div>
                <div className="rounded-lg border border-border/60 bg-background/60 p-3 text-xs">
                  <div className="font-medium mb-2">Required Columns</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-md border border-border/60 bg-card/70 px-2 py-1">Student Enrollment Number</div>
                    <div className="rounded-md border border-border/60 bg-card/70 px-2 py-1">Password</div>
                  </div>
                  <div className="mt-2 text-muted-foreground">
                    Tip: set the Password column to Text in Excel to preserve leading zeros.
                  </div>
                </div>
                <Input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) parseBulkFile(file, "student");
                  }}
                />
                {studentBulkFileName && (
                  <div className="text-xs text-muted-foreground">Loaded: {studentBulkFileName}</div>
                )}
                {studentBulkErrors.length > 0 && (
                  <div className="text-xs text-destructive space-y-1">
                    {studentBulkErrors.slice(0, 6).map((err) => (
                      <div key={err}>{err}</div>
                    ))}
                    {studentBulkErrors.length > 6 && <div>+{studentBulkErrors.length - 6} more</div>}
                  </div>
                )}
                {studentBulkRows.length > 0 && (
                  <div className="rounded-lg border border-border/60 overflow-hidden">
                    <div className="px-3 py-2 text-xs text-muted-foreground bg-background/60">
                      Preview ({studentBulkRows.length} rows, showing first 5)
                    </div>
                    <table className="w-full text-xs">
                      <thead className="bg-muted/40">
                        <tr>
                          <th className="text-left px-3 py-2">Enrollment</th>
                          <th className="text-left px-3 py-2">Password</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentBulkRows.slice(0, 5).map((row) => (
                          <tr key={`${row.id}-${row.password}`} className="border-t border-border/60">
                            <td className="px-3 py-2">{row.id}</td>
                            <td className="px-3 py-2">{row.password}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <Button onClick={createBulkStudents} disabled={studentBulkRows.length === 0 || studentBulkErrors.length > 0}>
                  Create Students From File
                </Button>
                {studentBulkResults.length > 0 && (
                  <div className="text-xs text-muted-foreground space-y-1">
                    {studentBulkResults.slice(0, 8).map((line) => (
                      <div key={line}>{line}</div>
                    ))}
                    {studentBulkResults.length > 8 && <div>+{studentBulkResults.length - 8} more</div>}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="text-sm font-medium">Faculty</div>
                <div className="rounded-lg border border-border/60 bg-background/60 p-3 text-xs">
                  <div className="font-medium mb-2">Required Columns</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-md border border-border/60 bg-card/70 px-2 py-1">Faculty ID</div>
                    <div className="rounded-md border border-border/60 bg-card/70 px-2 py-1">Password</div>
                  </div>
                  <div className="mt-2 text-muted-foreground">
                    Tip: set the Password column to Text in Excel to preserve leading zeros.
                  </div>
                </div>
                <Input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) parseBulkFile(file, "faculty");
                  }}
                />
                {facultyBulkFileName && (
                  <div className="text-xs text-muted-foreground">Loaded: {facultyBulkFileName}</div>
                )}
                {facultyBulkErrors.length > 0 && (
                  <div className="text-xs text-destructive space-y-1">
                    {facultyBulkErrors.slice(0, 6).map((err) => (
                      <div key={err}>{err}</div>
                    ))}
                    {facultyBulkErrors.length > 6 && <div>+{facultyBulkErrors.length - 6} more</div>}
                  </div>
                )}
                {facultyBulkRows.length > 0 && (
                  <div className="rounded-lg border border-border/60 overflow-hidden">
                    <div className="px-3 py-2 text-xs text-muted-foreground bg-background/60">
                      Preview ({facultyBulkRows.length} rows, showing first 5)
                    </div>
                    <table className="w-full text-xs">
                      <thead className="bg-muted/40">
                        <tr>
                          <th className="text-left px-3 py-2">Faculty ID</th>
                          <th className="text-left px-3 py-2">Password</th>
                        </tr>
                      </thead>
                      <tbody>
                        {facultyBulkRows.slice(0, 5).map((row) => (
                          <tr key={`${row.id}-${row.password}`} className="border-t border-border/60">
                            <td className="px-3 py-2">{row.id}</td>
                            <td className="px-3 py-2">{row.password}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <Button onClick={createBulkFaculty} disabled={facultyBulkRows.length === 0 || facultyBulkErrors.length > 0}>
                  Create Faculty From File
                </Button>
                {facultyBulkResults.length > 0 && (
                  <div className="text-xs text-muted-foreground space-y-1">
                    {facultyBulkResults.slice(0, 8).map((line) => (
                      <div key={line}>{line}</div>
                    ))}
                    {facultyBulkResults.length > 8 && <div>+{facultyBulkResults.length - 8} more</div>}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border border-border/60 bg-card/70">
            <CardHeader>
              <CardTitle>Create Student Account</CardTitle>
              <CardDescription>Admin creates student accounts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Name</Label>
                  <Input value={studentForm.name} onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })} />
                </div>
                <div>
                  <Label>Enrollment Number</Label>
                  <Input value={studentForm.enrollment_number} onChange={(e) => setStudentForm({ ...studentForm, enrollment_number: e.target.value })} />
                </div>
                <div>
                  <Label>Student ID</Label>
                  <Input value={studentForm.student_id} onChange={(e) => setStudentForm({ ...studentForm, student_id: e.target.value })} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={studentForm.email} onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })} />
                </div>
                <div>
                  <Label>Course</Label>
                  <Input value={studentForm.course_name} onChange={(e) => setStudentForm({ ...studentForm, course_name: e.target.value })} />
                </div>
                <div>
                  <Label>Year</Label>
                  <Input type="number" min="1" max="8" value={studentForm.year} onChange={(e) => setStudentForm({ ...studentForm, year: parseInt(e.target.value) })} />
                </div>
                <div>
                  <Label>Admission Year</Label>
                  <Input type="number" min="2020" max="2100" value={studentForm.admission_year} onChange={(e) => setStudentForm({ ...studentForm, admission_year: parseInt(e.target.value) })} />
                </div>
                <div>
                  <Label>Section</Label>
                  <Input value={studentForm.section} onChange={(e) => setStudentForm({ ...studentForm, section: e.target.value })} />
                </div>
                <div>
                  <Label>Password</Label>
                  <Input type="password" value={studentForm.password} onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })} />
                </div>
              </div>
              <Button onClick={createStudentAccount}>Create Student</Button>
            </CardContent>
          </Card>

          <Card className="border border-border/60 bg-card/70">
            <CardHeader>
              <CardTitle>Create Faculty Account</CardTitle>
              <CardDescription>Admin creates faculty accounts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Name</Label>
                  <Input value={facultyForm.name} onChange={(e) => setFacultyForm({ ...facultyForm, name: e.target.value })} />
                </div>
                <div>
                  <Label>Faculty ID</Label>
                  <Input value={facultyForm.faculty_id} onChange={(e) => setFacultyForm({ ...facultyForm, faculty_id: e.target.value })} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={facultyForm.email} onChange={(e) => setFacultyForm({ ...facultyForm, email: e.target.value })} />
                </div>
                <div>
                  <Label>Department</Label>
                  <Input value={facultyForm.department} onChange={(e) => setFacultyForm({ ...facultyForm, department: e.target.value })} />
                </div>
                <div>
                  <Label>Role</Label>
                  <Input value={facultyForm.role} onChange={(e) => setFacultyForm({ ...facultyForm, role: e.target.value })} />
                </div>
                <div>
                  <Label>Account Type</Label>
                  <Select value={facultyForm.accountType} onValueChange={(value) => setFacultyForm({ ...facultyForm, accountType: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="faculty">Faculty</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Password</Label>
                  <Input type="password" value={facultyForm.password} onChange={(e) => setFacultyForm({ ...facultyForm, password: e.target.value })} />
                </div>
              </div>
              <Button onClick={createFacultyAccount}>Create Faculty</Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border border-border/60 bg-card/70">
            <CardHeader>
              <CardTitle>Assign Class to Faculty</CardTitle>
              <CardDescription>Map faculty to classes and subjects</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Faculty ID</Label>
                  <Select value={assignmentForm.faculty_id} onValueChange={(value) => setAssignmentForm({ ...assignmentForm, faculty_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select faculty" />
                    </SelectTrigger>
                    <SelectContent>
                      {facultyList.map((f) => (
                        <SelectItem key={f.id} value={f.faculty_id}>
                          {f.name} ({f.faculty_id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Course</Label>
                  <Input value={assignmentForm.course} onChange={(e) => setAssignmentForm({ ...assignmentForm, course: e.target.value })} />
                </div>
                <div>
                  <Label>Semester</Label>
                  <Input type="number" min="1" max="8" value={assignmentForm.semester} onChange={(e) => setAssignmentForm({ ...assignmentForm, semester: parseInt(e.target.value) })} />
                </div>
                <div>
                  <Label>Section</Label>
                  <Input value={assignmentForm.section} onChange={(e) => setAssignmentForm({ ...assignmentForm, section: e.target.value })} />
                </div>
                <div>
                  <Label>Subject</Label>
                  <Input value={assignmentForm.subject} onChange={(e) => setAssignmentForm({ ...assignmentForm, subject: e.target.value })} />
                </div>
                <div>
                  <Label>Time Slot</Label>
                  <Input value={assignmentForm.time_slot} onChange={(e) => setAssignmentForm({ ...assignmentForm, time_slot: e.target.value })} placeholder="e.g., 10:00-11:00" />
                </div>
                <div>
                  <Label>Department</Label>
                  <Input value={assignmentForm.department} onChange={(e) => setAssignmentForm({ ...assignmentForm, department: e.target.value })} />
                </div>
              </div>
              <Button onClick={assignClassToFaculty}>
                <Plus className="h-4 w-4 mr-2" />
                Assign Class
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-border/60 bg-card/70">
            <CardHeader>
              <CardTitle>Manage Departments</CardTitle>
              <CardDescription>Add departments and keep them organized</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input value={departmentName} onChange={(e) => setDepartmentName(e.target.value)} placeholder="Department name" />
                <Button onClick={addDepartment}>Add</Button>
              </div>
              <div className="text-sm text-muted-foreground">
                {departments.length === 0 ? "No departments yet" : `${departments.length} departments`}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-border/60 bg-card/70">
          <CardHeader>
            <CardTitle>Manage Courses</CardTitle>
            <CardDescription>Create courses linked to departments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Course Name</Label>
                <Input value={courseName} onChange={(e) => setCourseName(e.target.value)} />
              </div>
              <div>
                <Label>Department</Label>
                <Select value={courseDepartment} onValueChange={setCourseDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id || d.name} value={d.name}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={addCourse}>
              <Plus className="h-4 w-4 mr-2" />
              Add Course
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          <Card className="border border-border/60 bg-card/70">
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

          <Card className="border border-border/60 bg-card/70">
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

          <Card className="border border-border/60 bg-card/70">
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

          <Card className="border border-border/60 bg-card/70">
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

          <Card className="border border-border/60 bg-card/70">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-4">
              <CardTitle className="text-xs md:text-sm font-medium">Attendance</CardTitle>
              <Calendar className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 md:p-4 pt-0">
              <div className="text-xl md:text-2xl font-bold">{loading ? "..." : `${stats.averageAttendance}%`}</div>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-1">Average</p>
            </CardContent>
          </Card>

          <Card className="border border-border/60 bg-card/70">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-4">
              <CardTitle className="text-xs md:text-sm font-medium">Feedback</CardTitle>
              <FileText className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 md:p-4 pt-0">
              <div className="text-xl md:text-2xl font-bold">{loading ? "..." : stats.totalFeedback}</div>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-1">Total</p>
            </CardContent>
          </Card>

          <Card className="border border-border/60 bg-card/70">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-4">
              <CardTitle className="text-xs md:text-sm font-medium">Notices</CardTitle>
              <Bell className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 md:p-4 pt-0">
              <div className="text-xl md:text-2xl font-bold">{loading ? "..." : stats.totalNotifications}</div>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-1">Posted</p>
            </CardContent>
          </Card>

          <Card className="border border-border/60 bg-card/70">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-4">
              <CardTitle className="text-xs md:text-sm font-medium">Status</CardTitle>
              <Activity className="h-3 w-3 md:h-4 md:w-4 text-primary" />
            </CardHeader>
            <CardContent className="p-3 md:p-4 pt-0">
              <div className="text-xl md:text-2xl font-bold text-foreground">Active</div>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-1">Operational</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {courseDistribution.length > 0 && (
            <Card className="overflow-hidden border border-border/60 bg-card/70">
              <CardHeader className="p-3 sm:p-4 md:p-6">
                <CardTitle className="text-sm sm:text-base md:text-lg">Student Distribution</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Verified students per course</CardDescription>
              </CardHeader>
              <CardContent className="p-2 sm:p-4 md:p-6 pt-0">
                <ChartContainer
                  config={{
                    students: {
                      label: "Students",
                      color: "hsl(var(--primary))",
                    },
                  }}
                  className="h-[180px] sm:h-[220px] md:h-[280px] w-full max-w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={courseDistribution} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="course"
                        tick={{ fill: "hsl(var(--foreground))", fontSize: 9 }}
                        tickLine={false}
                        axisLine={false}
                        angle={-45}
                        textAnchor="end"
                        height={50}
                        interval={0}
                      />
                      <YAxis
                        tick={{ fill: "hsl(var(--foreground))", fontSize: 9 }}
                        tickLine={false}
                        axisLine={false}
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

          <Card className="border border-border/60 bg-card/70">
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
                    <div key={activity.id} className="flex items-start gap-2 md:gap-3 p-2 md:p-3 border border-border/60 rounded-lg">
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
