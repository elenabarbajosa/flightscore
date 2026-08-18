import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlightScore",
  description: "Long-haul flight search with preference-based ranking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-neutral-900 antialiased">
        {children}
      </body>
    </html>
  );
}
