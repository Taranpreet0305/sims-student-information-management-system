import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import StudentLayout from "@/components/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Download, Search } from "lucide-react";

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

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Study Materials</h1>
          <p className="text-muted-foreground">Access course materials, notes, and resources</p>
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

        <div className="grid gap-4">
          {filteredMaterials.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No study materials available yet</p>
              </CardContent>
            </Card>
          ) : (
            filteredMaterials.map((material) => (
              <Card key={material.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-primary mt-1" />
                      <div>
                        <CardTitle className="text-lg">{material.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{material.subject}</p>
                        {material.description && (
                          <p className="text-sm text-muted-foreground mt-2">{material.description}</p>
                        )}
                      </div>
                    </div>
                    <Button asChild>
                      <a href={material.file_url} download target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </a>
                    </Button>
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
