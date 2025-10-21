import type { Metadata } from "next";
import "./globals.css";
import "./fonts.css";
import { initializeScheduler } from '@/lib/scheduler-init';
import '@/lib/app-startup'; // Import startup script

export const metadata: Metadata = {
  title: "پنل مدیریت تحقیقات بازار",
  description: "دریافت و تحلیل منو، قیمت و تخفیفات رستوران‌های اسنپ‌فود",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Initialize the price update scheduler on app startup with retry logic
  try {
    await initializeScheduler();
  } catch (error) {
    console.error('❌ Layout: Failed to initialize scheduler:', error);
    // Don't throw error to prevent app startup failure
  }
  
  return (
    <html lang="fa" dir="rtl">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
