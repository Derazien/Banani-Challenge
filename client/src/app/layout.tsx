import './globals.css'
import type { Metadata } from 'next'

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
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
