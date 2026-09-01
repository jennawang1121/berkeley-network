import type { Metadata } from 'next';
import { DM_Sans, Manrope } from 'next/font/google';
import './globals.css';

const dmSans = DM_Sans({ variable: '--font-dm-sans', subsets: ['latin'] });
const manrope = Manrope({ variable: '--font-manrope', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Class 2 Signup',
  description: 'Add your name and see who is joining Agentic AI Class 2.',
  openGraph: {
    title: 'Class 2 Signup',
    description: 'Add your name to the room.',
    images: [{ url: '/og.png', width: 1733, height: 909, alt: 'Class 2 Signup — Add your name to the room.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Class 2 Signup',
    description: 'Add your name to the room.',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${dmSans.variable} ${manrope.variable} antialiased`}>{children}</body></html>;
}
