import { useState, useEffect } from 'react';
import { meetingService } from '@/services/meetingService';
import { useToast } from '@/hooks/use-toast';

const DebugPage = () => {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [testResult, setTestResult] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    try {
      const result = await meetingService.getAllMeetings();
      if (result.success) {
        setMeetings(result.data || []);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to load meetings",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load meetings",
        variant: "destructive",
      });
    }
  };

  const testCreateMeeting = async () => {
    try {
      const result = await meetingService.createMeeting({
        teacher_name: 'Debug Teacher'
      });
      
      setTestResult(result);
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Meeting created successfully",
        });
        loadMeetings(); // Reload meetings
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
        description: "Failed to create meeting",
        variant: "destructive",
      });
    }
  };

  const generateTestCode = () => {
    const code = meetingService.generateMeetingCode();
    console.log('Generated code:', code);
    console.log('Code length:', code.length);
    return code;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Meeting System Debug</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Test Controls */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Test Controls</h2>
          
          <div className="space-y-4">
            <button
              onClick={testCreateMeeting}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Test Meeting
            </button>
            
            <button
              onClick={generateTestCode}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Generate Test Code
            </button>
            
            <button
              onClick={loadMeetings}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Reload Meetings
            </button>
          </div>
          
          {testResult && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2">Last Test Result:</h3>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Existing Meetings */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">
            Existing Meetings ({meetings.length})
          </h2>
          
          {meetings.length === 0 ? (
            <p className="text-gray-500">No meetings found</p>
          ) : (
            <div className="space-y-2">
              {meetings.map((meeting) => (
                <div key={meeting.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium">Code: {meeting.code}</div>
                  <div className="text-sm text-gray-600">
                    Length: {meeting.code?.length} characters
                  </div>
                  <div className="text-sm text-gray-600">
                    Teacher: {meeting.teacher_name}
                  </div>
                  <div className="text-sm text-gray-600">
                    Created: {new Date(meeting.created_at).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">
                    Active: {meeting.is_active ? 'Yes' : 'No'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DebugPage;
