import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import FacultyLayout from "@/components/FacultyLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Vote, Plus, Users, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useFacultyRole } from "@/hooks/useFacultyRole";

export default function ManageElections() {
  const { isAdmin, isModerator, loading: roleLoading } = useFacultyRole();
  const [loading, setLoading] = useState(false);
  const [elections, setElections] = useState<any[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    loadElections();
  }, []);

  const loadElections = async () => {
    const { data } = await supabase
      .from("elections")
      .select("*, candidates(*)")
      .order("created_at", { ascending: false });

    if (data) {
      setElections(data);
    }
  };

  const handleCreateElection = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from("elections").insert({
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      start_date: formData.get("start_date") as string,
      end_date: formData.get("end_date") as string,
      status: "active",
      created_by: user?.id,
    });

    if (error) {
      toast.error("Failed to create election");
    } else {
      toast.success("Election created successfully!");
      e.currentTarget.reset();
      setShowCreateForm(false);
      await loadElections();
    }

    setLoading(false);
  };

  const handleAddCandidate = async (electionId: string, e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const { error } = await supabase.from("candidates").insert({
      election_id: electionId,
      name: formData.get("name") as string,
      enrollment_number: formData.get("enrollment_number") as string,
      student_id: formData.get("student_id") as string,
      position: formData.get("position") as any,
      course_name: formData.get("course_name") as string,
      year: parseInt(formData.get("year") as string),
      section: formData.get("section") as string,
      manifesto: formData.get("manifesto") as string || null,
    } as any);

    if (error) {
      console.error("Candidate error:", error);
      toast.error("Failed to add candidate");
    } else {
      toast.success("Candidate added successfully!");
      e.currentTarget.reset();
      await loadElections();
    }

    setLoading(false);
  };

  const handleEndElection = async (electionId: string) => {
    const { error } = await supabase
      .from("elections")
      .update({ status: "completed" as any })
      .eq("id", electionId);

    if (error) {
      toast.error("Failed to end election");
    } else {
      toast.success("Election ended successfully!");
      await loadElections();
    }
  };

  if (roleLoading) {
    return (
      <FacultyLayout>
        <div className="flex items-center justify-center h-96">Loading...</div>
      </FacultyLayout>
    );
  }

  if (!isAdmin && !isModerator) {
    return (
      <FacultyLayout>
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-4">
              <AlertCircle className="h-12 w-12 text-muted-foreground" />
              <p className="text-center text-muted-foreground">
                Access Denied: Only Administrators and Moderators can manage elections
              </p>
            </div>
          </CardContent>
        </Card>
      </FacultyLayout>
    );
  }

  return (
    <FacultyLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Manage Elections</h1>
            <p className="text-muted-foreground">Create and manage student elections</p>
          </div>
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Election
          </Button>
        </div>

        {showCreateForm && (
          <Card>
            <CardHeader>
              <CardTitle>Create New Election</CardTitle>
              <CardDescription>Set up a new student election</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateElection} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Election Title</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="e.g., Student Council Elections 2024"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Election description..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      name="start_date"
                      type="datetime-local"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      id="end_date"
                      name="end_date"
                      type="datetime-local"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={loading}>
                    {loading ? "Creating..." : "Create Election"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {elections.map((election) => (
            <Card key={election.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Vote className="h-5 w-5" />
                      {election.title}
                    </CardTitle>
                    <CardDescription className="mt-2">{election.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={election.status === "active" ? "default" : "secondary"}>
                      {election.status}
                    </Badge>
                    {election.status === "active" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleEndElection(election.id)}
                      >
                        End Election
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Candidates: {election.candidates?.length || 0}
                </div>

                {election.status === "active" && (
                  <form onSubmit={(e) => handleAddCandidate(election.id, e)} className="border-t pt-4">
                    <h3 className="font-medium mb-4">Add Candidate</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input name="name" placeholder="Candidate Name" required />
                      <Input name="enrollment_number" placeholder="Enrollment Number" required />
                      <Input name="student_id" placeholder="Student ID" required />
                      <div className="space-y-2">
                        <select name="position" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" required>
                          <option value="">Select Position</option>
                          <option value="President">President</option>
                          <option value="Vice President">Vice President</option>
                          <option value="Secretary">Secretary</option>
                        </select>
                      </div>
                      <Input name="course_name" placeholder="Course" required />
                      <Input name="year" type="number" placeholder="Year" required />
                      <Input name="section" placeholder="Section" required />
                      <Textarea name="manifesto" placeholder="Manifesto (optional)" className="md:col-span-2" />
                    </div>
                    <Button type="submit" disabled={loading} className="mt-4">
                      Add Candidate
                    </Button>
                  </form>
                )}

                {election.candidates && election.candidates.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-4">Candidates List</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {election.candidates.map((candidate: any) => (
                        <Card key={candidate.id}>
                          <CardHeader>
                            <CardTitle className="text-base">{candidate.name}</CardTitle>
                            <CardDescription>
                              {candidate.position} • {candidate.course_name} Year {candidate.year}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="text-sm text-muted-foreground">
                            {candidate.manifesto}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {elections.length === 0 && (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">
                  No elections created yet. Click "Create Election" to get started.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </FacultyLayout>
  );
}
