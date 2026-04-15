import { useParams } from 'react-router-dom';

const TestTeacherMeetingPage = () => {
  const { meetingCode } = useParams<{ meetingCode: string }>();
  
  console.log('TestTeacherMeetingPage - meetingCode:', meetingCode);
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Test Teacher Meeting Room</h1>
        <div className="space-y-4">
          <div>
            <span className="text-gray-600">Meeting Code:</span>
            <span className="ml-2 font-mono font-bold text-blue-600">{meetingCode}</span>
          </div>
          <div>
            <span className="text-gray-600">Status:</span>
            <span className="ml-2 text-green-600">Route Working!</span>
          </div>
          <button
            onClick={() => window.history.back()}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestTeacherMeetingPage;
