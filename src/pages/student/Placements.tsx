import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import StudentLayout from "@/components/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Briefcase, Calendar, Building2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function Placements() {
  const [placements, setPlacements] = useState<any[]>([]);
  const [applications, setApplications] = useState<string[]>([]);
  const [enrollmentNumber, setEnrollmentNumber] = useState("");
  const [studentId, setStudentId] = useState("");

  useEffect(() => {
    loadUserData();
    loadPlacements();
  }, []);

  const loadUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("enrollment_number, student_id")
        .eq("id", user.id)
        .single();

      if (profile) {
        setEnrollmentNumber(profile.enrollment_number);
        setStudentId(profile.student_id);
        loadApplications(profile.enrollment_number);
      }
    }
  };

  const loadPlacements = async () => {
    const { data } = await supabase
      .from("placements")
      .select("*")
      .eq("status", "active")
      .order("date", { ascending: true });

    if (data) {
      setPlacements(data);
    }
  };

  const loadApplications = async (enrollment: string) => {
    const { data } = await supabase
      .from("placement_applications")
      .select("placement_id")
      .eq("enrollment_number", enrollment);

    if (data) {
      setApplications(data.map((a) => a.placement_id));
    }
  };

  const handleApply = async (placementId: string) => {
    if (!enrollmentNumber || !studentId) {
      toast.error("Please complete your profile first");
      return;
    }

    const { error } = await supabase.from("placement_applications").insert({
      placement_id: placementId,
      enrollment_number: enrollmentNumber,
      student_id: studentId,
    });

    if (error) {
      toast.error("Failed to apply for placement");
    } else {
      toast.success("Successfully applied for placement!");
      loadApplications(enrollmentNumber);
    }
  };

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Placement Opportunities</h1>
          <p className="text-muted-foreground">
            Browse and apply for placement drives and job opportunities
          </p>
        </div>

        {placements.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No active placement opportunities at the moment</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {placements.map((placement) => {
              const hasApplied = applications.includes(placement.id);
              return (
                <Card key={placement.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle>{placement.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {placement.company_name}
                        </CardDescription>
                      </div>
                      <Badge variant={hasApplied ? "secondary" : "default"}>
                        {hasApplied ? "Applied" : "Open"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {placement.description && (
                      <p className="text-sm text-muted-foreground">{placement.description}</p>
                    )}
                    
                    {placement.date && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Drive Date: {format(new Date(placement.date), "PPP")}</span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApply(placement.id)}
                        disabled={hasApplied}
                        className="flex-1"
                      >
                        {hasApplied ? "Already Applied" : "Apply Now"}
                      </Button>
                      
                      {placement.link && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => window.open(placement.link, "_blank")}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
