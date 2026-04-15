import { meetingService } from '@/services/meetingService';

export const debugMeetingService = async () => {
  console.log('Testing meeting service...');
  
  // Test code generation
  const code1 = meetingService.generateMeetingCode();
  const code2 = meetingService.generateMeetingCode();
  const code3 = meetingService.generateMeetingCode();
  
  console.log('Generated codes:', { code1, code2, code3 });
  console.log('Code lengths:', { 
    code1: code1.length, 
    code2: code2.length, 
    code3: code3.length 
  });
  
  // Test meeting creation
  try {
    const result = await meetingService.createMeeting({
      teacher_name: 'Test Teacher'
    });
    
    console.log('Meeting creation result:', result);
    
    if (result.success && result.data) {
      console.log('Created meeting:', {
        id: result.data.id,
        code: result.data.code,
        codeLength: result.data.code?.length,
        teacher_name: result.data.teacher_name
      });
    }
  } catch (error) {
    console.error('Meeting creation error:', error);
  }
};

export default debugMeetingService;
