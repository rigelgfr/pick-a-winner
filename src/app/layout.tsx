import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Free giveaway picker | pickAwinner",
  description: "Easily pick random winners from your Instagram giveaway posts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={inter.className}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Header />
          <main className="min-h-screen pt-16 sm:px-6 2xl:px-[200px]">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
