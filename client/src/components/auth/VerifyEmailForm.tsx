'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Input, Button, Alert } from '@/components/ui';
import { AuthHeader, AuthFooterLink } from '@/components/auth';
import { verifyEmailSchema } from '@/lib/validations/auth';
import { api, ENDPOINTS } from '@/lib/api';

export interface VerifyEmailFormProps {
  initialEmail?: string;
}

export const VerifyEmailForm: React.FC<VerifyEmailFormProps> = ({ initialEmail = '' }) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const emailParam = searchParams.get('email') || initialEmail;
  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Sync email from search params if updated
  useEffect(() => {
    if (emailParam && !email) {
      setEmail(emailParam);
    }
  }, [emailParam, email]);

  // Countdown timer for resending verification code
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Validate with Zod
    const validation = verifyEmailSchema.safeParse({ email, otp });
    if (!validation.success) {
      setError(validation.error.issues[0]?.message || 'Please enter a valid 6-digit code');
      return;
    }

    setIsLoading(true);
    try {
      const data = await api.post(ENDPOINTS.AUTH.VERIFY_EMAIL, {
        email: validation.data.email,
        otp: validation.data.otp,
      });

      setSuccessMessage('🎉 Email verified successfully! Redirecting you to sign in...');

      // Redirect to login page with verified parameter after 1.5 seconds
      setTimeout(() => {
        router.push(`/login?verified=true&email=${encodeURIComponent(email)}`);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Invalid or expired verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || !email) return;
    setCanResend(false);
    setCountdown(60);
    setError(null);
    try {
      const data = await api.post(ENDPOINTS.AUTH.RESEND_OTP, { email });
      setSuccessMessage(data.message || `A fresh verification code has been sent to ${email}`);
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification code');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Auth Header */}
      <AuthHeader
        title="Verify your email"
        subtitle={
          email
            ? `We have dispatched a 6-digit verification code to ${email}. Please enter it below to activate your account.`
            : 'Please enter the 6-digit verification code sent to your email.'
        }
      />

      {/* Status Alerts */}
      {error && <Alert variant="error" message={error} />}
      {successMessage && <Alert variant="success" message={successMessage} />}

      {/* Verification Form */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {!emailParam && (
          <Input
            label="Work Email"
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        )}

        <Input
          label="6-Digit Verification Code (OTP)"
          type="text"
          name="otp"
          placeholder="e.g. 583920"
          maxLength={6}
          value={otp}
          onChange={(e) => {
            setOtp(e.target.value.replace(/\D/g, ''));
            if (error) setError(null);
          }}
          className="tracking-widest font-mono text-center text-xl font-bold"
          required
          autoFocus
        />

        {/* Resend OTP & Change Email options */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <Link href="/signup" className="text-indigo-600 hover:underline font-medium">
            ← Change email / Re-signup
          </Link>

          {canResend ? (
            <button
              type="button"
              onClick={handleResendOtp}
              className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
            >
              Resend Code
            </button>
          ) : (
            <span>Resend in {countdown}s</span>
          )}
        </div>

        {/* Action Button */}
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          className="w-full py-3 text-sm font-semibold rounded-xl shadow-md shadow-indigo-600/20"
        >
          Verify & Activate Account
        </Button>
      </form>

      {/* Footer Link */}
      <AuthFooterLink
        prompt="Already verified?"
        actionText="Sign in directly"
        href="/login"
      />
    </div>
  );
};
