import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import FacultyLayout from "@/components/FacultyLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { useFacultyRole } from "@/hooks/useFacultyRole";

export default function ViewFeedback() {
  const { profile, isAdmin } = useFacultyRole();
  const [feedback, setFeedback] = useState<any[]>([]);

  useEffect(() => {
    if (profile) {
      loadFeedback();
    }
  }, [profile]);

  const loadFeedback = async () => {
    if (!profile) return;

    let query = supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false });

    // If not admin, only show feedback related to the faculty member or general feedback
    if (!isAdmin) {
      query = query.or(`faculty_id.eq.${profile.faculty_id},faculty_id.is.null`);
    }

    const { data } = await query;

    if (data) {
      setFeedback(data);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "faculty": return "default";
      case "infrastructure": return "secondary";
      case "curriculum": return "outline";
      default: return "outline";
    }
  };

  return (
    <FacultyLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Student Feedback</h1>
          <p className="text-muted-foreground">
            View feedback submitted by students
            {!isAdmin && " related to you or general feedback"}
          </p>
        </div>

        {feedback.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">No feedback available</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {feedback.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge variant={getCategoryColor(item.category)}>
                            {item.category}
                          </Badge>
                          {item.faculty_id && (
                            <Badge variant="outline">Faculty ID: {item.faculty_id}</Badge>
                          )}
                          {item.rating && (
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < item.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        <CardDescription>
                          {format(new Date(item.created_at), "PPp")} • Student: {item.student_enrollment}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{item.comment}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </FacultyLayout>
  );
}
