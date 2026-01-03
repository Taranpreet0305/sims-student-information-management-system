import { useEffect, useState } from "react";
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

interface StudyMaterial {
  id: string;
  title: string;
  subject: string;
  course_name: string;
  year: number;
  section: string | null;
  description: string | null;
  file_url: string;
  file_type: string | null;
  created_at: string;
}

export default function StudyMaterials() {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    course_name: "BCA",
    year: 1,
    section: "",
    description: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    const { data } = await supabase
      .from("study_materials")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (data) setMaterials(data);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Please select a file");
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

      const { data: { publicUrl } } = supabase.storage
        .from("study-materials")
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from("study_materials")
        .insert({
          ...formData,
          section: formData.section || null,
          file_url: publicUrl,
          file_type: fileExt,
          uploaded_by: (await supabase.auth.getUser()).data.user?.id,
        });

      if (insertError) throw insertError;

      toast.success("Study material uploaded successfully");
      setFormData({
        title: "",
        subject: "",
        course_name: "BCA",
        year: 1,
        section: "",
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

  const handleDelete = async (id: string, fileUrl: string) => {
    try {
      const filePath = fileUrl.split('/study-materials/')[1];
      await supabase.storage.from("study-materials").remove([filePath]);
      await supabase.from("study_materials").delete().eq("id", id);
      toast.success("Material deleted successfully");
      loadMaterials();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <FacultyLayout>
      <div className="space-y-6">
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
                  />
                </div>
                <div>
                  <Label>Course</Label>
                  <Select value={formData.course_name} onValueChange={(v) => setFormData({ ...formData, course_name: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BCA">BCA</SelectItem>
                      <SelectItem value="MCA">MCA</SelectItem>
                      <SelectItem value="BTech">BTech</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Year</Label>
                  <Select value={formData.year.toString()} onValueChange={(v) => setFormData({ ...formData, year: parseInt(v) })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4].map((y) => (
                        <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Section (Optional)</Label>
                  <Input
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    placeholder="Leave empty for all sections"
                  />
                </div>
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
                        onClick={() => handleDelete(material.id, material.file_url)}
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
