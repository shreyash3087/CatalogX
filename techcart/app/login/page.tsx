'use client';

import React, { Suspense } from 'react';
import LoginForm from './LoginForm';

export default function TechCartLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#090C10] flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}