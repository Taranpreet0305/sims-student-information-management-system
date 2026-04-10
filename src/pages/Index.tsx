import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, BookOpen, Users, Award, TrendingUp, Calendar, Bell, FileText, ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Footer } from "@/components/Footer";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { getSession } from "@/integrations/firebase/session";

export default function Index() {
  const navigate = useNavigate();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const session = getSession();
      if (session?.user) {
        const userType = localStorage.getItem("user_type");
        if (userType === "student") {
          navigate("/student/dashboard");
          return;
        } else if (userType === "faculty") {
          navigate("/faculty/dashboard");
          return;
        }
      }
      setCheckingSession(false);
    };

    checkSession();
  }, [navigate]);

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedBackground />
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col overflow-hidden">
      <AnimatedBackground />

      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary" />
              </div>
              <span className="text-lg sm:text-xl font-semibold tracking-wide text-foreground">
                SIMS
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/admin-auth")}
                className="text-xs sm:text-sm"
              >
                Admin Login
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-3 sm:px-4 py-6 sm:py-10 md:py-14">
        <div className="text-center mb-10 sm:mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs sm:text-sm text-primary">
            Secure. Streamlined. Sleek.
          </div>
          <h1 className="mt-4 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground">
            Student Information
            <br />
            Management System
          </h1>
          <p className="mt-4 text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            A modern platform for attendance, marks, notices, and academic workflows with strict role-based access.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 max-w-5xl mx-auto mb-12 sm:mb-16 md:mb-20">
          <Card className="border border-border/70 bg-card/70 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center mb-3">
                <GraduationCap className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-xl sm:text-2xl">Student Portal</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                View attendance, marks, study materials, notices, and campus updates.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 mb-4 text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>Attendance</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <span>Marks</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  <span>Notices</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span>Progress</span>
                </div>
              </div>
              <Button onClick={() => navigate("/student-auth")} className="w-full">
                <span>Student Login</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-border/70 bg-card/70 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center mb-3">
                <BookOpen className="w-6 h-6 text-accent" />
              </div>
              <CardTitle className="text-xl sm:text-2xl">Faculty Portal</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Manage students, mark attendance, upload study materials, and post updates.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 mb-4 text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-accent" />
                  <span>Students</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-accent" />
                  <span>Marks</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-accent" />
                  <span>Attendance</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-accent" />
                  <span>Announcements</span>
                </div>
              </div>
              <Button onClick={() => navigate("/faculty-auth")} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                <span>Faculty Login</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
          <Card className="border border-border/70 bg-card/60">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center mb-3">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-base sm:text-lg">Role-Based Access</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Clear boundaries for students, faculty, and admin to keep data safe.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border border-border/70 bg-card/60">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center mb-3">
                <Award className="w-6 h-6 text-accent" />
              </div>
              <CardTitle className="text-base sm:text-lg">Comprehensive Modules</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Attendance, marks, placements, and study materials in one place.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border border-border/70 bg-card/60 sm:col-span-2 md:col-span-1">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center mb-3">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-base sm:text-lg">Live Updates</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Stay in sync with notices, events, and performance updates.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
