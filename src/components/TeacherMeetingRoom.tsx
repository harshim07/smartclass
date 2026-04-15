import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { meetingService, Meeting, Participant } from '@/services/meetingService';
import WebRTCManager from '@/utils/webRTC';
import { 
  Users, 
  Eye, 
  EyeOff,
  MessageSquare, 
  Hand, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff,
  PhoneOff,
  Settings,
  Monitor,
  AlertCircle,
  RefreshCw,
  UserPlus,
  UserMinus
} from 'lucide-react';

interface TeacherMeetingRoomProps {
  teacherName?: string;
}

export const TeacherMeetingRoom: React.FC<TeacherMeetingRoomProps> = ({ teacherName }) => {
  const { meetingCode } = useParams<{ meetingCode: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenShareOn, setIsScreenShareOn] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  
  const subscriptionRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const webRTCManager = useRef<WebRTCManager | null>(null);
  const audioLevelCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (meetingCode) {
      loadMeeting();
      loadParticipants();
      subscribeToUpdates();
      initializeWebRTC();
    }

    return () => {
      if (subscriptionRef.current) {
        meetingService.unsubscribeFromParticipants(subscriptionRef.current);
      }
      const currentWebRTCManager = webRTCManager.current;
      if (currentWebRTCManager) {
        currentWebRTCManager.closeAllConnections();
      }
      const currentAudioLevelCleanup = audioLevelCleanupRef.current;
      if (currentAudioLevelCleanup) {
        currentAudioLevelCleanup();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingCode]);

  const loadMeeting = async () => {
    if (!meetingCode) return;
    
    try {
      const result = await meetingService.getMeetingByCode(meetingCode);
      if (result.success && result.data) {
        setMeeting(result.data);
      } else {
        toast({
          title: "Error",
          description: result.error || "Meeting not found",
          variant: "destructive",
        });
        navigate('/teacher/manage-meetings');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load meeting",
        variant: "destructive",
      });
      navigate('/teacher/manage-meetings');
    } finally {
      setLoading(false);
    }
  };

  const loadParticipants = async () => {
    if (!meeting?.id) return;
    
    try {
      const result = await meetingService.getMeetingParticipants(meeting.id);
      if (result.success && result.data) {
        setParticipants(result.data);
      }
    } catch (error) {
      console.error('Failed to load participants:', error);
    }
  };

  const subscribeToUpdates = () => {
    if (!meeting?.id) return;
    
    subscriptionRef.current = meetingService.subscribeToParticipants(
      meeting.id,
      (payload) => {
        console.log('Teacher room - Real-time update:', payload);
        
        if (payload.eventType === 'INSERT') {
          setParticipants(prev => {
            const newParticipant = payload.new;
            const existing = prev.find(p => p.id === newParticipant.id);
            if (!existing) {
              toast({
                title: "Student Joined!",
                description: `${newParticipant.name} has joined the meeting`,
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

  const leaveMeeting = () => {
    navigate('/teacher/manage-meetings');
  };

  const toggleMeetingStatus = async () => {
    if (!meeting) return;
    
    try {
      const result = await meetingService.updateMeeting(meeting.id, {
        is_active: !meeting.is_active,
      });

      if (result.success) {
        setMeeting({ ...meeting, is_active: !meeting.is_active });
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
        description: "Failed to update meeting status",
        variant: "destructive",
      });
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

  const copyMeetingCode = async () => {
    if (meeting?.code) {
      try {
        await navigator.clipboard.writeText(meeting.code);
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
    }
  };

  const initializeWebRTC = async () => {
    try {
      webRTCManager.current = new WebRTCManager();
      
      // Initialize local stream
      const localStream = await webRTCManager.current.initializeLocalStream(isVideoOn, isMicOn);
      
      // Set local video
      if (videoRef.current) {
        videoRef.current.srcObject = localStream;
      }
      
      // Monitor audio levels
      audioLevelCleanupRef.current = webRTCManager.current.monitorAudioLevel((level) => {
        setAudioLevel(level);
      });
      
      toast({
        title: "Camera & Microphone",
        description: "Successfully initialized",
      });
    } catch (error) {
      console.error('WebRTC initialization error:', error);
      toast({
        title: "Media Access Error",
        description: "Failed to access camera or microphone",
        variant: "destructive",
      });
    }
  };

  const toggleVideo = async () => {
    const newVideoState = !isVideoOn;
    setIsVideoOn(newVideoState);
    
    if (webRTCManager.current) {
      await webRTCManager.current.toggleVideo(newVideoState);
    }
  };

  const toggleAudio = async () => {
    const newAudioState = !isMicOn;
    setIsMicOn(newAudioState);
    
    if (webRTCManager.current) {
      await webRTCManager.current.toggleAudio(newAudioState);
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (isScreenShareOn) {
        await webRTCManager.current?.stopScreenShare();
        setIsScreenShareOn(false);
      } else {
        await webRTCManager.current?.startScreenShare();
        setIsScreenShareOn(true);
      }
    } catch (error) {
      toast({
        title: "Screen Share Error",
        description: "Failed to share screen",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading teacher meeting room...</p>
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Meeting Not Found</h2>
          <p className="text-gray-600 mb-4">The meeting you're trying to join doesn't exist.</p>
          <button
            onClick={() => navigate('/teacher/manage-meetings')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Meetings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">Teacher Meeting Room</h1>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-mono font-bold text-blue-600">{meeting.code}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                meeting.is_active 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {meeting.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {participants.length} participant{participants.length !== 1 ? 's' : ''}
            </span>
            
            <button
              onClick={copyMeetingCode}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Copy meeting code"
            >
              <MessageSquare className="w-5 h-5 text-gray-600" />
            </button>
            
            <button
              onClick={toggleMeetingStatus}
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
              onClick={leaveMeeting}
              className="p-2 hover:bg-red-50 rounded-lg transition-colors"
              title="Leave meeting"
            >
              <PhoneOff className="w-5 h-5 text-red-600" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-60px)]">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Video Area */}
          <div className="flex-1 p-4">
            <div className="h-full bg-gray-900 rounded-lg flex items-center justify-center">
              {isVideoOn ? (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="text-center">
                  <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl font-bold text-blue-600">
                      {meeting.teacher_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-white text-xl font-semibold mb-2">
                    {meeting.teacher_name} (Teacher)
                  </h3>
                  <p className="text-gray-400">Camera is off</p>
                </div>
              )}
            </div>
          </div>

          {/* Teacher Controls */}
          <div className="bg-white border-t px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleAudio}
                  className={`p-3 rounded-full transition-colors ${
                    isMicOn 
                      ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' 
                      : 'bg-red-100 hover:bg-red-200 text-red-600'
                  }`}
                  title={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
                >
                  {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>
                
                <button
                  onClick={toggleVideo}
                  className={`p-3 rounded-full transition-colors ${
                    isVideoOn 
                      ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' 
                      : 'bg-red-100 hover:bg-red-200 text-red-600'
                  }`}
                  title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
                >
                  {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>
                
                <button
                  onClick={toggleScreenShare}
                  className={`p-3 rounded-full transition-colors ${
                    isScreenShareOn 
                      ? 'bg-blue-100 hover:bg-blue-200 text-blue-600' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                  title={isScreenShareOn ? 'Stop screen share' : 'Share screen'}
                >
                  <Monitor className="w-5 h-5" />
                </button>
                
                <button
                  onClick={() => setIsHandRaised(!isHandRaised)}
                  className={`p-3 rounded-full transition-colors ${
                    isHandRaised 
                      ? 'bg-blue-100 hover:bg-blue-200 text-blue-600' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                  title={isHandRaised ? 'Lower hand' : 'Raise hand'}
                >
                  <Hand className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Real-time Updates</span>
                <button
                  onClick={() => setRealtimeEnabled(!realtimeEnabled)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    realtimeEnabled ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      realtimeEnabled ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Student Grid */}
        <div className="w-96 bg-white border-l flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-600" />
                <h3 className="font-medium text-gray-900">Students</h3>
                <span className="text-sm text-gray-500">({participants.length})</span>
              </div>
              <button
                onClick={loadParticipants}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Refresh students"
              >
                <RefreshCw className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Students Grid */}
          <div className="flex-1 p-4 overflow-y-auto">
            {participants.length === 0 ? (
              <div className="text-center py-8">
                <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Yet</h3>
                <p className="text-gray-600 text-sm">
                  Students will appear here when they join with code: {meeting.code}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {participants.map((participant) => (
                  <div 
                    key={participant.id}
                    className="bg-gray-50 rounded-lg p-3 border hover:shadow-md transition-shadow"
                  >
                    {/* Student Avatar */}
                    <div className="flex items-center justify-center mb-2">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-lg font-bold text-blue-600">
                          {participant.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Student Name */}
                    <div className="text-center mb-2">
                      <h4 className="font-medium text-sm text-gray-900 truncate">
                        {participant.name}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {new Date(participant.joined_at).toLocaleTimeString()}
                      </p>
                    </div>

                    {/* Attention Level */}
                    <div className="mb-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-600">Attention</span>
                        <span className={`font-medium ${getAttentionColor(participant.attention)}`}>
                          {participant.attention}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            participant.attention >= 80 ? 'bg-green-500' :
                            participant.attention >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${participant.attention}%` }}
                        />
                      </div>
                    </div>

                    {/* Emotion */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Emotion</span>
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getEmotionColor(participant.emotion)}`}>
                        {participant.emotion}
                      </span>
                    </div>

                    {/* Online Status */}
                    <div className="flex items-center justify-center gap-1 mt-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-gray-500">Active</span>
                    </div>

                    {/* Audio Level Indicator */}
                    <div className="mt-2">
                      <div className="text-xs text-gray-500 mb-1">Microphone</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all ${
                              audioLevel > 50 ? 'bg-green-500' : 
                              audioLevel > 20 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${audioLevel}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">{Math.round(audioLevel)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherMeetingRoom;
