import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import FacultyLayout from "@/components/FacultyLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Trash2, FileText, Upload, Download, Sparkles, Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";

interface Notice {
  id: string;
  title: string;
  message: string;
  target_course: string | null;
  target_year: number | null;
  target_section: string | null;
  type: string;
  created_at: string;
  attachment_url: string | null;
}

export default function ManageNotices() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    target_course: "",
    target_year: "",
    target_section: "",
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [generatingAI, setGeneratingAI] = useState(false);

  useEffect(() => {
    loadNotices();
  }, []);

  const loadNotices = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("type", "notice")
      .order("created_at", { ascending: false });
    
    if (data) setNotices(data);
  };

  const generateNotice = async () => {
    if (!aiTopic.trim()) {
      toast.error("Please enter a topic for the notice");
      return;
    }

    setGeneratingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: {
          action: "generate_notice",
          data: { topic: aiTopic }
        }
      });

      if (error) throw error;

      const content = data.response || "";
      const lines = content.split("\n").filter((l: string) => l.trim());
      const title = lines[0]?.replace(/^(Subject:|Title:|Notice:)/i, "").trim() || aiTopic;
      const message = lines.slice(1).join("\n").trim() || content;

      setFormData(prev => ({
        ...prev,
        title: title.substring(0, 100),
        message: message
      }));
      setAiTopic("");
      toast.success("Notice generated! Review and edit before posting.");
    } catch (error) {
      console.error("AI generation error:", error);
      toast.error("Failed to generate notice");
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let attachmentUrl = null;

      if (pdfFile) {
        const fileExt = pdfFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('notice-pdfs')
          .upload(filePath, pdfFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('notice-pdfs')
          .getPublicUrl(filePath);

        attachmentUrl = publicUrl;
      }
      
      const { error } = await supabase.from("notifications").insert({
        title: formData.title,
        message: formData.message,
        target_course: formData.target_course || null,
        target_year: formData.target_year ? parseInt(formData.target_year) : null,
        target_section: formData.target_section || null,
        type: "notice",
        created_by: user?.id,
        attachment_url: attachmentUrl,
      });

      if (error) throw error;

      toast.success("Notice posted successfully");
      setFormData({
        title: "",
        message: "",
        target_course: "",
        target_year: "",
        target_section: "",
      });
      setPdfFile(null);
      loadNotices();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await supabase.from("notifications").delete().eq("id", id);
      toast.success("Notice deleted");
      loadNotices();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <FacultyLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Notice Board</h1>
          <p className="text-sm md:text-base text-muted-foreground">Post important notices and announcements for students</p>
        </div>

        {/* AI Notice Generator */}
        <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">AI Notice Generator</CardTitle>
            </div>
            <CardDescription>Let AI help you draft professional notices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="e.g., Holiday announcement for Diwali, Exam schedule for semester 3..."
                className="flex-1"
              />
              <Button 
                onClick={generateNotice} 
                disabled={generatingAI || !aiTopic.trim()}
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                {generatingAI ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Post New Notice</CardTitle>
            <CardDescription>Create announcements for specific courses or all students</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Message</Label>
                <Textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                  required
                />
              </div>
              <div>
                <Label>Attach PDF (Optional)</Label>
                <div className="flex items-center gap-2 flex-wrap">
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                    className="flex-1 min-w-0"
                  />
                  {pdfFile && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span className="truncate max-w-[150px]">{pdfFile.name}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Target Course (Optional)</Label>
                  <Select value={formData.target_course || undefined} onValueChange={(v) => setFormData({ ...formData, target_course: v === "all" ? "" : v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="All courses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Courses</SelectItem>
                      <SelectItem value="BCA">BCA</SelectItem>
                      <SelectItem value="MCA">MCA</SelectItem>
                      <SelectItem value="BTech">BTech</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Target Year (Optional)</Label>
                  <Select value={formData.target_year || undefined} onValueChange={(v) => setFormData({ ...formData, target_year: v === "all" ? "" : v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="All years" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      {[1, 2, 3, 4].map((y) => (
                        <SelectItem key={y} value={y.toString()}>Year {y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Target Section (Optional)</Label>
                  <Input
                    value={formData.target_section}
                    onChange={(e) => setFormData({ ...formData, target_section: e.target.value })}
                    placeholder="All sections"
                  />
                </div>
              </div>
              <Button type="submit" disabled={uploading} className="w-full sm:w-auto">
                {uploading ? (
                  <>
                    <Upload className="h-4 w-4 mr-2 animate-pulse" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Bell className="h-4 w-4 mr-2" />
                    Post Notice
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Recent Notices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notices.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No notices posted yet</p>
              ) : (
                notices.map((notice) => (
                  <div key={notice.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base md:text-lg">{notice.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap line-clamp-3">{notice.message}</p>
                        {notice.attachment_url && (
                          <a
                            href={notice.attachment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 mt-2 text-sm text-primary hover:underline"
                          >
                            <Download className="h-4 w-4" />
                            Download PDF
                          </a>
                        )}
                        <div className="flex items-center gap-4 mt-3 flex-wrap">
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium">Target:</span> {notice.target_course || "All Courses"} 
                            {notice.target_year && ` • Year ${notice.target_year}`}
                            {notice.target_section && ` • Section ${notice.target_section}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(notice.created_at).toLocaleDateString()} at {new Date(notice.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(notice.id)}>
                        <Trash2 className="h-4 w-4" />
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