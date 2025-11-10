import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, BookOpen, Users, Award, TrendingUp, Calendar, Bell, FileText, Sparkles, ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Footer } from "@/components/Footer";

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative flex flex-col overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
        <div className="absolute top-0 -right-4 w-72 h-72 bg-accent/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-primary/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse" />
      </div>

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
            <ThemeToggle />
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
