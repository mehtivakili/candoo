import type { Metadata } from "next";
import "./globals.css";
import "./fonts.css";
import { initializeScheduler } from '@/lib/scheduler-init';

export const metadata: Metadata = {
  title: "پنل مدیریت اطلاعات رستوران",
  description: "دریافت و تحلیل منو، قیمت و تخفیفات رستوران‌های اسنپ‌فود",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Initialize the price update scheduler on app startup
  await initializeScheduler();
  
  return (
    <html lang="fa" dir="rtl">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
