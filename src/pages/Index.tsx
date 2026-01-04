import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, BookOpen, Users, Award, TrendingUp, Calendar, Bell, FileText, Sparkles, ArrowRight, Zap } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/components/ThemeProvider";
import FloatingParticles from "@/components/FloatingParticles";
import { Footer } from "@/components/Footer";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function Index() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [checkingSession, setCheckingSession] = useState(true);
  const [neonMode, setNeonMode] = useState(false);
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
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

  const enableNeonMode = () => {
    setTheme("dark");
    setNeonMode(true);
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedBackground />
        <FloatingParticles count={40} isDark={isDark} />
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Neon Mode Landing Page
  if (neonMode) {
    return (
      <div className="min-h-screen relative flex flex-col overflow-hidden bg-black">
        {/* Neon Background */}
        <div className="fixed inset-0 -z-10">
          {/* Deep space gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-black via-slate-950 to-black" />
          
          {/* Neon orbs */}
          <div className="absolute top-10 left-10 w-80 h-80 bg-gradient-to-br from-cyan-500/40 to-blue-600/40 rounded-full filter blur-[100px] animate-blob" />
          <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-fuchsia-500/40 to-purple-600/40 rounded-full filter blur-[100px] animate-blob animation-delay-2000" />
          <div className="absolute bottom-10 left-1/4 w-72 h-72 bg-gradient-to-br from-emerald-500/30 to-teal-600/30 rounded-full filter blur-[100px] animate-blob animation-delay-4000" />
          <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-gradient-to-br from-violet-500/35 to-indigo-600/35 rounded-full filter blur-[100px] animate-blob" />
          
          {/* Neon grid lines */}
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(to right, rgba(139, 92, 246, 0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(139, 92, 246, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }} />
          
          {/* Scanning lines effect */}
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent animate-pulse" />
          <div className="absolute top-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-fuchsia-400/30 to-transparent animate-pulse animation-delay-2000" />
          <div className="absolute top-2/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent animate-pulse animation-delay-4000" />
          
          {/* Vertical neon beams */}
          <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-cyan-500/30 via-transparent to-cyan-500/30 animate-pulse" />
          <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-fuchsia-500/30 via-transparent to-fuchsia-500/30 animate-pulse animation-delay-2000" />
          
          {/* Corner glow effects */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-radial from-cyan-500/20 to-transparent" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-radial from-fuchsia-500/20 to-transparent" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-radial from-emerald-500/20 to-transparent" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-radial from-violet-500/20 to-transparent" />
        </div>
        
        <FloatingParticles count={80} isDark={true} />

        {/* Neon Header */}
        <header className="sticky top-0 z-50 border-b border-cyan-500/20 bg-black/50 backdrop-blur-xl">
          <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setNeonMode(false)}>
                <div className="relative">
                  <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8 text-cyan-400 transition-all group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                  <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-fuchsia-400 absolute -top-1 -right-1 animate-pulse drop-shadow-[0_0_4px_rgba(232,121,249,0.8)]" />
                </div>
                <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]">
                  SIMS
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setNeonMode(false)}
                className="text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/10 hover:border-cyan-400"
              >
                Exit Neon
              </Button>
            </div>
          </div>
        </header>

        {/* Neon Main Content */}
        <main className="flex-1 container mx-auto px-3 sm:px-4 py-6 sm:py-8 md:py-12">
          {/* Neon Hero Section */}
          <div className="text-center mb-8 sm:mb-10 md:mb-16 animate-fade-in">
            <div className="inline-block mb-4 px-4 py-2 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 backdrop-blur-sm">
              <span className="text-xs sm:text-sm font-medium text-fuchsia-300 flex items-center gap-2">
                <Zap className="w-3 h-3 sm:w-4 sm:h-4 animate-pulse" />
                NEON MODE ACTIVATED
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black mb-4 sm:mb-6 leading-tight">
              <span className="bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(34,211,238,0.5)]">
                STUDENT
              </span>
              <br />
              <span className="text-white/90 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">INFORMATION</span>
              <br />
              <span className="bg-gradient-to-r from-fuchsia-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(232,121,249,0.5)]">
                MANAGEMENT
              </span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-cyan-100/70 max-w-2xl mx-auto px-4 leading-relaxed">
              Experience the future of academic management with our cutting-edge platform
            </p>
          </div>

          {/* Neon Portal Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 max-w-5xl mx-auto mb-12 sm:mb-16 md:mb-20 px-4">
            {/* Student Portal - Cyan Theme */}
            <div className="group relative animate-scale-in">
              <div className="absolute -inset-[2px] bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl blur-sm opacity-75 group-hover:opacity-100 transition-opacity duration-300" />
              <Card className="relative bg-black/80 border-0 overflow-hidden rounded-2xl backdrop-blur-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent" />
                <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500" />
                <CardHeader className="relative">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 shadow-[0_0_20px_rgba(34,211,238,0.5)]">
                    <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl sm:text-2xl text-cyan-100 group-hover:text-cyan-400 transition-colors">
                    Student Portal
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base text-cyan-100/60">
                    Access your attendance, marks, study materials, and participate in campus activities
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <div className="grid grid-cols-2 gap-2 mb-4 text-xs sm:text-sm">
                    <div className="flex items-center gap-2 text-cyan-300/80">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400" />
                      <span>Attendance</span>
                    </div>
                    <div className="flex items-center gap-2 text-cyan-300/80">
                      <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400" />
                      <span>Marks</span>
                    </div>
                    <div className="flex items-center gap-2 text-cyan-300/80">
                      <Bell className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400" />
                      <span>Notices</span>
                    </div>
                    <div className="flex items-center gap-2 text-cyan-300/80">
                      <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400" />
                      <span>Progress</span>
                    </div>
                  </div>
                  <Button 
                    onClick={() => navigate("/student-auth")} 
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:shadow-[0_0_30px_rgba(34,211,238,0.6)] transition-all duration-300"
                  >
                    <span>Student Login</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Faculty Portal - Fuchsia Theme */}
            <div className="group relative animate-scale-in animation-delay-200">
              <div className="absolute -inset-[2px] bg-gradient-to-r from-fuchsia-500 to-violet-500 rounded-2xl blur-sm opacity-75 group-hover:opacity-100 transition-opacity duration-300" />
              <Card className="relative bg-black/80 border-0 overflow-hidden rounded-2xl backdrop-blur-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/10 to-transparent" />
                <div className="absolute top-0 right-0 w-40 h-40 bg-fuchsia-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500" />
                <CardHeader className="relative">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-fuchsia-400 to-violet-500 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 shadow-[0_0_20px_rgba(232,121,249,0.5)]">
                    <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl sm:text-2xl text-fuchsia-100 group-hover:text-fuchsia-400 transition-colors">
                    Faculty Portal
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base text-fuchsia-100/60">
                    Manage students, track performance, upload marks, and create announcements
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <div className="grid grid-cols-2 gap-2 mb-4 text-xs sm:text-sm">
                    <div className="flex items-center gap-2 text-fuchsia-300/80">
                      <Users className="w-3 h-3 sm:w-4 sm:h-4 text-fuchsia-400" />
                      <span>Students</span>
                    </div>
                    <div className="flex items-center gap-2 text-fuchsia-300/80">
                      <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-fuchsia-400" />
                      <span>Marks</span>
                    </div>
                    <div className="flex items-center gap-2 text-fuchsia-300/80">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-fuchsia-400" />
                      <span>Attendance</span>
                    </div>
                    <div className="flex items-center gap-2 text-fuchsia-300/80">
                      <Bell className="w-3 h-3 sm:w-4 sm:h-4 text-fuchsia-400" />
                      <span>Announcements</span>
                    </div>
                  </div>
                  <Button 
                    onClick={() => navigate("/faculty-auth")} 
                    className="w-full bg-gradient-to-r from-fuchsia-500 to-violet-500 hover:from-fuchsia-400 hover:to-violet-400 text-white shadow-[0_0_20px_rgba(232,121,249,0.4)] hover:shadow-[0_0_30px_rgba(232,121,249,0.6)] transition-all duration-300"
                  >
                    <span>Faculty Login</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Neon Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto px-4">
            <div className="group relative animate-fade-in">
              <div className="absolute -inset-px bg-gradient-to-r from-cyan-500/50 to-blue-500/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity blur-sm" />
              <Card className="relative bg-slate-900/50 border-cyan-500/20 hover:border-cyan-400/50 transition-all duration-300 backdrop-blur-xl">
                <CardHeader>
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform border border-cyan-500/30">
                    <Users className="w-6 h-6 sm:w-7 sm:h-7 text-cyan-400" />
                  </div>
                  <CardTitle className="text-base sm:text-lg text-white">Role-Based Access</CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-cyan-100/50">
                    Secure access control with different permission levels
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>

            <div className="group relative animate-fade-in animation-delay-200">
              <div className="absolute -inset-px bg-gradient-to-r from-fuchsia-500/50 to-violet-500/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity blur-sm" />
              <Card className="relative bg-slate-900/50 border-fuchsia-500/20 hover:border-fuchsia-400/50 transition-all duration-300 backdrop-blur-xl">
                <CardHeader>
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-violet-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform border border-fuchsia-500/30">
                    <Award className="w-6 h-6 sm:w-7 sm:h-7 text-fuchsia-400" />
                  </div>
                  <CardTitle className="text-base sm:text-lg text-white">Comprehensive Features</CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-fuchsia-100/50">
                    Complete solution for attendance, marks, voting, placements
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>

            <div className="group relative animate-fade-in animation-delay-400 sm:col-span-2 md:col-span-1">
              <div className="absolute -inset-px bg-gradient-to-r from-emerald-500/50 to-teal-500/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity blur-sm" />
              <Card className="relative bg-slate-900/50 border-emerald-500/20 hover:border-emerald-400/50 transition-all duration-300 backdrop-blur-xl">
                <CardHeader>
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform border border-emerald-500/30">
                    <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-400" />
                  </div>
                  <CardTitle className="text-base sm:text-lg text-white">Real-Time Updates</CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-emerald-100/50">
                    Get instant notifications about attendance, marks, and announcements
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </main>
        
        {/* Neon Footer */}
        <footer className="border-t border-cyan-500/20 bg-black/50 backdrop-blur-xl py-4">
          <div className="container mx-auto px-4 text-center">
            <p className="text-cyan-100/40 text-sm">
              © 2024 SIMS • <span className="text-fuchsia-400">Neon Edition</span>
            </p>
          </div>
        </footer>
      </div>
    );
  }

  // Normal Landing Page
  return (
    <div className="min-h-screen relative flex flex-col overflow-hidden">
      {/* Animated Background */}
      <AnimatedBackground />
      
      {/* Floating Particles */}
      <FloatingParticles count={60} isDark={isDark} />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-xl">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 group">
              <div className="relative">
                <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8 text-primary transition-transform group-hover:scale-110 group-hover:rotate-12" />
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-accent absolute -top-1 -right-1 animate-pulse" />
              </div>
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                SIMS
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={enableNeonMode}
                className="text-xs sm:text-sm hidden sm:flex"
              >
                <Zap className="w-4 h-4 mr-1" />
                Neon Mode
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-3 sm:px-4 py-6 sm:py-8 md:py-12">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-10 md:mb-16 animate-fade-in">
          <div className="inline-block mb-4 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
            <span className="text-xs sm:text-sm font-medium text-primary flex items-center gap-2">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
              Welcome to the Future of Education
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent leading-tight">
            Student Information
            <br />
            Management System
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4 leading-relaxed">
            A comprehensive platform designed to streamline academic management for students and faculty
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={enableNeonMode}
            className="mt-4 sm:hidden"
          >
            <Zap className="w-4 h-4 mr-1" />
            Try Neon Mode
          </Button>
        </div>

        {/* Portal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 max-w-5xl mx-auto mb-12 sm:mb-16 md:mb-20 px-4">
          <Card className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 animate-scale-in">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500" />
            <CardHeader className="relative">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 shadow-lg">
                <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-xl sm:text-2xl group-hover:text-primary transition-colors">
                Student Portal
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Access your attendance, marks, study materials, and participate in campus activities
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <div className="grid grid-cols-2 gap-2 mb-4 text-xs sm:text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                  <span>Attendance</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                  <span>Marks</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Bell className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                  <span>Notices</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                  <span>Progress</span>
                </div>
              </div>
              <Button 
                onClick={() => navigate("/student-auth")} 
                className="w-full group/btn hover:scale-105 transition-all duration-300 shadow-lg"
              >
                <span>Student Login</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-2 hover:border-accent/50 transition-all duration-300 hover:shadow-2xl hover:shadow-accent/20 animate-scale-in animation-delay-200">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500" />
            <CardHeader className="relative">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 shadow-lg">
                <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 text-accent-foreground" />
              </div>
              <CardTitle className="text-xl sm:text-2xl group-hover:text-accent transition-colors">
                Faculty Portal
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Manage students, track performance, upload marks, and create announcements
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <div className="grid grid-cols-2 gap-2 mb-4 text-xs sm:text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-3 h-3 sm:w-4 sm:h-4 text-accent" />
                  <span>Students</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-accent" />
                  <span>Marks</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-accent" />
                  <span>Attendance</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Bell className="w-3 h-3 sm:w-4 sm:h-4 text-accent" />
                  <span>Announcements</span>
                </div>
              </div>
              <Button 
                onClick={() => navigate("/faculty-auth")} 
                className="w-full group/btn bg-accent hover:bg-accent/90 hover:scale-105 transition-all duration-300 shadow-lg"
              >
                <span>Faculty Login</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto px-4">
          <Card className="group border-0 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm hover:shadow-xl hover:scale-105 transition-all duration-300 animate-fade-in">
            <CardHeader>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
              </div>
              <CardTitle className="text-base sm:text-lg">Role-Based Access</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Secure access control with different permission levels for optimal data protection
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group border-0 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm hover:shadow-xl hover:scale-105 transition-all duration-300 animate-fade-in animation-delay-200">
            <CardHeader>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Award className="w-6 h-6 sm:w-7 sm:h-7 text-accent" />
              </div>
              <CardTitle className="text-base sm:text-lg">Comprehensive Features</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Complete solution for attendance, marks, voting, placements, and more
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group border-0 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm hover:shadow-xl hover:scale-105 transition-all duration-300 animate-fade-in animation-delay-400 sm:col-span-2 md:col-span-1">
            <CardHeader>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
              </div>
              <CardTitle className="text-base sm:text-lg">Real-Time Updates</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Get instant notifications about attendance, marks, and important announcements
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
