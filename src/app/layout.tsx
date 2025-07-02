// src/app/layout.tsx
import './globals.css';
import React from 'react';

export const metadata = {
  title: 'Essay 평가 및 첨삭',
  description: 'Essay에 대한 평가와 첨삭을 5분 내에 받아보세요',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 font-sans text-gray-800">
        {children}
      </body>
    </html>
  );
}
