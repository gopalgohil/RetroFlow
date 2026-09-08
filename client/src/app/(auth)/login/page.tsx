import { Suspense } from 'react';
import { Metadata } from 'next';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Sign In | RetroFlow',
  description: 'Log in to your RetroFlow workspace to manage sprint retrospectives and team alignment.',
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-md mx-auto text-center py-12 text-slate-400 text-sm font-mono">Loading sign in...</div>}>
      <LoginForm />
    </Suspense>
  );
}
