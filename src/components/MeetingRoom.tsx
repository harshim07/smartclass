import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { meetingService, Meeting, Participant } from '@/services/meetingService';
import WebRTCManager from '@/utils/webRTC';
import { 
  Users, 
  Eye, 
  MessageSquare, 
  Hand, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff,
  PhoneOff,
  Settings
} from 'lucide-react';

interface MeetingRoomProps {
  participantId?: string;
}

export const MeetingRoom: React.FC<MeetingRoomProps> = ({ participantId }) => {
  const { meetingCode } = useParams<{ meetingCode: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [attention, setAttention] = useState(75);
  const [emotion, setEmotion] = useState<'Happy' | 'Neutral' | 'Bored'>('Neutral');
  const [audioLevel, setAudioLevel] = useState(0);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const subscriptionRef = useRef<any>(null);
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

  useEffect(() => {
    // Simulate attention and emotion changes more frequently for real-time updates
    const interval = setInterval(() => {
      setAttention(prev => {
        const change = (Math.random() - 0.5) * 15;
        const newValue = prev + change;
        return Math.max(0, Math.min(100, Math.round(newValue)));
      });
      
      const emotions: ('Happy' | 'Neutral' | 'Bored')[] = ['Happy', 'Neutral', 'Bored'];
      setEmotion(emotions[Math.floor(Math.random() * emotions.length)]);
    }, 3000); // Update every 3 seconds for more dynamic changes

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Update participant data in database
    if (participantId && meeting) {
      meetingService.updateParticipant(participantId, {
        attention,
        emotion,
      });
    }
  }, [attention, emotion, participantId, meeting]);

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
        navigate('/join-meeting');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load meeting",
        variant: "destructive",
      });
      navigate('/join-meeting');
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
        if (payload.eventType === 'INSERT') {
          setParticipants(prev => [...prev, payload.new]);
        } else if (payload.eventType === 'UPDATE') {
          setParticipants(prev => 
            prev.map(p => p.id === payload.new.id ? payload.new : p)
          );
        } else if (payload.eventType === 'DELETE') {
          setParticipants(prev => prev.filter(p => p.id !== payload.old.id));
        }
      }
    );
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

  const leaveMeeting = async () => {
    if (participantId) {
      await meetingService.leaveMeeting(participantId);
    }
    if (webRTCManager.current) {
      webRTCManager.current.closeAllConnections();
    }
    navigate('/join-meeting');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading meeting room...</p>
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
            onClick={() => navigate('/join-meeting')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
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
            <h1 className="text-lg font-semibold">{meeting.teacher_name}'s Meeting</h1>
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
                  <VideoOff className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Camera is off</p>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white border-t px-4 py-3">
            <div className="flex items-center justify-center gap-4">
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
                onClick={() => setIsVideoOn(!isVideoOn)}
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
              
              <button
                className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                title="Settings"
              >
                <Settings className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-white border-l flex flex-col">
          {/* Student Status */}
          <div className="p-4 border-b">
            <h3 className="font-medium text-gray-900 mb-3">Your Status</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Attention Level</span>
                <span className={`font-medium ${getAttentionColor(attention)}`}>
                  {attention}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Emotion</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEmotionColor(emotion)}`}>
                  {emotion}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Hand Raised</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  isHandRaised ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {isHandRaised ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Online"></div>
            <span className="text-xs text-gray-500">Active</span>
          </div>

          {/* Audio Level Indicator */}
          <div className="mt-2">
            <div className="text-xs text-gray-500 mb-1">Microphone</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    audioLevel > 50 ? 'bg-green-500' : 
                    audioLevel > 20 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${audioLevel}%` }}
                />
              </div>
              <span className="text-xs text-gray-600">{Math.round(audioLevel)}%</span>
            </div>
          </div>

          {/* Participants List */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-gray-600" />
              <h3 className="font-medium text-gray-900">Participants</h3>
              <span className="text-sm text-gray-500">({participants.length})</span>
            </div>
            
            <div className="space-y-2">
              {participants.map((participant) => (
                <div key={participant.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600">
                      {participant.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{participant.name}</div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`font-medium ${getAttentionColor(participant.attention)}`}>
                        {participant.attention}%
                      </span>
                      <span className={`px-1 py-0.5 rounded text-xs ${getEmotionColor(participant.emotion)}`}>
                        {participant.emotion}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingRoom;
