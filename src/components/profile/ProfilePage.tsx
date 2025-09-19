import React from 'react';
import { useParams } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';

interface ProfilePageProps {
  username?: string;
  userAddress?: string;
}

export default function ProfilePage({ username: propUsername, userAddress }: ProfilePageProps) {
  const { username: urlUsername } = useParams<{ username: string }>();
  const { userProfile, isLoading } = useProfile();
  
  const displayUsername = propUsername || urlUsername || 'Unknown';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Profile: {displayUsername}</h1>
        
        {userProfile ? (
          <div className="bg-card rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">User Profile</h2>
            <p className="text-muted-foreground">Profile data will be displayed here...</p>
            <pre className="mt-4 text-sm bg-muted p-4 rounded overflow-auto">
              {JSON.stringify(userProfile, null, 2)}
            </pre>
          </div>
        ) : (
          <div className="bg-card rounded-lg p-6 shadow-lg text-center">
            <h2 className="text-xl font-semibold mb-4">No Profile Found</h2>
            <p className="text-muted-foreground mb-4">
              This user hasn't created a profile yet or the profile couldn't be loaded.
            </p>
            <button 
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              onClick={() => {}}
            >
              Create Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
