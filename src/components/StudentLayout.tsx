import { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { GraduationCap, Home, Calendar, FileText, Vote, Bell, Briefcase, MessageSquare, LogOut, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MobileNav, studentNavItems } from "@/components/MobileNav";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
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
      navigate("/student-auth");
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (!profileData || !profileData.verify) {
      toast.error("Access denied");
      await supabase.auth.signOut();
      navigate("/student-auth");
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
    { path: "/student/dashboard", icon: Home, label: "Dashboard" },
    { path: "/student/attendance", icon: Calendar, label: "Attendance" },
    { path: "/student/marks", icon: FileText, label: "Marks" },
    { path: "/student/study-materials", icon: BookOpen, label: "Study Materials" },
    { path: "/student/feedback", icon: MessageSquare, label: "Feedback" },
    { path: "/student/notice-board", icon: Bell, label: "Notices" },
    { path: "/student/placements", icon: Briefcase, label: "Placements" },
    { path: "/student/voting", icon: Vote, label: "Voting" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-16 items-center gap-4 px-4">
          <Link to="/student/dashboard" className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg hidden sm:inline">Student Portal</span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
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

        <main className="flex-1 p-6 pb-20 lg:pb-6">
          {children}
        </main>
      </div>
      
      <MobileNav items={studentNavItems} />
    </div>
  );
}
