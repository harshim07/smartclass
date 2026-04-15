import { AuthGuard } from '@/components/AuthGuard';
import MeetingManager from '@/components/MeetingManager';

const ManageMeetingsPage = () => {
  return (
    <AuthGuard requiredRole="teacher">
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <MeetingManager />
        </div>
      </div>
    </AuthGuard>
  );
};

export default ManageMeetingsPage;
