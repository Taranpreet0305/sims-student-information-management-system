import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { lazy, Suspense } from "react";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import PageTransition from "./PageTransition";
import { FullPageLoader } from "./AnimatedLoader";

const StudentAuth = lazy(() => import("@/pages/StudentAuth"));
const FacultyAuth = lazy(() => import("@/pages/FacultyAuth"));
const StudentDashboard = lazy(() => import("@/pages/student/Dashboard"));
const StudentAttendance = lazy(() => import("@/pages/student/Attendance"));
const StudentMarks = lazy(() => import("@/pages/student/Marks"));
const StudentVoting = lazy(() => import("@/pages/student/Voting"));
const StudentNotifications = lazy(() => import("@/pages/student/Notifications"));
const NoticeBoard = lazy(() => import("@/pages/student/NoticeBoard"));
const StudentNotices = lazy(() => import("@/pages/student/Notices"));
const StudentFeedback = lazy(() => import("@/pages/student/Feedback"));
const StudentTimetable = lazy(() => import("@/pages/student/Timetable"));
const StudentEditProfile = lazy(() => import("@/pages/student/EditProfile"));

const FacultyDashboard = lazy(() => import("@/pages/faculty/Dashboard"));
const ApproveStudents = lazy(() => import("@/pages/faculty/ApproveStudents"));
const ManageAttendance = lazy(() => import("@/pages/faculty/ManageAttendance"));
const UploadMarks = lazy(() => import("@/pages/faculty/UploadMarks"));
const ViewFeedback = lazy(() => import("@/pages/faculty/ViewFeedback"));
const FacultyNotifications = lazy(() => import("@/pages/faculty/Notifications"));
const ManageElections = lazy(() => import("@/pages/faculty/ManageElections"));
const ApproveFaculty = lazy(() => import("@/pages/faculty/ApproveFaculty"));
const StudentPerformance = lazy(() => import("@/pages/faculty/StudentPerformance"));
const Analytics = lazy(() => import("@/pages/faculty/Analytics"));
const ManageRoles = lazy(() => import("@/pages/faculty/ManageRoles"));
const Placements = lazy(() => import("@/pages/student/Placements"));
const StudyMaterials = lazy(() => import("@/pages/student/StudyMaterials"));
const FacultyStudyMaterials = lazy(() => import("@/pages/faculty/StudyMaterials"));
const ManageNotices = lazy(() => import("@/pages/faculty/ManageNotices"));
const ManagePlacements = lazy(() => import("@/pages/faculty/ManagePlacements"));
const AdminDashboard = lazy(() => import("@/pages/faculty/AdminDashboard"));
const ManageTimetable = lazy(() => import("@/pages/faculty/ManageTimetable"));
const FacultyEditProfile = lazy(() => import("@/pages/faculty/EditProfile"));
const ElectionResults = lazy(() => import("@/pages/faculty/ElectionResults"));

const LoadingFallback = () => (
  <FullPageLoader text="Loading..." />
);

export const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<LoadingFallback />}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><Index /></PageTransition>} />
          <Route path="/student-auth" element={<PageTransition><StudentAuth /></PageTransition>} />
          <Route path="/faculty-auth" element={<PageTransition><FacultyAuth /></PageTransition>} />
          
          {/* Student Routes */}
          <Route path="/student/dashboard" element={<PageTransition><StudentDashboard /></PageTransition>} />
          <Route path="/student/attendance" element={<PageTransition><StudentAttendance /></PageTransition>} />
          <Route path="/student/marks" element={<PageTransition><StudentMarks /></PageTransition>} />
          <Route path="/student/voting" element={<PageTransition><StudentVoting /></PageTransition>} />
          <Route path="/student/notifications" element={<PageTransition><StudentNotifications /></PageTransition>} />
          <Route path="/student/notice-board" element={<PageTransition><NoticeBoard /></PageTransition>} />
          <Route path="/student/notices" element={<PageTransition><StudentNotices /></PageTransition>} />
          <Route path="/student/feedback" element={<PageTransition><StudentFeedback /></PageTransition>} />
          <Route path="/student/placements" element={<PageTransition><Placements /></PageTransition>} />
          <Route path="/student/study-materials" element={<PageTransition><StudyMaterials /></PageTransition>} />
          <Route path="/student/timetable" element={<PageTransition><StudentTimetable /></PageTransition>} />
          <Route path="/student/edit-profile" element={<PageTransition><StudentEditProfile /></PageTransition>} />
          
          {/* Faculty Routes */}
          <Route path="/faculty/dashboard" element={<PageTransition><FacultyDashboard /></PageTransition>} />
          <Route path="/faculty/approve-students" element={<PageTransition><ApproveStudents /></PageTransition>} />
          <Route path="/faculty/add-attendance" element={<PageTransition><ManageAttendance /></PageTransition>} />
          <Route path="/faculty/upload-marks" element={<PageTransition><UploadMarks /></PageTransition>} />
          <Route path="/faculty/view-feedbacks" element={<PageTransition><ViewFeedback /></PageTransition>} />
          <Route path="/faculty/notifications" element={<PageTransition><FacultyNotifications /></PageTransition>} />
          <Route path="/faculty/manage-elections" element={<PageTransition><ManageElections /></PageTransition>} />
          <Route path="/faculty/approve-faculty" element={<PageTransition><ApproveFaculty /></PageTransition>} />
          <Route path="/faculty/student-performance" element={<PageTransition><StudentPerformance /></PageTransition>} />
          <Route path="/faculty/analytics" element={<PageTransition><Analytics /></PageTransition>} />
          <Route path="/faculty/manage-roles" element={<PageTransition><ManageRoles /></PageTransition>} />
          <Route path="/faculty/study-materials" element={<PageTransition><FacultyStudyMaterials /></PageTransition>} />
          <Route path="/faculty/notices" element={<PageTransition><ManageNotices /></PageTransition>} />
          <Route path="/faculty/placements" element={<PageTransition><ManagePlacements /></PageTransition>} />
          <Route path="/faculty/admin-dashboard" element={<PageTransition><AdminDashboard /></PageTransition>} />
          <Route path="/faculty/timetable" element={<PageTransition><ManageTimetable /></PageTransition>} />
          <Route path="/faculty/edit-profile" element={<PageTransition><FacultyEditProfile /></PageTransition>} />
          <Route path="/faculty/election-results" element={<PageTransition><ElectionResults /></PageTransition>} />
          
          <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
};

export default AnimatedRoutes;
