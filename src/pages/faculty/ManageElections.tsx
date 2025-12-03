import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import FacultyLayout from "@/components/FacultyLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Vote, Plus, Users, AlertCircle, Trash2, Edit2, Upload, X, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useFacultyRole } from "@/hooks/useFacultyRole";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ManageElections() {
  const { isAdmin, isModerator, loading: roleLoading } = useFacultyRole();
  const [loading, setLoading] = useState(false);
  const [elections, setElections] = useState<any[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<any>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handlePhotoUpload = async (candidateId: string, file: File) => {
    try {
      setUploadingPhoto(candidateId);
      
      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${candidateId}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('candidate-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('candidate-photos')
        .getPublicUrl(fileName);

      // Update candidate with photo URL
      const { error: updateError } = await supabase
        .from('candidates')
        .update({ photo_url: publicUrl })
        .eq('id', candidateId);

      if (updateError) throw updateError;

      toast.success("Photo uploaded successfully!");
      await loadElections();
    } catch (error: any) {
      toast.error("Failed to upload photo: " + error.message);
    } finally {
      setUploadingPhoto(null);
    }
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
      setLoading(false);
      return;
    }
    
    toast.success("Candidate added successfully!");
    e.currentTarget.reset();
    await loadElections();
    setLoading(false);
  };

  const handleUpdateCandidate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const { error } = await supabase
      .from("candidates")
      .update({
        name: formData.get("name") as string,
        enrollment_number: formData.get("enrollment_number") as string,
        student_id: formData.get("student_id") as string,
        position: formData.get("position") as any,
        course_name: formData.get("course_name") as string,
        year: parseInt(formData.get("year") as string),
        section: formData.get("section") as string,
        manifesto: formData.get("manifesto") as string || null,
      })
      .eq("id", editingCandidate.id);

    if (error) {
      toast.error("Failed to update candidate");
    } else {
      toast.success("Candidate updated successfully!");
      setEditingCandidate(null);
      await loadElections();
    }

    setLoading(false);
  };

  const handleDeleteCandidate = async (candidateId: string, photoUrl: string | null) => {
    if (!confirm("Are you sure you want to delete this candidate?")) return;

    try {
      // Delete photo if exists
      if (photoUrl) {
        const fileName = photoUrl.split('/').pop();
        if (fileName) {
          await supabase.storage.from('candidate-photos').remove([fileName]);
        }
      }

      // Delete candidate
      const { error } = await supabase
        .from("candidates")
        .delete()
        .eq("id", candidateId);

      if (error) throw error;

      toast.success("Candidate deleted successfully!");
      await loadElections();
    } catch (error: any) {
      toast.error("Failed to delete candidate: " + error.message);
    }
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
    setLoading(false);
  };

  const handlePublishResults = async (electionId: string) => {
    setLoading(true);
    const { error } = await supabase
      .from("elections")
      .update({ result_published: true })
      .eq("id", electionId);

    if (error) {
      toast.error("Failed to publish results");
    } else {
      toast.success("Results published successfully!");
      await loadElections();
    }
    setLoading(false);
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
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">Manage Elections</h1>
            <p className="text-sm md:text-base text-muted-foreground">Create and manage student elections</p>
          </div>
          <Button onClick={() => setShowCreateForm(!showCreateForm)} className="w-full sm:w-auto" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Create Election
          </Button>
        </div>

        {showCreateForm && (
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-lg md:text-xl">Create New Election</CardTitle>
              <CardDescription className="text-sm">Set up a new student election</CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0">
              <form onSubmit={handleCreateElection} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm">Election Title</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="e.g., Student Council Elections 2024"
                    required
                    className="text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Election description..."
                    rows={3}
                    className="text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date" className="text-sm">Start Date</Label>
                    <Input
                      id="start_date"
                      name="start_date"
                      type="datetime-local"
                      required
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date" className="text-sm">End Date</Label>
                    <Input
                      id="end_date"
                      name="end_date"
                      type="datetime-local"
                      required
                      className="text-sm"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button type="submit" disabled={loading} className="text-sm">
                    {loading ? "Creating..." : "Create Election"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)} className="text-sm">
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
              <CardHeader className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                      <Vote className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
                      <span className="truncate">{election.title}</span>
                    </CardTitle>
                    <CardDescription className="mt-1 md:mt-2 text-sm">{election.description}</CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={election.status === "active" ? "default" : "secondary"} className="text-xs">
                      {election.status}
                    </Badge>
                    {election.status === "active" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleEndElection(election.id)}
                        className="text-xs h-7"
                      >
                        End
                      </Button>
                    )}
                    {election.status === "completed" && !election.result_published && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handlePublishResults(election.id)}
                        disabled={loading}
                        className="text-xs h-7"
                      >
                        <Trophy className="h-3 w-3 mr-1" />
                        Publish
                      </Button>
                    )}
                    {election.result_published && (
                      <Badge variant="outline" className="text-primary text-xs">
                        <Trophy className="h-3 w-3 mr-1" />
                        Published
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-4 md:p-6 pt-0">
                <div className="text-xs md:text-sm text-muted-foreground">
                  Candidates: {election.candidates?.length || 0}
                </div>

                {election.status === "active" && (
                  <form onSubmit={(e) => handleAddCandidate(election.id, e)} className="border-t pt-4">
                    <h3 className="font-medium mb-4 flex items-center gap-2 text-sm md:text-base">
                      <Users className="h-4 w-4" />
                      Add Candidate
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                      <div className="space-y-1">
                        <Label htmlFor={`name-${election.id}`} className="text-xs md:text-sm">Name</Label>
                        <Input id={`name-${election.id}`} name="name" placeholder="Candidate Name" required className="text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`enrollment-${election.id}`} className="text-xs md:text-sm">Enrollment Number</Label>
                        <Input id={`enrollment-${election.id}`} name="enrollment_number" placeholder="Enrollment Number" required className="text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`student-id-${election.id}`} className="text-xs md:text-sm">Student ID</Label>
                        <Input id={`student-id-${election.id}`} name="student_id" placeholder="Student ID" required className="text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`position-${election.id}`} className="text-xs md:text-sm">Position</Label>
                        <select 
                          id={`position-${election.id}`}
                          name="position" 
                          className="flex h-9 md:h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
                          required
                        >
                          <option value="">Select Position</option>
                          <option value="president">President</option>
                          <option value="vice_president">Vice President</option>
                          <option value="secretary">Secretary</option>
                          <option value="class_representative">Class Representative</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`course-${election.id}`}>Course</Label>
                        <Input id={`course-${election.id}`} name="course_name" placeholder="e.g., BCA, MCA" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`year-${election.id}`}>Year</Label>
                        <Input id={`year-${election.id}`} name="year" type="number" min="1" max="4" placeholder="Year" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`section-${election.id}`}>Section</Label>
                        <Input id={`section-${election.id}`} name="section" placeholder="Section" required />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor={`manifesto-${election.id}`}>Manifesto (Optional)</Label>
                        <Textarea id={`manifesto-${election.id}`} name="manifesto" placeholder="Candidate's manifesto and goals..." rows={3} />
                      </div>
                    </div>
                    <Button type="submit" disabled={loading} className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      {loading ? "Adding..." : "Add Candidate"}
                    </Button>
                  </form>
                )}

                {election.candidates && election.candidates.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-4 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Candidates ({election.candidates.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {election.candidates.map((candidate: any) => (
                        <Card key={candidate.id} className="bg-muted/50 relative">
                          <CardHeader>
                            {candidate.photo_url ? (
                              <div className="flex gap-3">
                                <img 
                                  src={candidate.photo_url} 
                                  alt={candidate.name}
                                  className="w-16 h-16 rounded-full object-cover"
                                />
                                <div className="flex-1">
                                  <CardTitle className="text-base">{candidate.name}</CardTitle>
                                  <CardDescription>
                                    <Badge variant="outline" className="mt-1">{candidate.position}</Badge>
                                  </CardDescription>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <CardTitle className="text-base">{candidate.name}</CardTitle>
                                <CardDescription>
                                  <Badge variant="outline" className="mt-1">{candidate.position}</Badge>
                                </CardDescription>
                              </div>
                            )}
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <p className="text-xs text-muted-foreground">
                              {candidate.course_name} • Year {candidate.year} • Section {candidate.section}
                            </p>
                            <p className="text-xs">Enrollment: {candidate.enrollment_number}</p>
                            {candidate.manifesto && (
                              <p className="text-sm mt-2 pt-2 border-t line-clamp-3">{candidate.manifesto}</p>
                            )}
                            <p className="text-xs text-muted-foreground">Votes: {candidate.vote_count || 0}</p>
                            
                            {election.status === "active" && (
                              <div className="flex gap-2 pt-2 border-t">
                                <input
                                  type="file"
                                  ref={fileInputRef}
                                  className="hidden"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handlePhotoUpload(candidate.id, file);
                                  }}
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() => fileInputRef.current?.click()}
                                  disabled={uploadingPhoto === candidate.id}
                                >
                                  <Upload className="h-3 w-3 mr-1" />
                                  {uploadingPhoto === candidate.id ? "Uploading..." : "Photo"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingCandidate(candidate)}
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteCandidate(candidate.id, candidate.photo_url)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
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

        {/* Edit Candidate Dialog */}
        <Dialog open={!!editingCandidate} onOpenChange={(open) => !open && setEditingCandidate(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Candidate</DialogTitle>
              <DialogDescription>Update candidate information</DialogDescription>
            </DialogHeader>
            {editingCandidate && (
              <form onSubmit={handleUpdateCandidate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Name</Label>
                    <Input id="edit-name" name="name" defaultValue={editingCandidate.name} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-enrollment">Enrollment Number</Label>
                    <Input id="edit-enrollment" name="enrollment_number" defaultValue={editingCandidate.enrollment_number} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-student-id">Student ID</Label>
                    <Input id="edit-student-id" name="student_id" defaultValue={editingCandidate.student_id} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-position">Position</Label>
                    <select 
                      id="edit-position"
                      name="position" 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
                      defaultValue={editingCandidate.position}
                      required
                    >
                      <option value="President">President</option>
                      <option value="Vice President">Vice President</option>
                      <option value="Secretary">Secretary</option>
                      <option value="Treasurer">Treasurer</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-course">Course</Label>
                    <Input id="edit-course" name="course_name" defaultValue={editingCandidate.course_name} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-year">Year</Label>
                    <Input id="edit-year" name="year" type="number" min="1" max="4" defaultValue={editingCandidate.year} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-section">Section</Label>
                    <Input id="edit-section" name="section" defaultValue={editingCandidate.section} required />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="edit-manifesto">Manifesto</Label>
                    <Textarea id="edit-manifesto" name="manifesto" defaultValue={editingCandidate.manifesto || ""} rows={3} />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setEditingCandidate(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Updating..." : "Update Candidate"}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </FacultyLayout>
  );
}
