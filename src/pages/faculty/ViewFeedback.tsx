import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import FacultyLayout from "@/components/FacultyLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MessageSquare, Sparkles, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useFacultyRole } from "@/hooks/useFacultyRole";
import { toast } from "sonner";

export default function ViewFeedback() {
  const { profile, isAdmin } = useFacultyRole();
  const [feedback, setFeedback] = useState<any[]>([]);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

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

    if (!isAdmin) {
      query = query.or(`faculty_id.eq.${profile.faculty_id},faculty_id.is.null`);
    }

    const { data } = await query;

    if (data) {
      setFeedback(data);
    }
  };

  const generateAISummary = async () => {
    if (feedback.length === 0) {
      toast.error("No feedback to analyze");
      return;
    }
    
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          action: 'generate_feedback_summary',
          data: {
            feedback: feedback.map(f => ({
              category: f.category,
              rating: f.rating,
              comment: f.comment,
            }))
          }
        }
      });

      if (error) throw error;
      setAiSummary(data.response);
    } catch (error) {
      console.error("AI summary error:", error);
      toast.error("Failed to generate AI summary");
    } finally {
      setAiLoading(false);
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
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1">Student Feedback</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              View feedback {!isAdmin && "related to you"}
            </p>
          </div>
          {feedback.length > 0 && (
            <Button onClick={generateAISummary} disabled={aiLoading} className="w-full sm:w-auto">
              {aiLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              AI Summary
            </Button>
          )}
        </div>

        {aiSummary && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                AI Feedback Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <p className="text-xs sm:text-sm whitespace-pre-wrap">{aiSummary}</p>
            </CardContent>
          </Card>
        )}

        {feedback.length === 0 ? (
          <Card>
            <CardContent className="py-6 sm:py-8">
              <p className="text-center text-sm text-muted-foreground">No feedback available</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            {feedback.map((item) => (
              <Card key={item.id}>
                <CardHeader className="p-3 sm:p-4 lg:p-6">
                  <div className="flex items-start justify-between gap-3 sm:gap-4">
                    <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 flex-wrap">
                          <Badge variant={getCategoryColor(item.category)} className="text-[10px] sm:text-xs">
                            {item.category}
                          </Badge>
                          {item.faculty_id && (
                            <Badge variant="outline" className="text-[10px] sm:text-xs hidden sm:inline-flex">
                              Faculty: {item.faculty_id}
                            </Badge>
                          )}
                          {item.rating && (
                            <div className="flex items-center gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 sm:h-4 sm:w-4 ${
                                    i < item.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        <CardDescription className="text-[10px] sm:text-xs">
                          {format(new Date(item.created_at), "PPp")} • {item.student_enrollment}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
                  <p className="text-xs sm:text-sm whitespace-pre-wrap">{item.comment}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </FacultyLayout>
  );
}
