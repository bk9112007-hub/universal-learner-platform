import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://universalleaner.myshopify.com"),
  title: {
    default: "Universal Learner Platform",
    template: "%s | Universal Learner"
  },
  description:
    "A premium education platform that combines tutoring, project-based learning, progress tracking, and Shopify-powered programs.",
  openGraph: {
    title: "Universal Learner Platform",
    description:
      "Premium tutoring, PBL dashboards, parent visibility, and secure enrollment workflows in one full-stack experience.",
    type: "website"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-body text-ink antialiased">{children}</body>
    </html>
  );
}
