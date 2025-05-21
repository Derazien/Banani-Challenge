import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// import { WavyBackground } from "@/components/ui/wavy-background"; // Remove WavyBackground
import { Boxes } from "@/components/ui/background-boxes"; // Import Boxes
import { cn } from "@/lib/utils"; // Import cn for className utility

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "Banani Test Challenge",
  description: "Generate custom tables with a simple prompt",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("dark", inter.variable)}><head />
      <body className="min-h-screen font-sans antialiased overflow-x-hidden bg-slate-700 text-slate-200">
        <div className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden rounded-lg bg-slate-700">
          <div className="pointer-events-none absolute inset-0 z-20 h-full w-full bg-slate-700 [mask-image:radial-gradient(ellipse_at_center,transparent_30%,black)]" />
          <Boxes />
          <div className="relative z-20">
             {children}
          </div>
        </div>
      </body>
    </html>
  );
}
