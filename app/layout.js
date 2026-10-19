import "./globals.css";
import PwaRegister from "../components/PwaRegister";

export const metadata = {
  title: {
    default: "LudoVerse — Classic Ludo",
    template: "%s — LudoVerse",
  },
  description:
    "Roll the dice. Bring your tokens home. Classic Ludo for 2, 3 and 4 players — play offline with friends and family.",
  applicationName: "LudoVerse",
  keywords: ["ludo", "classic ludo", "board game", "dice game", "ludoverse", "offline board game"],
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LudoVerse",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: "LudoVerse",
    title: "LudoVerse — Classic Ludo",
    description: "Roll the dice. Bring your tokens home. Classic Ludo for 2, 3 and 4 players.",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "LudoVerse — Classic Ludo",
    description: "Roll the dice. Bring your tokens home. Classic Ludo for 2, 3 and 4 players.",
  },
};

export const viewport = {
  themeColor: "#E53935",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-50 text-zinc-900 antialiased">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
