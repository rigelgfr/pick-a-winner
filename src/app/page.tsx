import { getUserData } from "@/features/picker/lib/user"
import PickerPage from "@/features/picker/components/PickerPage";
import LandingPage from "@/features/landing/components/LandingPage";

export default async function Home() {
  const { user, error: serverError } = await getUserData();

  if (serverError) {
    console.error("Error loading user data for page:", serverError);
    // Optionally render an error state or fall back to LandingPage
    // For now, falling back to LandingPage if fetch fails
  }

  return (
    <>
      {/* <ErrorDisplay urlError={urlError} /> If needed and adapted */}
      {serverError && <p style={{ color: 'red', textAlign: 'center' }}>Error checking login status: {serverError}</p>}

      {user ? (
          // If user exists (logged in), show the Picker UI
          <PickerPage user={user} />
      ) : (
          // If user is null (logged out or error fetching), show the Landing Page
          <LandingPage />
      )}
    </>
  )
}
