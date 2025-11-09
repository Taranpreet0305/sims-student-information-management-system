import { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { BookOpen, Home, UserCheck, Calendar, Upload, MessageSquare, Bell, Vote, Users, LogOut, TrendingUp, Shield, BarChart3, FileText, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { NotificationBell } from "@/components/NotificationBell";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function FacultyLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/faculty-auth");
      return;
    }

    const { data: profileData } = await supabase
      .from("faculty_profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (!profileData || !profileData.verify) {
      toast.error("Access denied");
      await supabase.auth.signOut();
      navigate("/faculty-auth");
      return;
    }

    setProfile(profileData);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    toast.success("Logged out successfully");
    navigate("/");
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const navItems = [
    { path: "/faculty/dashboard", icon: Home, label: "Dashboard" },
    { path: "/faculty/approve-students", icon: UserCheck, label: "Approve Students" },
    { path: "/faculty/approve-faculty", icon: Users, label: "Approve Faculty" },
    { path: "/faculty/student-performance", icon: TrendingUp, label: "Performance" },
    { path: "/faculty/analytics", icon: BarChart3, label: "Analytics" },
    { path: "/faculty/add-attendance", icon: Calendar, label: "Add Attendance" },
    { path: "/faculty/upload-marks", icon: Upload, label: "Upload Marks" },
    { path: "/faculty/study-materials", icon: FileText, label: "Study Materials" },
    { path: "/faculty/notices", icon: Bell, label: "Notices" },
    { path: "/faculty/placements", icon: Briefcase, label: "Placements" },
    { path: "/faculty/view-feedbacks", icon: MessageSquare, label: "View Feedbacks" },
    { path: "/faculty/manage-elections", icon: Vote, label: "Manage Elections" },
    { path: "/faculty/manage-roles", icon: Shield, label: "Manage Roles" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-16 items-center gap-4 px-4">
          <Link to="/faculty/dashboard" className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-accent" />
            <span className="font-bold text-lg hidden sm:inline">Faculty Portal</span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            {profile && <NotificationBell facultyId={profile.id} />}
            <span className="text-sm text-muted-foreground hidden md:inline">
              {profile?.name}
            </span>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 border-r bg-card min-h-[calc(100vh-4rem)] hidden lg:block">
          <nav className="flex flex-col gap-1 p-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className="w-full justify-start"
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 border-t bg-card/95 backdrop-blur">
        <div className="grid grid-cols-4 gap-1 p-2">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className="w-full flex flex-col h-auto py-2"
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs mt-1">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
