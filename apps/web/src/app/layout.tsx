import type { Metadata, Viewport } from 'next';
import { Nunito } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const nunito = Nunito({ subsets: ['latin', 'vietnamese'], variable: '--font-nunito', weight: ['400', '600', '700', '800', '900'] });

export const metadata: Metadata = {
  title: 'Happy Attendance',
  description: 'Mỗi ngày đi làm, một niềm vui nhỏ. Show up. Grow up. Feel good.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#fff8ee',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={nunito.variable}>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
