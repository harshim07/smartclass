import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { meetingService, JoinMeetingData } from '@/services/meetingService';
import { Users, ArrowRight, CheckCircle } from 'lucide-react';

interface JoinMeetingProps {
  onMeetingJoined?: (participant: any) => void;
}

export const JoinMeeting: React.FC<JoinMeetingProps> = ({ onMeetingJoined }) => {
  const [meetingCode, setMeetingCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [loading, setLoading] = useState(false);
  const [joinedMeeting, setJoinedMeeting] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!meetingCode.trim() || !studentName.trim()) {
      toast({
        title: "Error",
        description: "Please enter both meeting code and your name",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const result = await meetingService.joinMeeting({
        meeting_code: meetingCode.trim().toUpperCase(),
        student_name: studentName.trim(),
      });

      if (result.success && result.data) {
        setJoinedMeeting(result.data);
        toast({
          title: "Successfully Joined!",
          description: `You've joined the meeting`,
        });
        
        if (onMeetingJoined) {
          onMeetingJoined(result.data);
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to join meeting",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  const goToMeetingRoom = () => {
    if (joinedMeeting?.meeting?.code) {
      navigate(`/meeting/${joinedMeeting.meeting.code}`);
    }
  };

  const resetForm = () => {
    setMeetingCode('');
    setStudentName('');
    setJoinedMeeting(null);
  };

  if (joinedMeeting) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg border">
        <div className="text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Successfully Joined!</h2>
            <p className="text-gray-600">You're now in the meeting</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="text-sm text-gray-500 mb-2">Meeting Code</div>
            <div className="text-2xl font-mono font-bold text-blue-600 tracking-wider mb-4">
              {joinedMeeting.meeting.code}
            </div>
            
            <div className="space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-gray-600">Your Name:</span>
                <span className="font-medium">{joinedMeeting.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Teacher:</span>
                <span className="font-medium">{joinedMeeting.meeting.teacher_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium text-green-600">Connected</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Joined At:</span>
                <span className="font-medium">{new Date(joinedMeeting.joined_at).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="text-sm text-blue-800">
              <div className="font-medium mb-1">Meeting Tips:</div>
              <ul className="space-y-1 text-xs">
                <li>• Keep your camera on for better engagement</li>
                <li>• Participate actively in discussions</li>
                <li>• Your attention and emotions will be monitored</li>
                <li>• Stay focused for the best learning experience</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={resetForm}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Join Another Meeting
            </button>
            <button
              onClick={goToMeetingRoom}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Enter Meeting
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg border">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Join Meeting</h2>
        <p className="text-gray-600">Enter the meeting code provided by your teacher</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="meetingCode" className="block text-sm font-medium text-gray-700 mb-2">
            Meeting Code
          </label>
          <input
            id="meetingCode"
            type="text"
            value={meetingCode}
            onChange={(e) => setMeetingCode(e.target.value.toUpperCase())}
            placeholder="Enter 6-character code"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors font-mono text-center text-lg tracking-wider"
            maxLength={6}
            required
          />
        </div>

        <div>
          <label htmlFor="studentName" className="block text-sm font-medium text-gray-700 mb-2">
            Your Name
          </label>
          <input
            id="studentName"
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="Enter your full name"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading || !meetingCode.trim() || !studentName.trim()}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Joining...
            </>
          ) : (
            <>
              Join Meeting
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-600">
          <div className="font-medium mb-2">Before you join:</div>
          <ul className="space-y-1 text-xs">
            <li>• Make sure you have the correct meeting code</li>
            <li>• Use your real name for attendance tracking</li>
            <li>• Ensure you have a stable internet connection</li>
            <li>• Find a quiet place for the meeting</li>
          </ul>
        </div>
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          Don't have a meeting code? Contact your teacher for assistance.
        </p>
      </div>
    </div>
  );
};

export default JoinMeeting;
