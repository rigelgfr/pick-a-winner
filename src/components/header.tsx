'use client'

import { Facebook, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import ThemeButton from "./ThemeButton"
import Logo from "./logo"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export function Header() {
    const router = useRouter()
    const [isScrolled, setIsScrolled] = useState(false)

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

    return (
        <header className={`
            w-full py-2 px-3 sm:px-6 
            flex justify-between items-center
            fixed top-0 left-0 right-0 z-50
            transition-all ease-in-out
            ${isScrolled 
                ? 'bg-background border-b-2' 
                : 'bg-transparent border-transparent'}
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
                    className="rounded-full sm:hidden p-2"
                    onClick={() => router.push('/about')}
                    aria-label="About"
                >
                    <Info className="h-5 w-5" />
                </Button>

                {/* Login button - With text on desktop, just icon on mobile */}
                <Button 
                    variant="default" 
                    className="rounded-full bg-facebook-blue hover:bg-facebook-blue/90 text-white hidden sm:flex"
                >
                    <Facebook className="h-5 w-5" />
                    Log in
                </Button>
                
                <Button 
                    variant="default" 
                    className="rounded-full bg-facebook-blue hover:bg-facebook-blue/90 text-white sm:hidden p-2"
                    aria-label="Log in with Facebook"
                >
                    <Facebook className="h-5 w-5" />
                </Button>
            </nav>
        </header>
    )
}