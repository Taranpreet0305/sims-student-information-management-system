import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import FacultyLayout from "@/components/FacultyLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Phone, Building, BookOpen, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useFacultyRole } from "@/hooks/useFacultyRole";

export default function FacultyDashboard() {
  const { profile, isAdmin, isModerator, isClassCoordinator, loading } = useFacultyRole();

  if (loading || !profile) {
    return (
      <FacultyLayout>
        <div className="flex items-center justify-center h-96">Loading...</div>
      </FacultyLayout>
    );
  }

  return (
    <FacultyLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Welcome, {profile.name}!</h1>
          <p className="text-muted-foreground">View your faculty profile and responsibilities</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {isAdmin && <Badge variant="default">Administrator</Badge>}
          {isModerator && <Badge variant="secondary">Moderator</Badge>}
          {isClassCoordinator && <Badge variant="outline">Class Coordinator</Badge>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faculty ID</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile.faculty_id}</div>
            </CardContent>
          </Card>

          {profile.department && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Department</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{profile.department}</div>
              </CardContent>
            </Card>
          )}

          {isClassCoordinator && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assigned Class</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {profile.assigned_course} - Year {profile.assigned_year} ({profile.assigned_section})
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Full Name</p>
                <p className="text-sm text-muted-foreground">{profile.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
              </div>
            </div>
            {profile.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">{profile.phone}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </FacultyLayout>
  );
}
