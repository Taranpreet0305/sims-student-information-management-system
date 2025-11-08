import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import StudentLayout from "@/components/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Star } from "lucide-react";
import { toast } from "sonner";

export default function StudentFeedback() {
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [studentId, setStudentId] = useState<string>("");
  const [enrollment, setEnrollment] = useState<string>("");

  useEffect(() => {
    loadProfile();
  }, []);

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!studentId || !enrollment) {
      toast.error("Unable to load profile data");
      return;
    }

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const comment = (formData.get("comment") as string || "").trim();
    
    if (comment.length > 1000) {
      toast.error("Comment must be less than 1000 characters");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("feedback").insert({
      student_id: studentId,
      student_enrollment: enrollment,
      faculty_id: formData.get("faculty_id") as string || null,
      category: formData.get("category") as string,
      rating: rating,
      comment: comment,
    });

    if (error) {
      toast.error("Failed to submit feedback");
    } else {
      toast.success("Feedback submitted successfully!");
      e.currentTarget.reset();
      setRating(0);
    }

    setLoading(false);
  };

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Feedback</h1>
          <p className="text-muted-foreground">Share your feedback and suggestions</p>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <CardTitle>Submit Feedback</CardTitle>
            </div>
            <CardDescription>
              Help us improve by sharing your thoughts and experiences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select name="category" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Feedback</SelectItem>
                    <SelectItem value="faculty">Faculty Feedback</SelectItem>
                    <SelectItem value="infrastructure">Infrastructure</SelectItem>
                    <SelectItem value="curriculum">Curriculum</SelectItem>
                    <SelectItem value="facilities">Facilities</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="faculty_id">Faculty ID (Optional)</Label>
                <Input
                  id="faculty_id"
                  name="faculty_id"
                  placeholder="Enter faculty ID if feedback is about a specific faculty"
                />
              </div>

              <div className="space-y-2">
                <Label>Rating</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          value <= rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="comment">Comments</Label>
                <Textarea
                  id="comment"
                  name="comment"
                  placeholder="Share your detailed feedback..."
                  rows={5}
                  required
                />
              </div>

              <Button type="submit" disabled={loading || rating === 0} className="w-full">
                {loading ? "Submitting..." : "Submit Feedback"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </StudentLayout>
  );
}
