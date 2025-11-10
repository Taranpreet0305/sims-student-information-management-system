import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, BookOpen, Users, Award } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Footer } from "@/components/Footer";

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex flex-col">
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold">SIMS</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Student Information Management System
          </h1>
          <p className="text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            A comprehensive platform for managing student data, attendance, marks, and more
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-4xl mx-auto px-4">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <GraduationCap className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Student Portal</CardTitle>
              <CardDescription>
                Access your attendance, marks, notifications, and participate in elections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/student-auth")} className="w-full">
                Student Login
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-accent" />
              </div>
              <CardTitle>Faculty Portal</CardTitle>
              <CardDescription>
                Manage students, upload attendance and marks, create announcements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/faculty-auth")} className="w-full" variant="outline">
                Faculty Login
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto mt-12 md:mt-16 px-4">
          <Card className="border-0 bg-card/50">
            <CardHeader>
              <Users className="w-8 h-8 text-primary mb-2" />
              <CardTitle className="text-lg">Role-Based Access</CardTitle>
              <CardDescription>
                Secure access control for students and faculty with different permission levels
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 bg-card/50">
            <CardHeader>
              <Award className="w-8 h-8 text-accent mb-2" />
              <CardTitle className="text-lg">Comprehensive Features</CardTitle>
              <CardDescription>
                Attendance tracking, marks management, voting system, and placement notifications
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 bg-card/50">
            <CardHeader>
              <GraduationCap className="w-8 h-8 text-primary mb-2" />
              <CardTitle className="text-lg">Real-Time Updates</CardTitle>
              <CardDescription>
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
