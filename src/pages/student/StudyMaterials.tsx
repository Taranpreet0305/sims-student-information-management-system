import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import StudentLayout from "@/components/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Download, Search, Eye, ExternalLink } from "lucide-react";
import { PDFPreview } from "@/components/PDFPreview";
import { Badge } from "@/components/ui/badge";

interface StudyMaterial {
  id: string;
  title: string;
  subject: string;
  description: string | null;
  file_url: string;
  file_type: string | null;
  created_at: string;
}

export default function StudyMaterials() {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (profile) {
      loadMaterials();
    }
  }, [profile]);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(data);
    }
  };

  const loadMaterials = async () => {
    if (!profile) return;

    const { data } = await supabase
      .from("study_materials")
      .select("*")
      .eq("course_name", profile.course_name)
      .eq("year", profile.year)
      .or(`section.is.null,section.eq.${profile.section}`)
      .order("created_at", { ascending: false });
    
    if (data) setMaterials(data);
  };

  const filteredMaterials = materials.filter(
    (m) =>
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFileType = (url: string, fileType: string | null): string => {
    if (fileType) return fileType.toUpperCase();
    const ext = url.split('.').pop()?.toLowerCase();
    return ext?.toUpperCase() || 'FILE';
  };

  return (
    <StudentLayout>
      <div className="space-y-4 sm:space-y-6 px-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Study Materials</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Access course materials, notes, and resources</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search materials..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid gap-3 sm:gap-4">
          {filteredMaterials.length === 0 ? (
            <Card className="modern-card">
              <CardContent className="py-8 sm:py-12 text-center">
                <FileText className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm sm:text-base text-muted-foreground">No study materials available yet</p>
              </CardContent>
            </Card>
          ) : (
            filteredMaterials.map((material) => (
              <Card key={material.id} className="modern-card card-hover">
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-base sm:text-lg truncate">{material.title}</CardTitle>
                          <Badge variant="secondary" className="text-xs">
                            {getFileType(material.file_url, material.file_type)}
                          </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-primary font-medium mt-0.5">{material.subject}</p>
                        {material.description && (
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2 line-clamp-2">{material.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(material.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 sm:flex-shrink-0 w-full sm:w-auto">
                      <PDFPreview 
                        url={material.file_url} 
                        title={material.title}
                        className="flex-1 sm:flex-none"
                      />
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
