import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { LanguageProvider } from "@/components/providers/language-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BD Tax Calculator | Bangladesh Income Tax Calculator",
  description:
    "Calculate your Bangladesh income tax easily. Free tax calculator for Bangladeshi taxpayers with detailed breakdown by tax slabs.",
  keywords: [
    "Bangladesh tax calculator",
    "BD tax",
    "income tax Bangladesh",
    "tax calculator",
    "BDT tax",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* General Sans from Fontshare - English titles */}
        <link
          href="https://api.fontshare.com/v2/css?f[]=general-sans@500,600,700&display=swap"
          rel="stylesheet"
        />
        {/* July Font for Bangla body */}
        <link
          href="https://cdn.jsdelivr.net/gh/Taraldinn/soroborno-cdn@main/public/fonts/July-Font/font.css"
          rel="stylesheet"
        />
        {/* Shurjo Bold for Bangla titles */}
        <link
          href="https://cdn.jsdelivr.net/gh/Taraldinn/soroborno-cdn@main/public/fonts/Shurjo/font.css"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <LanguageProvider>{children}</LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
