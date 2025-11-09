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

const FacultyDashboard = lazy(() => import("./pages/faculty/Dashboard"));
const ApproveStudents = lazy(() => import("./pages/faculty/ApproveStudents"));
const ManageAttendance = lazy(() => import("./pages/faculty/ManageAttendance"));
const UploadMarks = lazy(() => import("./pages/faculty/UploadMarks"));
const ViewFeedback = lazy(() => import("./pages/faculty/ViewFeedback"));
const FacultyNotifications = lazy(() => import("./pages/faculty/Notifications"));
const ManageElections = lazy(() => import("./pages/faculty/ManageElections"));
const ApproveFaculty = lazy(() => import("./pages/faculty/ApproveFaculty"));
const StudentPerformance = lazy(() => import("./pages/faculty/StudentPerformance"));
const Analytics = lazy(() => import("./pages/faculty/Analytics"));
const ManageRoles = lazy(() => import("./pages/faculty/ManageRoles"));
const Placements = lazy(() => import("./pages/student/Placements"));
const StudyMaterials = lazy(() => import("./pages/student/StudyMaterials"));
const FacultyStudyMaterials = lazy(() => import("./pages/faculty/StudyMaterials"));
const ManageNotices = lazy(() => import("./pages/faculty/ManageNotices"));
const ManagePlacements = lazy(() => import("./pages/faculty/ManagePlacements"));

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
            
            {/* Student Routes */}
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/attendance" element={<StudentAttendance />} />
            <Route path="/student/marks" element={<StudentMarks />} />
            <Route path="/student/voting" element={<StudentVoting />} />
            <Route path="/student/notifications" element={<StudentNotifications />} />
            <Route path="/student/notice-board" element={<NoticeBoard />} />
            <Route path="/student/feedback" element={<StudentFeedback />} />
            <Route path="/student/placements" element={<Placements />} />
            <Route path="/student/study-materials" element={<StudyMaterials />} />
            
            {/* Faculty Routes */}
            <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
            <Route path="/faculty/approve-students" element={<ApproveStudents />} />
            <Route path="/faculty/add-attendance" element={<ManageAttendance />} />
            <Route path="/faculty/upload-marks" element={<UploadMarks />} />
            <Route path="/faculty/view-feedbacks" element={<ViewFeedback />} />
            <Route path="/faculty/notifications" element={<FacultyNotifications />} />
            <Route path="/faculty/manage-elections" element={<ManageElections />} />
            <Route path="/faculty/approve-faculty" element={<ApproveFaculty />} />
            <Route path="/faculty/student-performance" element={<StudentPerformance />} />
            <Route path="/faculty/analytics" element={<Analytics />} />
            <Route path="/faculty/manage-roles" element={<ManageRoles />} />
            <Route path="/faculty/study-materials" element={<FacultyStudyMaterials />} />
            <Route path="/faculty/notices" element={<ManageNotices />} />
            <Route path="/faculty/placements" element={<ManagePlacements />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
