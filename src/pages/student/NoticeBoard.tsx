import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import StudentLayout from "@/components/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, ExternalLink, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function NoticeBoard() {
  const [placements, setPlacements] = useState<any[]>([]);
  const [appliedPlacements, setAppliedPlacements] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [studentId, setStudentId] = useState<string>("");
  const [enrollment, setEnrollment] = useState<string>("");

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (enrollment) {
      loadPlacements();
      loadApplications();
    }
  }, [enrollment]);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("student_id, enrollment_number")
        .eq("id", user.id)
        .single();
      if (data) {
        setStudentId(data.student_id);
        setEnrollment(data.enrollment_number);
      }
    }
  };

  const loadPlacements = async () => {
    const { data } = await supabase
      .from("placements")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (data) {
      setPlacements(data);
    }
  };

  const loadApplications = async () => {
    const { data } = await supabase
      .from("placement_applications")
      .select("placement_id")
      .eq("enrollment_number", enrollment);

    if (data) {
      setAppliedPlacements(new Set(data.map(a => a.placement_id)));
    }
  };

  const handleApply = async (placementId: string) => {
    if (!studentId || !enrollment) {
      toast.error("Unable to load profile data");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("placement_applications").insert({
      placement_id: placementId,
      student_id: studentId,
      enrollment_number: enrollment,
    });

    if (error) {
      toast.error("Failed to apply");
    } else {
      toast.success("Application submitted successfully!");
      await loadApplications();
    }

    setLoading(false);
  };

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Notice Board & Placements</h1>
          <p className="text-muted-foreground">Explore placement opportunities</p>
        </div>

        {placements.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">No placement drives available</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {placements.map((placement) => {
              const hasApplied = appliedPlacements.has(placement.id);

              return (
                <Card key={placement.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                          <Briefcase className="h-5 w-5 text-accent" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{placement.title}</CardTitle>
                          <CardDescription className="mt-1">{placement.company_name}</CardDescription>
                        </div>
                      </div>
                      {hasApplied && (
                        <CheckCircle className="h-5 w-5 text-accent flex-shrink-0" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col gap-4">
                    {placement.description && (
                      <p className="text-sm text-muted-foreground">{placement.description}</p>
                    )}
                    {placement.date && (
                      <p className="text-sm">
                        <span className="font-medium">Date: </span>
                        {format(new Date(placement.date), "PPP")}
                      </p>
                    )}
                    <div className="mt-auto flex flex-col sm:flex-row gap-2">
                      {placement.link && (
                        <Button variant="outline" asChild className="flex-1">
                          <a href={placement.link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View Details
                          </a>
                        </Button>
                      )}
                      <Button
                        onClick={() => handleApply(placement.id)}
                        disabled={hasApplied || loading}
                        className="flex-1"
                      >
                        {hasApplied ? "Applied" : "Apply Now"}
                      </Button>
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
