import type { Metadata } from "next";
import "./globals.css";
import "./fonts.css";

export const metadata: Metadata = {
  title: "پنل مدیریت اطلاعات رستوران",
  description: "دریافت و تحلیل منو، قیمت و تخفیفات رستوران‌های اسنپ‌فود",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
