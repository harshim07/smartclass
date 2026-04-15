import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { meetingService, Meeting, Participant } from '@/services/meetingService';
import { 
  Users, 
  Eye, 
  EyeOff, 
  Trash2, 
  Copy, 
  Calendar,
  UserCheck,
  Activity,
  ArrowRight
} from 'lucide-react';

export const MeetingManager: React.FC = () => {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [showParticipants, setShowParticipants] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const result = await meetingService.getAllMeetings();
      if (result.success && result.data) {
        setMeetings(result.data);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to fetch meetings",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async (meetingId: string) => {
    setParticipantsLoading(true);
    try {
      const result = await meetingService.getMeetingParticipants(meetingId);
      if (result.success && result.data) {
        setParticipants(result.data);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to fetch participants",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setParticipantsLoading(false);
    }
  };

  const toggleMeetingStatus = async (meeting: Meeting) => {
    try {
      const result = await meetingService.updateMeeting(meeting.id, {
        is_active: !meeting.is_active,
      });

      if (result.success) {
        setMeetings(meetings.map(m => 
          m.id === meeting.id ? { ...m, is_active: !meeting.is_active } : m
        ));
        toast({
          title: "Success",
          description: `Meeting ${meeting.is_active ? 'deactivated' : 'activated'}`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update meeting",
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
  };

  const deleteMeeting = async (meetingId: string) => {
    if (!confirm('Are you sure you want to delete this meeting? This action cannot be undone.')) {
      return;
    }

    try {
      const result = await meetingService.deleteMeeting(meetingId);
      if (result.success) {
        setMeetings(meetings.filter(m => m.id !== meetingId));
        if (selectedMeeting?.id === meetingId) {
          setSelectedMeeting(null);
          setParticipants([]);
        }
        toast({
          title: "Success",
          description: "Meeting deleted successfully",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete meeting",
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

  const toggleParticipants = (meetingId: string) => {
    if (showParticipants === meetingId) {
      setShowParticipants(null);
      setParticipants([]);
    } else {
      setShowParticipants(meetingId);
      fetchParticipants(meetingId);
    }
  };

  const joinMeeting = (meeting: Meeting) => {
    navigate(`/teacher/meeting/${meeting.code}`);
  };

  const getEmotionColor = (emotion: string) => {
    switch (emotion) {
      case 'Happy': return 'text-green-600 bg-green-100';
      case 'Neutral': return 'text-gray-600 bg-gray-100';
      case 'Bored': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getAttentionColor = (attention: number) => {
    if (attention >= 80) return 'text-green-600';
    if (attention >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading meetings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Meeting Management</h1>
        <p className="text-gray-600">Manage your classroom meetings and track student participation</p>
      </div>

      {meetings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No meetings yet</h3>
          <p className="text-gray-600">Create your first meeting to get started</p>
        </div>
      ) : (
        <div className="space-y-6">
          {meetings.map((meeting) => (
            <div key={meeting.id} className="bg-white rounded-lg border shadow-sm">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Meeting Code</div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-mono font-bold text-blue-600 tracking-wider">
                            {meeting.code}
                          </span>
                          <button
                            onClick={() => copyToClipboard(meeting.code)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                            title="Copy code"
                          >
                            <Copy className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          meeting.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {meeting.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <UserCheck className="w-4 h-4" />
                        <span>Teacher: {meeting.teacher_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>Created: {new Date(meeting.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Activity className="w-4 h-4" />
                        <button
                          onClick={() => toggleParticipants(meeting.id)}
                          className="hover:text-blue-600 transition-colors"
                        >
                          {showParticipants === meeting.id ? 'Hide' : 'Show'} Participants
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => joinMeeting(meeting)}
                      className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
                    >
                      Join
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => toggleMeetingStatus(meeting)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title={meeting.is_active ? 'Deactivate meeting' : 'Activate meeting'}
                    >
                      {meeting.is_active ? (
                        <EyeOff className="w-5 h-5 text-gray-600" />
                      ) : (
                        <Eye className="w-5 h-5 text-gray-600" />
                      )}
                    </button>
                    <button
                      onClick={() => deleteMeeting(meeting.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete meeting"
                    >
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </button>
                  </div>
                </div>

                {showParticipants === meeting.id && (
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Participants</h3>
                    
                    {participantsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                    ) : participants.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No participants yet
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 px-4">Student Name</th>
                              <th className="text-left py-2 px-4">Joined At</th>
                              <th className="text-left py-2 px-4">Attention</th>
                              <th className="text-left py-2 px-4">Emotion</th>
                            </tr>
                          </thead>
                          <tbody>
                            {participants.map((participant) => (
                              <tr key={participant.id} className="border-b hover:bg-gray-50">
                                <td className="py-3 px-4 font-medium">{participant.name}</td>
                                <td className="py-3 px-4 text-gray-600">
                                  {new Date(participant.joined_at).toLocaleString()}
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`font-medium ${getAttentionColor(participant.attention)}`}>
                                    {participant.attention}%
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEmotionColor(participant.emotion)}`}>
                                    {participant.emotion}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MeetingManager;
