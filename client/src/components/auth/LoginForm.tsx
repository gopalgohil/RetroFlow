'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input, Button, Checkbox, Alert } from '@/components/ui';
import { AuthHeader, SocialButton, AuthDivider, AuthFooterLink } from '@/components/auth';
import { loginSchema, LoginFormData } from '@/lib/validations/auth';
import { api, ENDPOINTS } from '@/lib/api';

export interface LoginFormProps {
  onSubmit?: (credentials: LoginFormData) => Promise<void> | void;
  onGoogleSignIn?: () => void;
  initialEmail?: string;
  initialVerified?: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  onGoogleSignIn,
  initialEmail = '',
  initialVerified = false,
}) => {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: initialEmail,
    password: '',
    rememberMe: false,
  });

  const [isVerifiedParam, setIsVerifiedParam] = useState(initialVerified);

  // Read URL search parameters on client without triggering Next.js Suspense fallback bailout
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const email = params.get('email');
      const verified = params.get('verified') === 'true';
      if (email && !initialEmail) {
        setFormData((prev) => ({ ...prev, email }));
      }
      if (verified) {
        setIsVerifiedParam(true);
      }
    }
  }, [initialEmail]);


  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
    if (generalError) setGeneralError(null);
    if (unverifiedEmail) setUnverifiedEmail(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setGeneralError(null);
    setUnverifiedEmail(null);

    // Run Zod validation
    const validationResult = loginSchema.safeParse(formData);

    if (!validationResult.success) {
      const errors: Record<string, string> = {};
      validationResult.error.issues.forEach((issue) => {
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
      if (onSubmit) {
        await onSubmit(validationResult.data);
      } else {
        const data = await api.post(ENDPOINTS.AUTH.LOGIN, validationResult.data);

        // Store JWT token and user profile for instant access
        if (data.data?.token) {
          localStorage.setItem('retroflow_token', data.data.token);
        }
        if (data.data?.user) {
          localStorage.setItem('retroflow_user', JSON.stringify(data.data.user));
        }

        // Navigate to dashboard via client-side routing (keeps console logs visible)
        router.push('/dashboard');
      }
    } catch (err: any) {
      if (err.status === 403 || err.message?.toLowerCase().includes('not verified')) {
        setUnverifiedEmail(formData.email);
      }
      setGeneralError(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Reusable Auth Header */}
      <AuthHeader
        title="Welcome back"
        subtitle="Enter your credentials to access your workspace"
      />

      {/* Verification Success Alert if redirected after verify */}
      {isVerifiedParam && (
        <Alert variant="success">
          🎉 Your email has been verified successfully! Please sign in to access your workspace.
        </Alert>
      )}

      {/* Reusable Google OAuth Button */}
      <SocialButton
        provider="google"
        label="Continue with Google"
        onClick={onGoogleSignIn}
      />

      {/* Reusable Divider */}
      <AuthDivider label="Or continue with email" />

      {/* General Error Alert */}
      {generalError && (
        <Alert variant="error">
          <div className="space-y-1">
            <p>{generalError}</p>
            {unverifiedEmail && (
              <p className="pt-1">
                <Link
                  href={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`}
                  className="font-bold underline text-indigo-700 hover:text-indigo-900"
                >
                  Click here to enter your 6-digit verification code →
                </Link>
              </p>
            )}
          </div>
        </Alert>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="Work Email"
          type="email"
          name="email"
          placeholder="name@company.com"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          error={fieldErrors.email}
          required
          autoComplete="email"
        />

        <Input
          label="Password"
          type="password"
          name="password"
          placeholder="••••••••••••"
          value={formData.password}
          onChange={(e) => handleInputChange('password', e.target.value)}
          error={fieldErrors.password}
          required
          autoComplete="current-password"
        />

        {/* Remember me & Forgot password row */}
        <div className="flex items-center justify-between pt-1">
          <Checkbox
            label="Remember me"
            checked={formData.rememberMe}
            onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
          />

          <Link
            href="/forgot-password"
            className="text-xs sm:text-sm font-semibold text-indigo-600 hover:text-indigo-700 hover:underline transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        {/* Reusable Action Button */}
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          className="w-full py-3 text-sm font-semibold rounded-xl mt-2 shadow-md shadow-indigo-600/20"
        >
          Sign In
        </Button>
      </form>

      {/* Reusable Auth Footer Link */}
      <AuthFooterLink
        prompt="Don't have an account?"
        actionText="Sign up"
        href="/signup"
      />
    </div>
  );
};
