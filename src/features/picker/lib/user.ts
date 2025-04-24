import { cookies } from 'next/headers';
import { getIronSession, type IronSessionData } from 'iron-session'; // Import IronSessionData
import { sessionOptions, type UserProfile } from '@/lib/session'; // Import options and UserProfile type

export interface InstagramUserResponse { // Keep this definition
    id: string;
    username: string;
    profile_picture_url?: string;
    error?: { message: string };
}

export async function getUserData(): Promise<{ user: UserProfile | null; error: string | null }> {
    console.log("--- getUserData: Attempting to read session ---");
    const session = await getIronSession<IronSessionData>(await cookies(), sessionOptions);
  
    console.log("getUserData: Session content:", JSON.stringify(session, null, 2));
    const accessToken = session.ig_access_token;
    const userIdFromSession = session.ig_user_id;
    console.log(`getUserData: Found Token: ${!!accessToken}, Found Session UserID: ${!!userIdFromSession}`);
  
    if (!accessToken) { // Only need the token now for the /me request
        console.log("getUserData: No access token in session. Returning null user.");
        return { user: null, error: null };
    }
  
    console.log(`getUserData: Attempting to fetch profile using /me endpoint`);
      try {
          const fields = 'id,username,profile_picture_url'; // Let's try requesting profile pic again via /me
          // const fields = 'id,username'; // Or stick to basic fields if profile_pic fails
  
          // --- MODIFIED URL: Use /me ---
          const userApiUrl = `https://graph.instagram.com/me?fields=${fields}&access_token=${accessToken}`;
          // --- END MODIFIED URL ---
  
          console.log("getUserData: Fetching URL:", userApiUrl);
  
          const userResponse = await fetch(userApiUrl, { cache: 'no-store' });
  
          console.log("getUserData: Profile fetch status:", userResponse.status);
          console.log("getUserData: Profile fetch status text:", userResponse.statusText);
  
          if (!userResponse.ok) {
              let errorBody = "Unknown error";
              try {
                  errorBody = await userResponse.text();
                  const errorJson = JSON.parse(errorBody);
                  const errorMessage = errorJson?.error?.message || errorBody;
                  console.error('getUserData: Profile fetch failed with status', userResponse.status, 'Body:', errorBody);
                  return { user: null, error: `Failed to fetch profile: ${errorMessage} (Status: ${userResponse.status})` };
              } catch (error) {
                console.error('getUserData: Profile fetch failed with status', userResponse.status, 'Could not parse error body:', errorBody, 'Error:', error);
                return { user: null, error: `Failed to fetch profile. Status: ${userResponse.status}, Body: ${errorBody}` };
              }
          }
  
          const userData = await userResponse.json();
          console.log("getUserData: Profile fetch OK response (/me):", JSON.stringify(userData, null, 2));
  
          const userProfile: UserProfile = {
              id: String(userData.id), // ID comes from the /me response
              username: userData.username,
              profile_picture_url: userData.profile_picture_url,
          };
          console.log("getUserData: Successfully fetched profile via /me. Returning user:", userProfile.username);
          return { user: userProfile, error: null };
  
      } catch (error) {
          console.error('getUserData: Error during profile fetch execution:', error);
          return { user: null, error: 'Failed to load user data due to a network or server error during fetch execution.' };
      }
  }