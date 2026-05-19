import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/Providers";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "KrishiRakshak AI | ICAR Decision Support",
  description:
    "Soil and water conservation decision support for ICAR - precision field location and erosion control measures.",
  icons: {
    icon: "/images/icar-logo.png",
    apple: "/images/icar-logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.className} bg-stone-50 text-stone-900 min-h-screen`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
