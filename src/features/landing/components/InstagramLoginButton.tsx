'use client'

import React, { useState } from 'react'; // Import useState
import { Button } from '@/components/ui/button';
import { Instagram } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

type InstagramLoginButtonProps = {
  variant?: 'header' | 'landing';
};

const InstagramLoginButton: React.FC<InstagramLoginButtonProps> = ({
  variant = 'header',
}) => {
    const [isLoading, setIsLoading] = useState(false); // Add loading state

    const handleLogin = async () => {
        setIsLoading(true); // Set loading
        try {
            // Call the backend endpoint to get the auth URL and set the state cookie
            const response = await fetch('/api/auth/start'); // Use GET
            const data = await response.json();

            if (!response.ok || !data.authorizationUrl) {
                console.error('Failed to get authorization URL:', data.error || 'Unknown error');
                alert(`Login initiation failed: ${data.error || 'Please try again.'}`);
                setIsLoading(false);
                return;
            }

            // Redirect the user to the URL provided by the backend
            window.location.href = data.authorizationUrl;
            // No need to setIsloading(false) here as the page navigates away

        } catch (error) {
            console.error('Error calling /api/auth/start:', error);
            alert('An error occurred while preparing login. Please check console.');
            setIsLoading(false);
        }
      };

    if (variant === 'landing') {
        return (
            <Button 
                size="lg" 
                className="rounded-full dark:bg-neutral-100 bg-pink-600 dark:hover:bg-neutral-200 hover:bg-pink-700 dark:text-pink-600 shadow-lg cursor-pointer"
                onClick={handleLogin}
            >
                <Instagram className="h-5 w-5" />
                <span>{isLoading ? 'Preparing Login...' : 'Log in with Instagram'}</span>
            </Button>
        );
    }

    return (
        <>
            {/* Desktop version with text */}
            <Button 
                variant="default" 
                className="rounded-full dark:bg-neutral-100 bg-pink-600 dark:hover:bg-neutral-200 hover:bg-pink-700 dark:text-pink-600 hidden sm:flex cursor-pointer"
                onClick={handleLogin}
            >
                <Instagram className="h-5 w-5" />
                <span>{isLoading ? '...' : 'Log in'}</span>
            </Button>
        
            {/* Mobile version with just icon */}
            <Button 
                variant="default" 
                className="rounded-full dark:bg-neutral-100 bg-pink-600 dark:hover:bg-neutral-200 hover:bg-pink-700 dark:text-pink-600 sm:hidden p-2 cursor-pointer"
                aria-label="Log in with Instagram"
                onClick={handleLogin}
            >
                {isLoading ? <Spinner /> : <Instagram className="h-5 w-5" />}
            </Button>
        </>
    );
};

export default InstagramLoginButton;