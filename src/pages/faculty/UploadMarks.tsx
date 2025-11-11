import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import FacultyLayout from "@/components/FacultyLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Award, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function UploadMarks() {
  const [loading, setLoading] = useState(false);
  const [csvData, setCsvData] = useState("");
  const [singleStudentData, setSingleStudentData] = useState({
    enrollment_number: "",
    term: "",
    subject: "",
    internal_marks: "",
    external_marks: "",
    total_marks: "",
    grade: "",
    credits: "",
  });

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
    setLoading(true);

    try {
      const { data: studentData } = await supabase
        .from("profiles")
        .select("student_id, enrollment_number")
        .eq("enrollment_number", singleStudentData.enrollment_number)
        .single();

      if (!studentData) {
        toast.error("Student not found");
        setLoading(false);
        return;
      }

      const { error } = await supabase.from("student_marks").insert({
        student_id: studentData.student_id,
        enrollment_number: studentData.enrollment_number,
        term: singleStudentData.term,
        subject: singleStudentData.subject,
        internal_marks: parseFloat(singleStudentData.internal_marks) || null,
        external_marks: parseFloat(singleStudentData.external_marks) || null,
        total_marks: parseFloat(singleStudentData.total_marks) || null,
        grade: singleStudentData.grade || null,
        credits: parseInt(singleStudentData.credits) || null,
      });

      if (error) throw error;

      toast.success("Marks recorded successfully");
      setSingleStudentData({
        enrollment_number: "",
        term: "",
        subject: "",
        internal_marks: "",
        external_marks: "",
        total_marks: "",
        grade: "",
        credits: "",
      });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const term = formData.get("term") as string;
    const subject = formData.get("subject") as string;

    if (!csvData) {
      toast.error("Please upload a CSV file");
      setLoading(false);
      return;
    }

    try {
      const lines = csvData.trim().split("\n");
      const records = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",");
        if (values.length >= 7) {
          records.push({
            enrollment_number: values[0].trim(),
            student_id: values[1].trim(),
            internal_marks: parseFloat(values[2].trim()) || null,
            external_marks: parseFloat(values[3].trim()) || null,
            total_marks: parseFloat(values[4].trim()) || null,
            grade: values[5].trim() || null,
            credits: parseInt(values[6].trim()) || null,
            term,
            subject,
          });
        }
      }

      const { error } = await supabase.from("student_marks").insert(records);

      if (error) {
        toast.error("Failed to upload marks");
      } else {
        toast.success(`${records.length} mark records uploaded successfully!`);
        e.currentTarget.reset();
        setCsvData("");
      }
    } catch (error) {
      toast.error("Error parsing CSV file");
    }

    setLoading(false);
  };

  return (
    <FacultyLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Upload Marks</h1>
          <p className="text-sm md:text-base text-muted-foreground">Upload student marks and grades</p>
        </div>

        <Tabs defaultValue="single" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">Single Student</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="single">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg md:text-xl">Enter Single Student Marks</CardTitle>
                </div>
                <CardDescription className="text-sm">
                  Record marks for one student
                </CardDescription>
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
                      <Label>Term/Semester</Label>
                      <Input
                        value={singleStudentData.term}
                        onChange={(e) => setSingleStudentData({ ...singleStudentData, term: e.target.value })}
                        placeholder="e.g., Semester 1"
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Internal Marks</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={singleStudentData.internal_marks}
                        onChange={(e) => setSingleStudentData({ ...singleStudentData, internal_marks: e.target.value })}
                        placeholder="25"
                      />
                    </div>
                    <div>
                      <Label>External Marks</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={singleStudentData.external_marks}
                        onChange={(e) => setSingleStudentData({ ...singleStudentData, external_marks: e.target.value })}
                        placeholder="70"
                      />
                    </div>
                    <div>
                      <Label>Total Marks</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={singleStudentData.total_marks}
                        onChange={(e) => setSingleStudentData({ ...singleStudentData, total_marks: e.target.value })}
                        placeholder="95"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Grade</Label>
                      <Input
                        value={singleStudentData.grade}
                        onChange={(e) => setSingleStudentData({ ...singleStudentData, grade: e.target.value })}
                        placeholder="A+"
                      />
                    </div>
                    <div>
                      <Label>Credits</Label>
                      <Input
                        type="number"
                        value={singleStudentData.credits}
                        onChange={(e) => setSingleStudentData({ ...singleStudentData, credits: e.target.value })}
                        placeholder="4"
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full">
                    <Award className="h-4 w-4 mr-2" />
                    {loading ? "Recording..." : "Record Marks"}
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
                    <CardTitle className="text-lg md:text-xl">Upload Marks</CardTitle>
                  </div>
                  <CardDescription className="text-sm">
                    Upload marks data in CSV format
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="term">Term/Semester</Label>
                      <Input
                        id="term"
                        name="term"
                        placeholder="e.g., Semester 1, Mid-Term, Final"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        name="subject"
                        placeholder="e.g., Mathematics"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="csv">CSV File</Label>
                      <Input
                        id="csv"
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Upload a CSV with: enrollment_number, student_id, internal_marks, external_marks, total_marks, grade, credits
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

                    <Button type="submit" disabled={loading} className="w-full">
                      {loading ? "Uploading..." : "Upload Marks"}
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
                      <li>internal_marks: Internal assessment marks</li>
                      <li>external_marks: External exam marks</li>
                      <li>total_marks: Total marks obtained</li>
                      <li>grade: Grade (A, B, C, etc.)</li>
                      <li>credits: Course credits</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-medium text-sm md:text-base mb-2">Example CSV:</h3>
                    <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`enrollment_number,student_id,internal_marks,external_marks,total_marks,grade,credits
EN2024001,STU001,25,70,95,A+,4
EN2024002,STU002,22,65,87,A,4
EN2024003,STU003,20,60,80,B+,4`}
                    </pre>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded">
                    <p className="text-xs md:text-sm text-blue-900 dark:text-blue-100">
                      <strong>Tip:</strong> Export your marks data from Excel or Google Sheets as CSV format.
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
