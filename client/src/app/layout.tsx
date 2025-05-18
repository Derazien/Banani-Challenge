import { inter } from "@/lib/fonts"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Create Table",
  description: "Create Table",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`min-h-screen bg-background antialiased ${inter.className}`}>
        {children}
      </body>
    </html>
  )
}
