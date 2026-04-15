import { AuthGuard } from '@/components/AuthGuard';
import TeacherDashboard from '@/components/TeacherDashboard';

const TeacherDashboardPage = () => {
  return (
    <AuthGuard requiredRole="teacher">
      <TeacherDashboard />
    </AuthGuard>
  );
};

export default TeacherDashboardPage;
