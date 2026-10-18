import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { WorkspaceProvider } from '@/lib/WorkspaceContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import Capture from '@/pages/Capture';
import Knowledge from '@/pages/Knowledge';
import KnowledgeDetail from '@/pages/KnowledgeDetail';
import Projects from '@/pages/Projects';
import ProjectDetail from '@/pages/ProjectDetail';
import TaskDetail from '@/pages/TaskDetail';
import Learning from '@/pages/Learning';
import Decisions from '@/pages/Decisions';
import DecisionDetail from '@/pages/DecisionDetail';
import Lessons from '@/pages/Lessons';
import LessonDetail from '@/pages/LessonDetail';
import Review from '@/pages/Review';
import WeeklyReview from '@/pages/WeeklyReview';
import AIWorkspace from '@/pages/AIWorkspace';
import Settings from '@/pages/Settings';
import Workspaces from '@/pages/Workspaces';
import SearchPage from '@/pages/Search';
import Triage from '@/pages/Triage';
import QuickParse from '@/pages/QuickParse';
import QuickStart from '@/pages/QuickStart';
import Today from '@/pages/Today';
import ToolRouter from '@/pages/ToolRouter';
import ContextPacks from '@/pages/ContextPacks';
import ContextPackDetail from '@/pages/ContextPackDetail';
import Automations from '@/pages/Automations';
import Goals from '@/pages/Goals';
import Documents from '@/pages/Documents';
import ChiefOfStaff from '@/pages/ChiefOfStaff';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/capture" element={<Capture />} />
          <Route path="/triage" element={<Triage />} />
          <Route path="/parse" element={<QuickParse />} />
          <Route path="/guide" element={<QuickStart />} />
          <Route path="/today" element={<Today />} />
          <Route path="/router" element={<ToolRouter />} />
          <Route path="/automations" element={<Automations />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/chief-of-staff" element={<ChiefOfStaff />} />
          <Route path="/context-packs" element={<ContextPacks />} />
          <Route path="/context-pack" element={<ContextPackDetail />} />
          <Route path="/knowledge" element={<Knowledge />} />
          <Route path="/knowledge-detail" element={<KnowledgeDetail />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/project-detail" element={<ProjectDetail />} />
          <Route path="/task-detail" element={<TaskDetail />} />
          <Route path="/learning" element={<Learning />} />
          <Route path="/decisions" element={<Decisions />} />
          <Route path="/decision-detail" element={<DecisionDetail />} />
          <Route path="/lessons" element={<Lessons />} />
          <Route path="/lesson-detail" element={<LessonDetail />} />
          <Route path="/review" element={<Review />} />
          <Route path="/weekly-review" element={<WeeklyReview />} />
          <Route path="/ai" element={<AIWorkspace />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/workspaces" element={<Workspaces />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <WorkspaceProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <ScrollToTop />
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </WorkspaceProvider>
    </AuthProvider>
  )
}

export default App