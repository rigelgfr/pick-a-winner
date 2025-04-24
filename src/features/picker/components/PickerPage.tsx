import React from 'react';
import { UserProfile } from '@/lib/session'; // Adjust path if needed

interface PickerPageProps {
  user: UserProfile;
}

const PickerPage: React.FC<PickerPageProps> = ({ user }) => {
  return (
    <div>
      <h1>Instagram Comment Picker</h1>
      {/* Maybe display errors passed down if needed */}
      <div>
        <h2>Welcome, {user.username}!</h2>
        {user.profile_picture_url && (
          <img
            src={user.profile_picture_url}
            alt={`${user.username}'s profile`}
            style={{ width: '100px', height: '100px', borderRadius: '50%' }}
          />
        )}
        {/* Use the correct IBID for display/use */}
        <p>Your Instagram Business ID: {user.id}</p>
      </div>
      <hr style={{ margin: '20px 0' }}/>
      <div>
        {/* TODO: Add Post selection and comment fetching UI here */}
        <p>Next steps: Select a post to fetch comments.</p>
      </div>
    </div>
  );
};

export default PickerPage;