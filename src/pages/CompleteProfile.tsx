import { Link } from "react-router-dom";

const CompleteProfile = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="max-w-md w-full bg-card border rounded-xl p-6 text-center space-y-3">
        <h1 className="text-xl font-bold text-foreground">Profile setup required</h1>
        <p className="text-sm text-muted-foreground">
          We could not find your role profile yet. Please sign out and sign up again, or contact support.
        </p>
        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfile;
