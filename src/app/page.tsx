import Image from "next/image"
import Link from "next/link"
import { Facebook } from "lucide-react"
import { Button } from "@/components/ui/button"
import Logo from "@/components/logo"

export default function Home() {
  return (
    <div className="container flex flex-col items-center justify-center max-w-3xl mx-auto py-12 px-4 space-y-10">
      <div className="w-full max-w-md mx-auto">
        <Image
          src="/placeholder.svg?height=300&width=300"
          alt="pickAwinner Illustration"
          width={300}
          height={100}
          className="mx-auto"
          priority
        />
      </div>

      <div className="text-center space-y-6">
        <span className="flex items-center justify-center">
          <Logo className="text-3xl"/>
        </span>

        <p className="text-lg text-muted-foreground">
          pickAwinner utilizes Meta&apos;s Graph API to read comments from your Instagram giveaway post to draw random winners.
        </p>

        <div className="pt-2">
          <Link
            href="/about"
            className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
          >
            Learn how to set up your Facebook and Instagram accounts to use this app
          </Link>
        </div>

        <div className="pt-4">
          <Button size="lg" className="rounded-full bg-facebook-blue hover:bg-facebook-blue/90 text-white">
            <Facebook className="h-5 w-5" />
            Log in with Facebook
          </Button>
        </div>
      </div>
    </div>
  )
}
