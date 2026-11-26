import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthContext";
import { CreditsProvider } from "@/components/CreditsContext";
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
  title: "Zenvyra — Full-Resolution AI Photo Studio",
  description:
    "AI photo-editing platform with background removal, upscaling, object removal, restoration, and passport photo tools.",
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
      <body className="relative min-h-full flex flex-col overflow-x-hidden bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <AmbientBackground />
        <ThemeProvider>
          <AuthProvider>
            <CreditsProvider>
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </CreditsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
