import { AuthGuard } from '@/components/AuthGuard';
import CreateMeeting from '@/components/CreateMeeting';

const CreateMeetingPage = () => {
  return (
    <AuthGuard requiredRole="teacher">
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <CreateMeeting />
        </div>
      </div>
    </AuthGuard>
  );
};

export default CreateMeetingPage;
