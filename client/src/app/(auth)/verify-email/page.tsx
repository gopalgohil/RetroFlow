import { Metadata } from 'next';
import { VerifyEmailForm } from '@/components/auth/VerifyEmailForm';

export const metadata: Metadata = {
  title: 'Verify Your Email | RetroFlow',
  description: 'Enter the 6-digit verification code sent to your email to activate your RetroFlow account.',
};

export default function VerifyEmailPage() {
  return <VerifyEmailForm />;
}
