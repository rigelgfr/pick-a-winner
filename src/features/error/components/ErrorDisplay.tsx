// app/picker/ErrorDisplay.tsx
"use client"; // This component uses hooks

import React, { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

// REMOVED: No urlError prop needed
// interface ErrorDisplayProps {
//     urlError: string | null;
// }

const ErrorDisplay: React.FC = () => { // Removed props
  const router = useRouter();
  const searchParams = useSearchParams(); // Hook to read current URL params

  useEffect(() => {
    // Read the error parameter directly using the hook
    const errorToShow = searchParams.get('error');

    if (errorToShow) {
      // Use your preferred method to show the error
      alert(`Login Error: ${decodeURIComponent(errorToShow)}`);

      // Clean the URL by removing the error parameter
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete('error');
      // Use router.replace to update URL without page reload
      // Keep existing search params, just remove 'error'
      router.replace(`/picker?${newSearchParams.toString()}`, { scroll: false });
    }
    // Dependency array includes searchParams to re-run if URL params change client-side
  }, [searchParams, router]);

  // This component doesn't render anything itself
  return null;
};

export default ErrorDisplay;