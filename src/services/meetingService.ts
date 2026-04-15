import { supabase } from '@/integrations/supabase/client';

export interface Meeting {
  id: string;
  code: string;
  teacher_name: string;
  is_active: boolean;
  created_at: string;
}

export interface Participant {
  id: string;
  meeting_id: string;
  name: string;
  attention: number;
  emotion: 'Happy' | 'Neutral' | 'Bored';
  joined_at: string;
  updated_at: string;
}

export interface CreateMeetingData {
  teacher_name: string;
}

export interface JoinMeetingData {
  meeting_code: string;
  student_name: string;
}

export interface MeetingResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export const meetingService = {
  // Create a new meeting (teacher only)
  async createMeeting(meetingData: CreateMeetingData): Promise<MeetingResponse> {
    try {
      // Generate unique 6-character meeting code
      const code = this.generateMeetingCode();

      const { data, error } = await supabase
        .from('meetings')
        .insert({
          ...meetingData,
          code, // Use our generated 6-character code
        })
        .select('*')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create meeting' 
      };
    }
  },

  // Get all meetings
  async getAllMeetings(): Promise<MeetingResponse> {
    try {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch meetings' 
      };
    }
  },

  // Get meeting by code (for students to join)
  async getMeetingByCode(meetingCode: string): Promise<MeetingResponse> {
    try {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('code', meetingCode.toUpperCase())
        .single();

      if (error) {
        return { success: false, error: 'Invalid meeting code' };
      }

      return { success: true, data };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to find meeting' 
      };
    }
  },

  // Join a meeting (student only)
  async joinMeeting(joinData: JoinMeetingData): Promise<MeetingResponse> {
    try {
      // First get the meeting
      const meetingResult = await this.getMeetingByCode(joinData.meeting_code);
      if (!meetingResult.success) {
        return meetingResult;
      }

      const meeting = meetingResult.data;

      // Check if meeting is active
      if (!meeting.is_active) {
        return { success: false, error: 'Meeting is not active' };
      }

      // Add student to participants
      const { data, error } = await supabase
        .from('participants')
        .insert({
          meeting_id: meeting.id,
          name: joinData.student_name,
        })
        .select('*')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: { ...data, meeting } };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to join meeting' 
      };
    }
  },

  // Get meeting participants
  async getMeetingParticipants(meetingId: string): Promise<MeetingResponse> {
    try {
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .eq('meeting_id', meetingId)
        .order('joined_at', { ascending: true });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch participants' 
      };
    }
  },

  // Update meeting (teacher only)
  async updateMeeting(meetingId: string, updateData: Partial<Meeting>): Promise<MeetingResponse> {
    try {
      const { data, error } = await supabase
        .from('meetings')
        .update(updateData)
        .eq('id', meetingId)
        .select('*')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update meeting' 
      };
    }
  },

  // Delete meeting (teacher only)
  async deleteMeeting(meetingId: string): Promise<MeetingResponse> {
    try {
      const { error } = await supabase
        .from('meetings')
        .delete()
        .eq('id', meetingId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete meeting' 
      };
    }
  },

  // Update participant data (for real-time updates)
  async updateParticipant(participantId: string, updateData: Partial<Participant>): Promise<MeetingResponse> {
    try {
      const { data, error } = await supabase
        .from('participants')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', participantId)
        .select('*')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update participant' 
      };
    }
  },

  // Leave meeting (student only)
  async leaveMeeting(participantId: string): Promise<MeetingResponse> {
    try {
      const { error } = await supabase
        .from('participants')
        .delete()
        .eq('id', participantId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to leave meeting' 
      };
    }
  },

  // Generate a unique 6-character meeting code
  generateMeetingCode(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code.toUpperCase();
  },

  // Subscribe to real-time participant updates for a meeting
  subscribeToParticipants(meetingId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`participants:${meetingId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participants',
          filter: `meeting_id=eq.${meetingId}`,
        },
        callback
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });
  },

  // Unsubscribe from real-time updates
  unsubscribeFromParticipants(subscription: any) {
    supabase.removeChannel(subscription);
  },
};
