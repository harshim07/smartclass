import { MeetingGuard } from '@/components/MeetingGuard';
import MeetingRoom from '@/components/MeetingRoom';

const MeetingRoomPage = () => {
  return (
    <MeetingGuard>
      <MeetingRoom />
    </MeetingGuard>
  );
};

export default MeetingRoomPage;
