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
        {/* July Font for Bangla */}
        <link
          href="https://cdn.jsdelivr.net/gh/Taraldinn/soroborno-cdn@main/public/fonts/July-Font/font.css"
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
