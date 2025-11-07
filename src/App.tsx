import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const StudentAuth = lazy(() => import("./pages/StudentAuth"));
const FacultyAuth = lazy(() => import("./pages/FacultyAuth"));
const StudentDashboard = lazy(() => import("./pages/student/Dashboard"));
const StudentAttendance = lazy(() => import("./pages/student/Attendance"));
const StudentMarks = lazy(() => import("./pages/student/Marks"));
const StudentVoting = lazy(() => import("./pages/student/Voting"));
const StudentNotifications = lazy(() => import("./pages/student/Notifications"));
const NoticeBoard = lazy(() => import("./pages/student/NoticeBoard"));
const StudentFeedback = lazy(() => import("./pages/student/Feedback"));
const CRView = lazy(() => import("./pages/student/CRView"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/student-auth" element={<StudentAuth />} />
            <Route path="/faculty-auth" element={<FacultyAuth />} />
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/attendance" element={<StudentAttendance />} />
            <Route path="/student/marks" element={<StudentMarks />} />
            <Route path="/student/voting" element={<StudentVoting />} />
            <Route path="/student/notifications" element={<StudentNotifications />} />
            <Route path="/student/notice-board" element={<NoticeBoard />} />
            <Route path="/student/feedback" element={<StudentFeedback />} />
            <Route path="/student/cr-view" element={<CRView />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
