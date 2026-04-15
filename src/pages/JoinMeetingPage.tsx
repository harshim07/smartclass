import { AuthGuard } from '@/components/AuthGuard';
import JoinMeeting from '@/components/JoinMeeting';

const JoinMeetingPage = () => {
  return (
    <AuthGuard requiredRole="student">
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <JoinMeeting />
        </div>
      </div>
    </AuthGuard>
  );
};

export default JoinMeetingPage;
