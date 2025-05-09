import Logo from "@/components/Logo";
import Link from "next/link";
import InstagramLoginButton from "./InstagramLoginButton";

const LandingPage: React.FC = () => {
    return (
        <div className="container flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] max-w-3xl mx-auto px-4 space-y-10">
          <div className="text-center space-y-6">
            <span className="flex items-center justify-center">
              <Logo className="text-4xl"/>
            </span>
    
            <p className="text-lg">
              pickAwinner utilizes Meta&apos;s Graph API to read comments from your Instagram giveaway post and draw random winners.
            </p>
    
            <div className="pt-2">
              <Link
                href="/about"
                className="text-sm text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
              >
                Learn more about pickAwinner and if you are eligible to use it
              </Link>
            </div>
    
            <div className="pt-4">
              <InstagramLoginButton variant="landing" />
            </div>
          </div>
        </div>
    )
}

export default LandingPage;