import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Fraunces } from 'next/font/google';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-heading',
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SPMB Online - Penerimaan Murid Baru Terpadu Madrasah Ibtidaiyah',
  description:
    'Portal resmi penerimaan murid baru Madrasah Ibtidaiyah. Pendaftaran online mudah, transparan, dan terpercaya dengan PIN 6 digit dan verifikasi terpadu.',
  openGraph: {
    title: 'SPMB Online - Penerimaan Murid Baru Terpadu Madrasah Ibtidaiyah',
    description:
      'Portal resmi penerimaan murid baru Madrasah Ibtidaiyah. Pendaftaran online mudah, transparan, dan terpercaya.',
    locale: 'id_ID',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${fraunces.variable} ${plusJakartaSans.variable} scroll-smooth`}>
      <body className="font-sans antialiased text-[#292524] bg-[#F7F4EC]" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
