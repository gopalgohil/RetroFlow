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
    icon: '/favicon_1.svg',
    shortcut: '/favicon_1.svg',
    apple: '/favicon_1.svg',
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
                  var u = localStorage.getItem('retroflow_user');
                  if (u && !document.cookie.includes('retroflow_user=')) {
                    document.cookie = 'retroflow_user=' + encodeURIComponent(u) + '; path=/; max-age=2592000; SameSite=Lax';
                  }
                  var r = localStorage.getItem('retroflow_rejected');
                  if (r === 'true' && !document.cookie.includes('retroflow_rejected=true')) {
                    document.cookie = 'retroflow_rejected=true; path=/; max-age=2592000; SameSite=Lax';
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
