import type { Metadata } from "next";
import { Jua } from "next/font/google";
import "./globals.css";
// @import url("@mdi/font/css/materialdesignicons.css");

const juaSans = Jua({
  weight: "400",
});

export const metadata: Metadata = {
  title: "FuitBooth - Your Virtual Photobooth Anywhere",
  description: "Your own digital photobooth. Snap, save, share. Anywhere, anytime.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${juaSans.className}`}
      >
        {children}
      </body>
    </html>
  );
}
