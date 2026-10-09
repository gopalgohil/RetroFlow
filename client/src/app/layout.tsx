import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Digiflux | Agile Retrospectives & Sprint Management",
  description: "Collaborative Agile Retrospectives & Sprint Delivery Platform",
  icons: {
    icon: [
      { url: '/favicon.ico?v=digiflux', sizes: 'any' },
      { url: '/icon.svg?v=digiflux', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico?v=digiflux',
    apple: '/apple-icon.png?v=digiflux',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="icon" href="/favicon.ico?v=digiflux" sizes="any" />
        <link rel="icon" href="/icon.svg?v=digiflux" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-icon.png?v=digiflux" />
        <link rel="shortcut icon" href="/favicon.ico?v=digiflux" />
        <meta name="theme-color" content="#5cb028" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('retroflow_theme');
                  var theme = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                  document.documentElement.setAttribute('data-theme', theme);
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>{children}</body>
    </html>
  );
}
