import { useState, useEffect, useRef } from 'react';
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
  Video,
  VideoOff,
  Mic,
  MicOff,
  Hand,
  Smile,
  Meh,
  Frown,
  AlertCircle,
  RefreshCw,
  ArrowRight
} from 'lucide-react';

interface TeacherDashboardProps {
  meetingId?: string;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ meetingId: propMeetingId }) => {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [showParticipants, setShowParticipants] = useState<string | null>(null);
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchMeetings();
    
    return () => {
      if (subscriptionRef.current) {
        meetingService.unsubscribeFromParticipants(subscriptionRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedMeeting && realtimeEnabled) {
      subscribeToUpdates();
    }
    
    return () => {
      if (subscriptionRef.current) {
        meetingService.unsubscribeFromParticipants(subscriptionRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMeeting, realtimeEnabled]);

  const fetchMeetings = async () => {
    try {
      const result = await meetingService.getAllMeetings();
      if (result.success && result.data) {
        setMeetings(result.data);
        
        // Auto-select first meeting if no meeting is selected
        if (!selectedMeeting && result.data.length > 0) {
          setSelectedMeeting(result.data[0]);
        }
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

  const subscribeToUpdates = () => {
    if (!selectedMeeting?.id) return;
    
    subscriptionRef.current = meetingService.subscribeToParticipants(
      selectedMeeting.id,
      (payload) => {
        console.log('Real-time update:', payload);
        
        if (payload.eventType === 'INSERT') {
          setParticipants(prev => {
            const newParticipant = payload.new;
            const existing = prev.find(p => p.id === newParticipant.id);
            if (!existing) {
              toast({
                title: "New Student Joined!",
                description: `${newParticipant.name} has joined the meeting`,
                action: (
                  <button
                    onClick={() => {
                      // Scroll to the new student
                      const element = document.getElementById(`student-${newParticipant.id}`);
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        element.classList.add('ring-2', 'ring-green-500', 'ring-opacity-50');
                        setTimeout(() => {
                          element.classList.remove('ring-2', 'ring-green-500', 'ring-opacity-50');
                        }, 2000);
                      }
                    }}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    View
                  </button>
                ),
              });
              return [...prev, newParticipant];
            }
            return prev;
          });
        } else if (payload.eventType === 'UPDATE') {
          setParticipants(prev => 
            prev.map(p => p.id === payload.new.id ? payload.new : p)
          );
        } else if (payload.eventType === 'DELETE') {
          setParticipants(prev => {
            const deleted = prev.find(p => p.id === payload.old.id);
            if (deleted) {
              toast({
                title: "Student Left",
                description: `${deleted.name} has left the meeting`,
                variant: "destructive",
              });
            }
            return prev.filter(p => p.id !== payload.old.id);
          });
        }
      }
    );
  };

  const selectMeeting = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setShowParticipants(meeting.id);
    fetchParticipants(meeting.id);
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
        if (selectedMeeting?.id === meeting.id) {
          setSelectedMeeting({ ...selectedMeeting, is_active: !meeting.is_active });
        }
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

  const getEmotionIcon = (emotion: string) => {
    switch (emotion) {
      case 'Happy': return <Smile className="w-4 h-4" />;
      case 'Neutral': return <Meh className="w-4 h-4" />;
      case 'Bored': return <Frown className="w-4 h-4" />;
      default: return <Meh className="w-4 h-4" />;
    }
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

  const getAttentionLevel = (attention: number) => {
    if (attention >= 80) return 'High';
    if (attention >= 60) return 'Medium';
    return 'Low';
  };

  const refreshParticipants = () => {
    if (selectedMeeting) {
      fetchParticipants(selectedMeeting.id);
    }
  };

  const joinMeeting = (meeting: Meeting) => {
    navigate(`/teacher/meeting/${meeting.code}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading teacher dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
            <p className="text-gray-600">Monitor student participation in real-time</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Real-time Updates</span>
              <button
                onClick={() => setRealtimeEnabled(!realtimeEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  realtimeEnabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    realtimeEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            <button
              onClick={refreshParticipants}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh participants"
            >
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {meetings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No meetings yet</h3>
            <p className="text-gray-600 mb-4">Create your first meeting to start monitoring students</p>
            <button
              onClick={() => window.location.href = '/teacher/create-meeting'}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Meeting
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Meetings List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border">
                <div className="p-4 border-b">
                  <h2 className="font-semibold text-gray-900">Active Meetings</h2>
                </div>
                <div className="divide-y">
                  {meetings.map((meeting) => (
                    <div
                      key={meeting.id}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedMeeting?.id === meeting.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => selectMeeting(meeting)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-mono font-bold text-blue-600">
                          {meeting.code}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          meeting.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {meeting.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => joinMeeting(meeting)}
                          className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                        >
                          Join Meeting
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-sm text-gray-600">
                        {meeting.teacher_name}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(meeting.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Student Faces Grid */}
            <div className="lg:col-span-2">
              {selectedMeeting ? (
                <div className="bg-white rounded-lg border">
                  <div className="p-4 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="font-semibold text-gray-900">
                          Student Participants - {selectedMeeting.code}
                        </h2>
                        <p className="text-sm text-gray-600">
                          {participants.length} student{participants.length !== 1 ? 's' : ''} joined
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyToClipboard(selectedMeeting.code)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Copy meeting code"
                        >
                          <Copy className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => toggleMeetingStatus(selectedMeeting)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title={selectedMeeting.is_active ? 'Deactivate meeting' : 'Activate meeting'}
                        >
                          {selectedMeeting.is_active ? (
                            <EyeOff className="w-4 h-4 text-gray-600" />
                          ) : (
                            <Eye className="w-4 h-4 text-gray-600" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    {participantsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                    ) : participants.length === 0 ? (
                      <div className="text-center py-12">
                        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No students yet</h3>
                        <p className="text-gray-600">
                          Students will appear here when they join the meeting using code: {selectedMeeting.code}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {participants.map((participant) => (
                          <div 
                            key={participant.id} 
                            id={`student-${participant.id}`}
                            className="bg-gray-50 rounded-lg p-4 border transition-all duration-300 hover:shadow-md"
                          >
                            {/* Student Avatar */}
                            <div className="flex items-center justify-center mb-3">
                              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-xl font-bold text-blue-600">
                                  {participant.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>

                            {/* Student Name */}
                            <div className="text-center mb-3">
                              <h3 className="font-medium text-gray-900">{participant.name}</h3>
                              <p className="text-xs text-gray-500">
                                Joined {new Date(participant.joined_at).toLocaleTimeString()}
                              </p>
                            </div>

                            {/* Attention Level */}
                            <div className="mb-2">
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span className="text-gray-600">Attention</span>
                                <span className={`font-medium ${getAttentionColor(participant.attention)}`}>
                                  {participant.attention}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all ${
                                    participant.attention >= 80 ? 'bg-green-500' :
                                    participant.attention >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${participant.attention}%` }}
                                />
                              </div>
                            </div>

                            {/* Emotion */}
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Emotion</span>
                              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getEmotionColor(participant.emotion)}`}>
                                {getEmotionIcon(participant.emotion)}
                                <span>{participant.emotion}</span>
                              </div>
                            </div>

                            {/* Status Indicators */}
                            <div className="flex items-center justify-center gap-2 mt-3">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Online"></div>
                              <span className="text-xs text-gray-500">Active</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg border p-8 text-center">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Meeting</h3>
                  <p className="text-gray-600">
                    Choose a meeting from the list to view participating students
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
