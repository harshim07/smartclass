import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import MeetingRoom from "@/pages/MeetingRoom";
import Reports from "@/pages/Reports";
import Query from "@/pages/Query";
import NotFound from "@/pages/NotFound";
import CompleteProfile from "@/pages/CompleteProfile";
import CreateMeetingPage from "@/pages/CreateMeetingPage";
import ManageMeetingsPage from "@/pages/ManageMeetingsPage";
import JoinMeetingPage from "@/pages/JoinMeetingPage";
import MeetingRoomPage from "@/pages/MeetingRoomPage";
import DebugPage from "@/pages/DebugPage";
import TeacherDashboardPage from "@/pages/TeacherDashboardPage";
import TeacherMeetingRoomPage from "@/pages/TeacherMeetingRoomPage";
import TestTeacherMeetingPage from "@/pages/TestTeacherMeetingPage";

const queryClient = new QueryClient();

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RoleRouter() {
  const { user, profile, loading, profileLoading } = useAuth();

  if (loading || (user && profileLoading)) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  }

  if (!user) {
    return <Home />;
  }

  if (!profile) {
    return <Navigate to="/complete-profile" replace />;
  }

  if (profile.role === "teacher") {
    return <Navigate to="/teacher/dashboard" replace />;
  }

  return <Navigate to="/student/dashboard" replace />;
}

function AppRoutes() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 py-6">
        <Routes>
          <Route path="/" element={<RoleRouter />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/complete-profile" element={<CompleteProfile />} />
          <Route
            path="/teacher/dashboard"
            element={
              <ProtectedRoute>
                <TeacherDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/create-meeting"
            element={
              <ProtectedRoute>
                <CreateMeetingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/manage-meetings"
            element={
              <ProtectedRoute>
                <ManageMeetingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/meeting/:meetingCode"
            element={
              <ProtectedRoute>
                <TeacherMeetingRoomPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/meeting/:meetingCode"
            element={
              <ProtectedRoute>
                <MeetingRoomPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/join-meeting"
            element={
              <ProtectedRoute>
                <JoinMeetingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/join-meeting"
            element={
              <JoinMeetingPage />
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/debug"
            element={
              <ProtectedRoute>
                <DebugPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/query"
            element={
              <ProtectedRoute>
                <Query />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
