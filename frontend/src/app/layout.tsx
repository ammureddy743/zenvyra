import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthContext";
import { CreditsProvider } from "@/components/CreditsContext";
import { ToolHandoffProvider } from "@/components/ToolHandoffContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AmbientBackground } from "@/components/AmbientBackground";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zenvyra | Photo & Video Editing Studio",
  description:
    "Edit photos, trim and crop videos, restore images, and create with AI in one browser-based creative studio.",
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body className="relative min-h-full flex flex-col overflow-x-hidden text-slate-900 dark:text-slate-100">
        <AmbientBackground />
        <ThemeProvider>
          <AuthProvider>
            <CreditsProvider>
              <ToolHandoffProvider>
                <div className="relative z-10 flex min-h-full flex-col flex-1">
                  <Navbar />
                  <main className="flex-1">{children}</main>
                  <Footer />
                </div>
              </ToolHandoffProvider>
            </CreditsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
