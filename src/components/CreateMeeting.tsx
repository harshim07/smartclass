import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { meetingService, CreateMeetingData } from '@/services/meetingService';
import { Copy, Users, Calendar } from 'lucide-react';

interface CreateMeetingProps {
  onMeetingCreated?: (meeting: any) => void;
}

export const CreateMeeting: React.FC<CreateMeetingProps> = ({ onMeetingCreated }) => {
  const [teacherName, setTeacherName] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdMeeting, setCreatedMeeting] = useState<any>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!teacherName.trim()) {
      toast({
        title: "Error",
        description: "Please enter your name",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const result = await meetingService.createMeeting({
        teacher_name: teacherName.trim(),
      });

      if (result.success && result.data) {
        setCreatedMeeting(result.data);
        toast({
          title: "Meeting Created!",
          description: `Meeting code: ${result.data.code}`,
        });
        
        if (onMeetingCreated) {
          onMeetingCreated(result.data);
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create meeting",
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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Meeting code copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setTeacherName('');
    setCreatedMeeting(null);
  };

  if (createdMeeting) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg border">
        <div className="text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Meeting Created Successfully!</h2>
            <p className="text-gray-600">Share this code with your students</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="text-sm text-gray-500 mb-2">Meeting Code</div>
            <div className="flex items-center justify-center gap-3">
              <div className="text-3xl font-mono font-bold text-blue-600 tracking-wider">
                {createdMeeting.code}
              </div>
              <button
                onClick={() => copyToClipboard(createdMeeting.code)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                title="Copy code"
              >
                <Copy className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <div className="font-medium text-blue-900">Meeting Details</div>
                <div className="text-sm text-blue-700 mt-1">
                  Teacher: {createdMeeting.teacher_name}
                </div>
                <div className="text-sm text-blue-700">
                  Status: <span className="font-medium">{createdMeeting.is_active ? 'Active' : 'Inactive'}</span>
                </div>
                <div className="text-sm text-blue-700">
                  Created: {new Date(createdMeeting.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={resetForm}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Create Another Meeting
            </button>
            <button
              onClick={() => copyToClipboard(createdMeeting.code)}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Copy Code
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create New Meeting</h2>
        <p className="text-gray-600">Generate a unique code for your classroom session</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="teacherName" className="block text-sm font-medium text-gray-700 mb-2">
            Your Name
          </label>
          <input
            id="teacherName"
            type="text"
            value={teacherName}
            onChange={(e) => setTeacherName(e.target.value)}
            placeholder="Enter your name"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading || !teacherName.trim()}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? 'Creating Meeting...' : 'Create Meeting'}
        </button>
      </form>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-600">
          <div className="font-medium mb-2">How it works:</div>
          <ul className="space-y-1 text-xs">
            <li>• Enter your name to create a meeting</li>
            <li>• Get a unique 6-character code</li>
            <li>• Share the code with your students</li>
            <li>• Students use the code to join your session</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CreateMeeting;
