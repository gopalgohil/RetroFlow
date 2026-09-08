import { Metadata } from 'next';
import { SignupForm } from '@/components/auth/SignupForm';

export const metadata: Metadata = {
  title: 'Create an Account | RetroFlow',
  description: 'Sign up for RetroFlow to empower agile teams to reflect, align, and act with seamless sprint retrospectives.',
};

export default function SignupPage() {
  return <SignupForm />;
}
