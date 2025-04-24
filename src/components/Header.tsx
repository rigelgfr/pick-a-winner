'use client'

import { Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import ThemeButton from "./ThemeButton"
import Logo from "./Logo"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import InstagramLoginButton from "@/features/landing/components/InstagramLoginButton"
import { UserProfile } from "@/lib/session"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { 
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
  } from "./ui/dropdown-menu"

// Update SessionState to expect the full UserProfile or null
interface SessionState {
    isLoggedIn: boolean;
    user: UserProfile | null; // Expect the full profile if logged in
}

export function Header() {
    const [sessionState, setSessionState] = useState<SessionState | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const router = useRouter()
    const [isScrolled, setIsScrolled] = useState(false)

    useEffect(() => {
        const fetchSessionStatus = async () => {
            setIsLoading(true);
            try {
                const response = await fetch('/api/auth/session');
                // Removed previous error handling here, relying on API response structure
                 if (!response.ok) {
                     // Handle non-200 responses if needed, but API should return structured data
                     console.error("Header fetch: API route returned non-OK status", response.status);
                      setSessionState({ isLoggedIn: false, user: null });
                 } else {
                    const data: SessionState = await response.json();
                    setSessionState(data);
                 }
            } catch (error) {
                console.error('Error fetching session status in header:', error);
                setSessionState({ isLoggedIn: false, user: null });
            } finally {
                setIsLoading(false);
            }
        };

        fetchSessionStatus();
    }, []);

    // Add scroll event listener to track when user scrolls
    useEffect(() => {
        const handleScroll = () => {
            // Check if page is scrolled more than 10px
            setIsScrolled(window.scrollY > 10)
        }

        // Add scroll event listener
        window.addEventListener('scroll', handleScroll)
        
        // Clean up the event listener on component unmount
        return () => {
            window.removeEventListener('scroll', handleScroll)
        }
    }, [])

    const handleLogout = async () => {
        setIsLoggingOut(true);
        
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
            });

            if (response.ok) {
                console.log('Logout successful on client');
                // Update session state locally to avoid an extra fetch
                setSessionState({ isLoggedIn: false, user: null });
                router.push('/'); 
            } else {
                const data = await response.json();
                alert(`Logout failed: ${data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Logout fetch error:', error);
            alert('An error occurred during logout.');
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <header className={`
            w-full p-3 sm:px-6 2xl:px-[200px]
            flex justify-between items-center
            fixed top-0 left-0 right-0 z-50
            transition-all ease-in-out
            ${isScrolled 
                ? 'bg-background border-b-2' 
                : 'bg-transparent border-b-transparent'}
        `}>
            <div className="flex items-center">
                {/* Show 'full' variant on mobile, 'short' on larger screens */}
                <div className="block sm:hidden">
                    <Logo variant="short" />
                </div>
                <div className="hidden sm:block">
                    <Logo variant="full" />
                </div>
            </div>

            <nav className="flex items-center gap-1 sm:gap-2">
                <ThemeButton />

                {/* About button - Text on desktop, icon on mobile */}
                <Button
                    variant="ghost"
                    className="rounded-full hidden sm:flex"
                    onClick={() => router.push('/about')}
                >
                    About
                </Button>
                
                <Button
                    variant="ghost"
                    className="rounded-full sm:hidden"
                    onClick={() => router.push('/about')}
                    aria-label="About"
                >
                    <Info className="h-5 w-5" />
                </Button>

                {/* Login button - With text on desktop, just icon on mobile */}
                {isLoading ? (
                    <Avatar className="animate-pulse">
                        <AvatarFallback className="bg-foreground/30">
                            <div className="w-5 h-5 rounded-full"></div>
                        </AvatarFallback>
                    </Avatar>
                ) : sessionState?.isLoggedIn && sessionState.user ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Avatar className="cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                                <AvatarImage 
                                    src={sessionState.user.profile_picture_url} 
                                    alt="User Profile Picture" 
                                    className="rounded-full" 
                                />
                                <AvatarFallback>{sessionState.user.username.charAt(0)}</AvatarFallback>
                            </Avatar>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <div className="px-2 py-1.5 text-sm font-medium">
                                @{sessionState.user.username}
                            </div>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                                className="cursor-pointer text-destructive focus:text-destructive"
                            >
                                {isLoggingOut ? 'Logging out...' : 'Log Out'}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <InstagramLoginButton variant="header"/>
                )}
                
            </nav>
        </header>
    )
}