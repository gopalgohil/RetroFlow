'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input, Button, Alert } from '@/components/ui';
import { AuthHeader, AuthFooterLink } from '@/components/auth';
import {
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@/lib/validations/auth';
import { api, ENDPOINTS } from '@/lib/api';

export const ForgotPasswordForm: React.FC = () => {
  const router = useRouter();
  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isAccountNotFound, setIsAccountNotFound] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Timer for OTP resend cooldown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 2 && countdown > 0) {
      timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [step, countdown]);

  // Clean up redirect timer on unmount
  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setGeneralError(null);

    const validation = forgotPasswordSchema.safeParse({ email });
    if (!validation.success) {
      setFieldErrors({ email: validation.error.issues[0]?.message || 'Invalid email' });
      return;
    }

    setIsLoading(true);
    try {
      const data = await api.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, {
        email: validation.data.email,
      });

      setStep(2);
      setCountdown(60);
      setCanResend(false);
      setIsRedirecting(false);
      setIsAccountNotFound(false);
      setSuccessMessage(data.message || `A 6-digit OTP code has been sent to ${email}`);
    } catch (err: any) {
      const isNotFound =
        err.status === 404 ||
        err.message?.toLowerCase().includes('not found') ||
        err.message?.toLowerCase().includes('not registered') ||
        err.message?.toLowerCase().includes('create an account');

      setIsAccountNotFound(Boolean(isNotFound));
      setGeneralError(err.message || 'Account not found. Please create an account first.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setGeneralError(null);

    const validation = resetPasswordSchema.safeParse({
      otp,
      password: newPassword,
      confirmPassword,
    });

    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const fieldName = issue.path[0] as string;
        if (fieldName && !errors[fieldName]) {
          errors[fieldName] = issue.message;
        }
      });
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      await api.post(ENDPOINTS.AUTH.RESET_PASSWORD, {
        email,
        otp: validation.data.otp,
        newPassword: validation.data.password,
      });

      setIsRedirecting(true);
      setSuccessMessage('🎉 Password reset successfully! Redirecting you to sign in...');

      // Redirect to login page after 1.5 seconds
      redirectTimerRef.current = setTimeout(() => {
        router.push(`/login?reset=true&email=${encodeURIComponent(email)}`);
      }, 1500);
    } catch (err: any) {
      setIsRedirecting(false);
      setGeneralError(err.message || 'Failed to reset password. Please check your OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setCanResend(false);
    setCountdown(60);
    setGeneralError(null);
    try {
      const data = await api.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
      setSuccessMessage(data.message || `New OTP sent to ${email}`);
    } catch (err: any) {
      setGeneralError(err.message || 'Error resending OTP');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Dynamic Header based on step */}
      <AuthHeader
        title={step === 1 ? 'Forgot your password?' : 'Enter verification code'}
        subtitle={
          step === 1
            ? 'Enter your work email address to receive a 6-digit verification code.'
            : `We sent a 6-digit OTP code to ${email}. Please enter it below.`
        }
      />

      {/* General Alert messages */}
      {generalError && (
        <Alert variant="error">
          <div className="space-y-1.5">
            <p>{generalError}</p>
            {isAccountNotFound && (
              <p className="pt-0.5">
                <Link
                  href={`/signup?email=${encodeURIComponent(email)}`}
                  className="inline-flex items-center font-semibold text-rose-800 underline hover:text-rose-950 transition-colors"
                >
                  Create an account now &rarr;
                </Link>
              </p>
            )}
          </div>
        </Alert>
      )}
      {successMessage && <Alert variant="success" message={successMessage} />}

      {/* Step 1: Request OTP */}
      {step === 1 && (
        <form onSubmit={handleRequestOtp} className="space-y-4" noValidate>
          <Input
            label="Work Email"
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) setFieldErrors({});
              if (generalError) setGeneralError(null);
              if (isAccountNotFound) setIsAccountNotFound(false);
            }}
            error={fieldErrors.email}
            required
            autoComplete="email"
          />

          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            className="w-full py-3 text-sm font-semibold rounded-xl shadow-md shadow-indigo-600/20"
          >
            Send Verification Code
          </Button>
        </form>
      )}

      {/* Step 2: Verify OTP and Set New Password */}
      {step === 2 && (
        <form onSubmit={handleResetPassword} className="space-y-4" noValidate>
          <Input
            label="6-Digit Verification Code (OTP)"
            type="text"
            placeholder="e.g. 849201"
            maxLength={6}
            value={otp}
            onChange={(e) => {
              setOtp(e.target.value.replace(/\D/g, ''));
              if (fieldErrors.otp) setFieldErrors((prev) => ({ ...prev, otp: '' }));
            }}
            error={fieldErrors.otp}
            className="tracking-widest font-mono text-center text-lg font-bold"
            required
          />

          <Input
            label="New Password"
            type="password"
            placeholder="Enter new password (8+ chars)"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
            }}
            error={fieldErrors.password}
            helperText={!fieldErrors.password ? 'Must contain letters and numbers' : undefined}
            required
          />

          <Input
            label="Confirm New Password"
            type="password"
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
            }}
            error={fieldErrors.confirmPassword}
            required
          />

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setIsRedirecting(false);
                setSuccessMessage(null);
              }}
              className="text-indigo-600 hover:underline font-medium"
            >
              Change Email
            </button>
            {canResend ? (
              <button
                type="button"
                onClick={handleResendOtp}
                className="font-semibold text-indigo-600 hover:underline cursor-pointer"
              >
                Resend OTP
              </button>
            ) : (
              <span>Resend in {countdown}s</span>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading || isRedirecting}
            disabled={isLoading || isRedirecting}
            className="w-full py-3 text-sm font-semibold rounded-xl shadow-md shadow-indigo-600/20"
          >
            {isRedirecting ? 'Redirecting to Sign In...' : 'Reset Password'}
          </Button>
        </form>
      )}

      {/* Footer link to login */}
      <AuthFooterLink
        prompt="Remember your password?"
        actionText="Sign in"
        href="/login"
      />
    </div>
  );
};
