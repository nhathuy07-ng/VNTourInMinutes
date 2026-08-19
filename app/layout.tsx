import type {Metadata} from 'next';
import './globals.css'; // Global styles
import { AuthProvider } from '@/components/AuthProvider';

export const metadata: Metadata = {
  title: 'VNTourInMinutes',
  description: 'Plan your single-day tour in Vietnamese cities in minutes.',
  manifest: '/manifest.json',
  openGraph: {
    title: 'VNTourInMinutes',
    description: 'Plan your single-day tour in Vietnamese cities in minutes.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VNTourInMinutes',
    description: 'Plan your single-day tour in Vietnamese cities in minutes.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
