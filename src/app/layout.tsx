import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import Navbar from "@/components/Navbar";
import SidebarWrapper from "@/components/SidebarWrapper";
import { Toaster } from "react-hot-toast";
import { SpeedInsights } from "@vercel/speed-insights/next";
import ColorPreferenceLoader from "@/components/ColorPreferenceLoader";
import { usePathname } from 'next/navigation';

export const metadata: Metadata = {
  title: "Petnet",
  description: "A modern social media app powered by Next.js",
  icons: {
    icon: '/otis-v2.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: undefined
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="icon" href="/otis-v2.png" type="image/png" />
          <link href="https://fonts.googleapis.com/css2?family=Lobster&display=swap" rel="stylesheet" />
        </head>
        <body className="antialiased">
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
            > 
              <ColorPreferenceLoader />
              <div className="min-h-screen">
                <Navbar/>

                <main className="py-8">
                  {/* container to center the content */}
                  <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      <div className="lg:col-span-12">{children}</div>
                    </div>
                  </div>  
                </main>  
              </div> 
              <Toaster />
            </ThemeProvider>
            <SpeedInsights />
        </body>
      </html>
    </ClerkProvider>
    
  );
}
