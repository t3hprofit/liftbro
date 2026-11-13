import type { Metadata, Viewport } from "next";
import { Anton, Inter } from "next/font/google";
import { BottomNav } from "@/components/bottom-nav";
import { SwRegister } from "@/components/sw-register";
import "./globals.css";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "LiftBro",
  description: "Track your lifts. Log sets, reps, and weight — no fluff.",
  applicationName: "LiftBro",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LiftBro",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${anton.variable} ${inter.variable} antialiased`}>
        <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col">
          <header className="flex items-center justify-center px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-2">
            <span className="display text-2xl tracking-wider">
              LIFT<span className="text-primary">BRO</span>
            </span>
          </header>
          <main className="flex-1 px-4 pb-24">{children}</main>
        </div>
        <BottomNav />
        <SwRegister />
      </body>
    </html>
  );
}
