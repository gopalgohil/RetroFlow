import { Metadata } from 'next';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Sign In | RetroFlow',
  description: 'Log in to your RetroFlow workspace to manage sprint retrospectives and team alignment.',
};

export default function LoginPage() {
  return <LoginForm />;
}
