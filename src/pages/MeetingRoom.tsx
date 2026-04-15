import { useParams, useSearchParams } from "react-router-dom";
import TeacherDashboard from "./TeacherDashboard";
import StudentView from "./StudentView";
import { useAuth } from "@/contexts/AuthContext";

const MeetingRoom = () => {
  const { meetingId } = useParams<{ meetingId: string }>();
  const [searchParams] = useSearchParams();
  const pid = searchParams.get("pid");
  const { profile, profileLoading } = useAuth();

  if (!meetingId) return <p className="text-center text-destructive">Invalid meeting.</p>;
  if (profileLoading) {
    return <p className="text-center text-muted-foreground">Loading profile...</p>;
  }
  if (!profile) {
    return <p className="text-center text-destructive">Profile required to access this meeting.</p>;
  }
  if (profile.role === "teacher") return <TeacherDashboard meetingId={meetingId} />;
  return <StudentView meetingId={meetingId} participantId={pid || ""} />;
};

export default MeetingRoom;
