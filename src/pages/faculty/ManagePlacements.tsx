import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import FacultyLayout from "@/components/FacultyLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Briefcase, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { useFacultyRole } from "@/hooks/useFacultyRole";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Placement {
  id: string;
  title: string;
  company_name: string;
  description: string | null;
  link: string | null;
  date: string | null;
  status: string;
  created_at: string;
}

export default function ManagePlacements() {
  const { isAdmin, hasRole } = useFacultyRole();
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    company_name: "",
    description: "",
    link: "",
    date: "",
  });

  const isPlacementCoordinator = hasRole('placement_coordinator');
  const canManage = isAdmin || isPlacementCoordinator;

  useEffect(() => {
    loadPlacements();
    if (canManage) {
      loadApplications();
    }
  }, [canManage]);

  const loadPlacements = async () => {
    const { data } = await supabase
      .from("placements")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (data) setPlacements(data);
  };

  const loadApplications = async () => {
    const { data } = await supabase
      .from("placement_applications")
      .select(`
        *,
        profiles:enrollment_number (name, course_name, year, section)
      `)
      .order("applied_at", { ascending: false });
    
    if (data) setApplications(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canManage) {
      toast.error("You don't have permission to post placements");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from("placements").insert({
        ...formData,
        status: "active",
        created_by: user?.id,
      });

      if (error) throw error;

      toast.success("Placement drive posted successfully");
      setFormData({
        title: "",
        company_name: "",
        description: "",
        link: "",
        date: "",
      });
      loadPlacements();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await supabase.from("placements").delete().eq("id", id);
      toast.success("Placement deleted");
      loadPlacements();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleStatusToggle = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "closed" : "active";
    try {
      await supabase.from("placements").update({ status: newStatus }).eq("id", id);
      toast.success(`Placement ${newStatus === "active" ? "activated" : "closed"}`);
      loadPlacements();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (!canManage) {
    return (
      <FacultyLayout>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">You don't have permission to manage placements</p>
          </CardContent>
        </Card>
      </FacultyLayout>
    );
  }

  return (
    <FacultyLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Manage Placements</h1>
          <p className="text-muted-foreground">Post and manage placement drives for students</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Post New Placement Drive</CardTitle>
            <CardDescription>Share job opportunities with students</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Job Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Company Name</Label>
                  <Input
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Application Link</Label>
                  <Input
                    type="url"
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Drive Date</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              </div>
              <Button type="submit">
                <Briefcase className="h-4 w-4 mr-2" />
                Post Placement Drive
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Placements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {placements.map((placement) => (
                <div key={placement.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{placement.title}</h3>
                      <p className="text-sm text-primary">{placement.company_name}</p>
                      <p className="text-sm text-muted-foreground mt-1">{placement.description}</p>
                      {placement.date && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Drive Date: {new Date(placement.date).toLocaleDateString()}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Status: <span className={placement.status === "active" ? "text-green-500" : "text-red-500"}>
                          {placement.status}
                        </span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusToggle(placement.id, placement.status)}
                      >
                        {placement.status === "active" ? "Close" : "Activate"}
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(placement.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Student Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Enrollment</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Applied Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>{app.profiles?.name}</TableCell>
                    <TableCell>{app.enrollment_number}</TableCell>
                    <TableCell>
                      {app.profiles?.course_name} Year {app.profiles?.year} ({app.profiles?.section})
                    </TableCell>
                    <TableCell>{new Date(app.applied_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </FacultyLayout>
  );
}
