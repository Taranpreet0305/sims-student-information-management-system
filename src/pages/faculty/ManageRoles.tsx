import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import FacultyLayout from "@/components/FacultyLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Shield, UserCog, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useFacultyRole } from "@/hooks/useFacultyRole";

export default function ManageRoles() {
  const { profile, hasRole } = useFacultyRole();
  const [faculty, setFaculty] = useState<any[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState<any>(null);
  const [newRole, setNewRole] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const hasElevatedRole = hasRole("admin") || hasRole("hod") || hasRole("vice_principal") || hasRole("director") || hasRole("chairman");

  useEffect(() => {
    if (hasElevatedRole) {
      loadFaculty();
    }
  }, [hasElevatedRole]);

  const loadFaculty = async () => {
    const { data } = await supabase
      .from("faculty_profiles")
      .select(`
        *,
        user_roles (role)
      `)
      .order("name");

    if (data) {
      setFaculty(data);
    }
  };

  const assignRole = async () => {
    if (!selectedFaculty || !newRole) {
      toast.error("Please select both faculty and role");
      return;
    }

    setLoading(true);
    try {
      // Check if role already exists
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", selectedFaculty.id)
        .eq("role", newRole as any)
        .maybeSingle();

      if (existingRole) {
        toast.error("Faculty already has this role");
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: selectedFaculty.id, role: newRole as any });

      if (error) {
        toast.error("Failed to assign role");
      } else {
        toast.success("Role assigned successfully");
        await loadFaculty();
        setSelectedFaculty(null);
        setNewRole("");
      }
    } catch (error) {
      console.error("Error assigning role:", error);
      toast.error("Failed to assign role");
    } finally {
      setLoading(false);
    }
  };

  const removeRole = async (facultyId: string, role: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", facultyId)
        .eq("role", role as any);

      if (error) {
        toast.error("Failed to remove role");
      } else {
        toast.success("Role removed successfully");
        await loadFaculty();
      }
    } catch (error) {
      console.error("Error removing role:", error);
      toast.error("Failed to remove role");
    } finally {
      setLoading(false);
    }
  };

  if (!hasElevatedRole) {
    return (
      <FacultyLayout>
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-4">
              <AlertCircle className="h-12 w-12 text-muted-foreground" />
              <p className="text-center text-muted-foreground">
                Access Denied: Only administrators and elevated roles can manage user roles
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
            <h1 className="text-3xl font-bold mb-2">Role Management</h1>
            <p className="text-muted-foreground">Assign and manage faculty roles and permissions</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Shield className="h-4 w-4 mr-2" />
                Assign Role
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Faculty Role</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Select Faculty</Label>
                  <Select
                    value={selectedFaculty?.id || ""}
                    onValueChange={(value) => {
                      const f = faculty.find(f => f.id === value);
                      setSelectedFaculty(f);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose faculty member" />
                    </SelectTrigger>
                    <SelectContent>
                      {faculty.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.name} ({f.faculty_id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Select Role</Label>
                  <Select value={newRole} onValueChange={setNewRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="hod">Head of Department</SelectItem>
                      <SelectItem value="vice_principal">Vice Principal</SelectItem>
                      <SelectItem value="director">Director</SelectItem>
                      <SelectItem value="chairman">Chairman</SelectItem>
                      <SelectItem value="placement_coordinator">Placement Coordinator</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={assignRole} disabled={loading} className="w-full">
                  Assign Role
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Faculty Members & Roles</CardTitle>
            <CardDescription>Manage roles and permissions for all faculty members</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Faculty ID</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {faculty.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">{f.name}</TableCell>
                      <TableCell>{f.faculty_id}</TableCell>
                      <TableCell>{f.email}</TableCell>
                      <TableCell>{f.department || "N/A"}</TableCell>
                      <TableCell>
                        <div className="flex gap-2 flex-wrap">
                          {f.user_roles && f.user_roles.length > 0 ? (
                            f.user_roles.map((ur: any, idx: number) => (
                              <Badge key={idx} variant="secondary">
                                {ur.role}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="outline">No roles</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {f.user_roles && f.user_roles.length > 0 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeRole(f.id, f.user_roles[0].role)}
                            disabled={loading}
                          >
                            Remove Role
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </FacultyLayout>
  );
}
