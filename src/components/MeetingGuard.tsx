import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { meetingService } from '@/services/meetingService';
import { Lock, AlertCircle, Loader2 } from 'lucide-react';

interface MeetingGuardProps {
  children: React.ReactNode;
  requireActive?: boolean;
}

export const MeetingGuard: React.FC<MeetingGuardProps> = ({ 
  children, 
  requireActive = true 
}) => {
  const { meetingCode } = useParams<{ meetingCode: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [meeting, setMeeting] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (meetingCode) {
      validateMeeting();
    } else {
      setError('No meeting code provided');
      setLoading(false);
    }
  }, [meetingCode]);

  const validateMeeting = async () => {
    if (!meetingCode) return;

    try {
      const result = await meetingService.getMeetingByCode(meetingCode.toUpperCase());
      
      if (result.success && result.data) {
        setMeeting(result.data);
        
        // Check if meeting needs to be active
        if (requireActive && !result.data.is_active) {
          setError('This meeting is not currently active');
          toast({
            title: "Meeting Inactive",
            description: "The meeting is not currently active. Please contact your teacher.",
            variant: "destructive",
          });
        }
      } else {
        setError(result.error || 'Meeting not found');
        toast({
          title: "Access Denied",
          description: result.error || 'Invalid meeting code',
          variant: "destructive",
        });
      }
    } catch (error) {
      setError('Failed to validate meeting');
      toast({
        title: "Error",
        description: "Failed to validate meeting access",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">Validating Meeting Access</h2>
          <p className="text-gray-600">Please wait while we verify your meeting access...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg border p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-red-600" />
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <div className="font-medium text-red-900 mb-1">Possible Reasons:</div>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>• Invalid or expired meeting code</li>
                    <li>• Meeting is not currently active</li>
                    <li>• Meeting has been deleted by teacher</li>
                    <li>• Network connectivity issues</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => navigate('/join-meeting')}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Try Different Code
              </button>
              <button
                onClick={validateMeeting}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Retry Validation
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (requireActive && !meeting.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg border p-8 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 mb-2">Meeting Not Active</h2>
            <p className="text-gray-600 mb-6">
              This meeting is not currently active. Please wait for the teacher to activate it.
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="text-sm text-yellow-800">
                <div className="font-medium mb-2">Meeting Details:</div>
                <div className="space-y-1">
                  <div>Code: <span className="font-mono font-bold">{meeting.code}</span></div>
                  <div>Teacher: {meeting.teacher_name}</div>
                  <div>Status: <span className="font-medium">Inactive</span></div>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Check Status
              </button>
              <button
                onClick={() => navigate('/join-meeting')}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Join Different Meeting
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default MeetingGuard;
