import { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { BookOpen, Home, UserCheck, Calendar, Upload, MessageSquare, Bell, Vote, Users, LogOut, TrendingUp, Shield, BarChart3, FileText, Briefcase, User, Clock, Menu } from "lucide-react";
import { toast } from "sonner";
import { NotificationBell } from "@/components/NotificationBell";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MobileNav, facultyNavItems } from "@/components/MobileNav";
import { Footer } from "@/components/Footer";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function FacultyLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<any>(null);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    setProfile(profileData);
    setRoles(rolesData || []);
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

  const isAdmin = roles.some((r: any) => r.role === 'admin');

  const navItems = [
    { path: "/faculty/dashboard", icon: Home, label: "Dashboard" },
    ...(isAdmin 
      ? [{ path: "/faculty/admin-dashboard", icon: Shield, label: "Admin Dashboard" }] 
      : []),
    { path: "/faculty/approve-students", icon: UserCheck, label: "Approve Students" },
    { path: "/faculty/approve-faculty", icon: Users, label: "Approve Faculty" },
    { path: "/faculty/student-performance", icon: TrendingUp, label: "Performance" },
    { path: "/faculty/analytics", icon: BarChart3, label: "Analytics" },
    { path: "/faculty/add-attendance", icon: Calendar, label: "Add Attendance" },
    { path: "/faculty/upload-marks", icon: Upload, label: "Upload Marks" },
    { path: "/faculty/timetable", icon: Clock, label: "Manage Timetable" },
    { path: "/faculty/study-materials", icon: FileText, label: "Study Materials" },
    { path: "/faculty/notices", icon: Bell, label: "Notices" },
    { path: "/faculty/placements", icon: Briefcase, label: "Placements" },
    { path: "/faculty/view-feedbacks", icon: MessageSquare, label: "View Feedbacks" },
    { path: "/faculty/manage-elections", icon: Vote, label: "Manage Elections" },
    { path: "/faculty/election-results", icon: TrendingUp, label: "Election Results" },
    { path: "/faculty/manage-roles", icon: Shield, label: "Manage Roles" },
    { path: "/faculty/edit-profile", icon: User, label: "Edit Profile" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-14 sm:h-16 items-center gap-2 sm:gap-4 px-3 sm:px-4">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/10 to-transparent">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-6 w-6 text-primary" />
                  <span className="font-bold text-lg">Faculty Portal</span>
                </div>
                <ThemeToggle />
              </div>
              <nav className="flex flex-col gap-0.5 p-3 overflow-y-auto max-h-[calc(100vh-80px)]">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}>
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        className={`w-full justify-start h-10 ${isActive ? 'bg-primary/10 text-primary' : ''}`}
                        size="sm"
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        {item.label}
                      </Button>
                    </Link>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
          
          <Link to="/faculty/dashboard" className="flex items-center gap-1.5 sm:gap-2">
            <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
            <span className="font-bold text-base sm:text-lg hidden sm:inline">Faculty Portal</span>
          </Link>
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <div className="hidden lg:block">
              <ThemeToggle />
            </div>
            {profile && <NotificationBell facultyId={profile.id} />}
            <span className="text-xs sm:text-sm text-muted-foreground hidden md:inline truncate max-w-[120px] lg:max-w-none">
              {profile?.name}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10" onClick={handleLogout}>
              <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
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

        <main className="flex-1 p-3 sm:p-4 md:p-6 pb-20 lg:pb-6">
          {children}
        </main>
      </div>
      
      <Footer />
    </div>
  );
}
