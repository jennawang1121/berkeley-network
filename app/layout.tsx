import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Berkeley Network',
  description: 'A private relationship tracker for the people you meet at Berkeley.',
  openGraph: {
    title: 'Berkeley Network',
    description: 'Stay thoughtfully connected.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Berkeley Network',
    description: 'A private relationship tracker for Berkeley.',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
