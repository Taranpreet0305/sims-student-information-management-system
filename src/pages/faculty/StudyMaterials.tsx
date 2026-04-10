import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import FacultyLayout from "@/components/FacultyLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PDFPreview } from "@/components/PDFPreview";
import { Badge } from "@/components/ui/badge";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/PullToRefreshIndicator";
import { useFacultyRole } from "@/hooks/useFacultyRole";

interface StudyMaterial {
  id: string;
  title: string;
  subject: string;
  course_name: string;
  year: number;
  semester?: number | null;
  section: string | null;
  department?: string | null;
  description: string | null;
  file_url: string;
  file_path?: string | null;
  file_type: string | null;
  created_at: string;
}

export default function StudyMaterials() {
  const { isAdmin, assignedClasses } = useFacultyRole();
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    course_name: "",
    year: 1,
    section: "",
    department: "",
    description: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [classKey, setClassKey] = useState("");

  useEffect(() => {
    loadMaterials();
  }, []);

  useEffect(() => {
    if (!isAdmin && assignedClasses.length > 0 && !classKey) {
      const first = assignedClasses[0];
      const key = `${first.course}|${first.semester}|${first.section}|${first.subject}|${first.department ?? ""}`;
      setClassKey(key);
      setFormData((prev) => ({
        ...prev,
        course_name: first.course,
        year: first.semester,
        section: first.section,
        subject: first.subject,
        department: first.department ?? "",
      }));
    }
  }, [assignedClasses, isAdmin, classKey]);

  const loadMaterials = useCallback(async () => {
    let query = supabase
      .from("study_materials")
      .select("*")
      .order("created_at", { ascending: false });

    if (!isAdmin && assignedClasses.length > 0) {
      const allowed = assignedClasses.map((cls) => `${cls.course}|${cls.semester}|${cls.section}|${cls.subject}`);
      const { data } = await query;
      const filtered = (data || []).filter((m: any) =>
        allowed.includes(`${m.course_name}|${m.year}|${m.section}|${m.subject}`)
      );
      setMaterials(filtered);
      return;
    }

    const { data } = await query;
    if (data) setMaterials(data);
  }, [isAdmin, assignedClasses]);

  const { isRefreshing, pullDistance, threshold } = usePullToRefresh({
    onRefresh: loadMaterials,
  });

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }
    if (!isAdmin && !classKey) {
      toast.error("Please select an assigned class");
      return;
    }

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${formData.course_name}/${formData.year}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("study-materials")
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = await supabase.storage
        .from("study-materials")
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from("study_materials")
        .insert({
          ...formData,
          section: formData.section || null,
          file_url: publicUrl,
          file_path: filePath,
          file_type: fileExt,
          semester: formData.year,
          department: formData.department || null,
          uploaded_by: (await supabase.auth.getUser()).data.user?.id,
        });

      if (insertError) throw insertError;

      toast.success("Study material uploaded successfully");
      setFormData({
        title: "",
        subject: "",
        course_name: "",
        year: 1,
        section: "",
        department: "",
        description: "",
      });
      setSelectedFile(null);
      loadMaterials();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, fileUrl: string, filePath?: string | null) => {
    try {
      const pathToDelete =
        filePath ||
        fileUrl.split("/study-materials/")[1] ||
        fileUrl.split("/o/")[1]?.split("?")[0];
      if (pathToDelete) {
        const decodedPath = pathToDelete.includes("%2F")
          ? decodeURIComponent(pathToDelete)
          : pathToDelete;
        await supabase.storage.from("study-materials").remove([decodedPath]);
      }
      await supabase.from("study_materials").delete().eq("id", id);
      toast.success("Material deleted successfully");
      loadMaterials();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <FacultyLayout>
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        threshold={threshold}
        isRefreshing={isRefreshing}
      />
      <div className="space-y-6" data-pull-to-refresh>
        <div>
          <h1 className="text-3xl font-bold mb-2">Study Materials</h1>
          <p className="text-muted-foreground">Upload and manage study materials for students</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upload New Material</CardTitle>
            <CardDescription>Share notes, presentations, and documents with students</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Subject</Label>
                  <Input
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                    readOnly={!isAdmin}
                    className={!isAdmin ? "bg-muted" : undefined}
                  />
                </div>
                {!isAdmin ? (
                  <div className="md:col-span-2">
                    <Label>Assigned Class</Label>
                    <Select
                      value={classKey}
                      onValueChange={(value) => {
                        setClassKey(value);
                        const [course, semester, section, subject, department] = value.split("|");
                        setFormData((prev) => ({
                          ...prev,
                          course_name: course,
                          year: parseInt(semester),
                          section,
                          subject,
                          department,
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {assignedClasses.map((cls) => {
                          const key = `${cls.course}|${cls.semester}|${cls.section}|${cls.subject}|${cls.department ?? ""}`;
                          return (
                            <SelectItem key={key} value={key}>
                              {cls.course} • Sem {cls.semester} • {cls.section} • {cls.subject}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <>
                    <div>
                      <Label>Course</Label>
                      <Input
                        value={formData.course_name}
                        onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
                        placeholder="e.g., BCA"
                        required
                      />
                    </div>
                    <div>
                      <Label>Semester</Label>
                      <Input
                        type="number"
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                        min="1"
                        max="8"
                        required
                      />
                    </div>
                    <div>
                      <Label>Section</Label>
                      <Input
                        value={formData.section}
                        onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                        placeholder="Section"
                      />
                    </div>
                  </>
                )}
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label>File</Label>
                <Input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                  required
                />
              </div>
              <Button type="submit" disabled={uploading}>
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? "Uploading..." : "Upload Material"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="modern-card">
          <CardHeader>
            <CardTitle>Uploaded Materials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {materials.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No materials uploaded yet</p>
              ) : (
                materials.map((material) => (
                  <div key={material.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border rounded-xl bg-card/50 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium truncate">{material.title}</p>
                          <Badge variant="secondary" className="text-xs">
                            {material.file_type?.toUpperCase() || 'FILE'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {material.subject} • {material.course_name} Year {material.year}
                          {material.section && ` (${material.section})`}
                        </p>
                        {material.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{material.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <PDFPreview url={material.file_url} title={material.title} />
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleDelete(material.id, material.file_url, material.file_path)}
                        className="gap-1"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Delete</span>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </FacultyLayout>
  );
}
