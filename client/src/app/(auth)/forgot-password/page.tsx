import { Metadata } from 'next';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'Forgot Password | RetroFlow',
  description: 'Reset your RetroFlow workspace password via 6-digit email OTP verification.',
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
