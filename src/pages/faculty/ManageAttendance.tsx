import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import FacultyLayout from "@/components/FacultyLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Upload, FileText } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

export default function ManageAttendance() {
  const [loading, setLoading] = useState(false);
  const [csvData, setCsvData] = useState("");

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const date = formData.get("date") as string;
    const subject = formData.get("subject") as string;

    if (!csvData) {
      toast.error("Please upload a CSV file");
      setLoading(false);
      return;
    }

    try {
      // Parse CSV (format: enrollment_number,student_id,status,total_classes,classes_attended)
      const lines = csvData.trim().split("\n");
      const headers = lines[0].split(",");
      
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
          <h1 className="text-3xl font-bold mb-2">Manage Attendance</h1>
          <p className="text-muted-foreground">Upload student attendance records via CSV</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                <CardTitle>Upload Attendance</CardTitle>
              </div>
              <CardDescription>
                Upload attendance data in CSV format
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
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

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Uploading..." : "Upload Attendance"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle>CSV Format Instructions</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Required Columns:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>enrollment_number: Student enrollment number</li>
                  <li>student_id: Student ID</li>
                  <li>status: Present/Absent</li>
                  <li>total_classes: Total number of classes</li>
                  <li>classes_attended: Number of classes attended</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium mb-2">Example CSV:</h3>
                <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`enrollment_number,student_id,status,total_classes,classes_attended
EN2024001,STU001,Present,20,18
EN2024002,STU002,Absent,20,15
EN2024003,STU003,Present,20,20`}
                </pre>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Tip:</strong> Export your attendance data from Excel or Google Sheets as CSV format.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </FacultyLayout>
  );
}
