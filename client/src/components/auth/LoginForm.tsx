'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input, Button, Alert } from '@/components/ui';
import { AuthHeader, SocialButton, AuthDivider, AuthFooterLink } from '@/components/auth';
import { loginSchema, LoginFormData } from '@/lib/validations/auth';
import { api, ENDPOINTS } from '@/lib/api';

export interface LoginFormProps {
  onSubmit?: (credentials: LoginFormData) => Promise<void> | void;
  onGoogleSignIn?: () => void;
  initialEmail?: string;
  initialVerified?: boolean;
  initialReset?: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  onGoogleSignIn,
  initialEmail = '',
  initialVerified = false,
  initialReset = false,
}) => {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: initialEmail,
    password: '',
  });

  const [isVerifiedParam, setIsVerifiedParam] = useState(initialVerified);
  const [isResetSuccessParam, setIsResetSuccessParam] = useState(initialReset);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const email = params.get('email');
      const verified = params.get('verified') === 'true';
      const reset = params.get('reset') === 'true';
      if (email && !initialEmail) {
        setFormData((prev) => ({ ...prev, email }));
      }
      if (verified) {
        setIsVerifiedParam(true);
      }
      if (reset) {
        setIsResetSuccessParam(true);
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

        try {
          localStorage.removeItem('retroflow_cached_active_project');
          localStorage.removeItem('retroflow_active_project_id');
          localStorage.removeItem('retroflow_cached_projects_list');
        } catch {}

        if (data.data?.token) {
          localStorage.setItem('retroflow_token', data.data.token);
          localStorage.removeItem('retroflow_rejected');
          document.cookie = `retroflow_token=${encodeURIComponent(data.data.token)}; path=/; max-age=2592000; SameSite=Lax`;
          document.cookie = 'retroflow_rejected=; path=/; max-age=0; SameSite=Lax';
        }
        if (data.data?.user) {
          const uStr = JSON.stringify(data.data.user);
          localStorage.setItem('retroflow_user', uStr);
          localStorage.removeItem('retroflow_rejected');
          document.cookie = `retroflow_user=${encodeURIComponent(uStr)}; path=/; max-age=2592000; SameSite=Lax`;
          document.cookie = 'retroflow_rejected=; path=/; max-age=0; SameSite=Lax';
        }

        sessionStorage.setItem('retroflow_welcome_toast', 'true');

        setTimeout(() => {
          router.push('/dashboard');
        }, 2200);
      }
    } catch (err: any) {
      setIsLoading(false);
      const msg = (err.message || '').toLowerCase();
      const isRejection = msg.includes('rejected') || err.data?.status === 'rejected';
      const isVerificationRequired =
        !isRejection &&
        (err.data?.requiresVerification ||
          err.requiresVerification ||
          msg.includes('not verified') ||
          msg.includes('verification code'));

      if (isVerificationRequired) {
        setUnverifiedEmail(formData.email);
      } else {
        setUnverifiedEmail(null);
      }
      setGeneralError(err.message || 'Invalid email or password.');
    }
  };

  const handleGoogleSignIn = async () => {
    if (onGoogleSignIn) {
      onGoogleSignIn();
      return;
    }

    setGeneralError(null);
    setFieldErrors({});
    setIsLoading(true);

    try {
      const { signInWithPopup } = await import('firebase/auth');
      const { auth, googleProvider } = await import('@/lib/firebase');

      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const idToken = await user.getIdToken();

      const response = await api.post(ENDPOINTS.AUTH.GOOGLE, {
        token: idToken,
        email: user.email,
        name: user.displayName,
        avatar: user.photoURL,
        googleId: user.uid,
      });

      try {
        localStorage.removeItem('retroflow_cached_active_project');
        localStorage.removeItem('retroflow_active_project_id');
        localStorage.removeItem('retroflow_cached_projects_list');
      } catch {}

      if (response.data?.token) {
        localStorage.setItem('retroflow_token', response.data.token);
        localStorage.removeItem('retroflow_rejected');
      }
      if (response.data?.user) {
        localStorage.setItem('retroflow_user', JSON.stringify(response.data.user));
        localStorage.removeItem('retroflow_rejected');
      }

      sessionStorage.setItem('retroflow_welcome_toast', 'true');
      router.push('/dashboard');
    } catch (err: any) {
      setIsLoading(false);
      console.error('Google Sign-in Error:', err);

      if (err.code === 'auth/popup-closed-by-user') {
        return;
      }
      if (err.code === 'auth/operation-not-allowed') {
        setGeneralError(
          'Google Sign-In is not enabled yet in your Firebase Console. Please go to Authentication > Sign-in method and enable Google.'
        );
        return;
      }
      if (err.code === 'auth/unauthorized-domain') {
        setGeneralError(
          'This domain is not authorized in Firebase Console. Add localhost to Authorized domains under Authentication > Settings.'
        );
        return;
      }

      setGeneralError(err.message || 'Google sign-in failed. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <AuthHeader
        title="Welcome back"
        subtitle="Enter your credentials to access your workspace"
      />

      {isVerifiedParam && !generalError && (
        <Alert variant="success">
          🎉 Your email has been verified successfully! Please sign in to access your workspace.
        </Alert>
      )}

      {isResetSuccessParam && (
        <Alert variant="success">
          🎉 Your password has been reset successfully! Please sign in with your new password.
        </Alert>
      )}

      {generalError && (
        <Alert variant="error">
          <div className="space-y-1">
            <p>{generalError}</p>
            {unverifiedEmail && (
              <p className="pt-1">
                <Link
                  href={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`}
                  className="font-bold underline text-[#88c958] hover:text-[#96dc63]"
                >
                  Click here to enter your 6-digit verification code →
                </Link>
              </p>
            )}
          </div>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="Email"
          type="email"
          name="email"
          placeholder="name@example.com"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          error={fieldErrors.email}
          required
          autoComplete="email"
        />

        <Input
          label="Password"
          labelRight={
            <Link
              href="/forgot-password"
              onClick={() => {
                try {
                  sessionStorage.removeItem('retroflow_forgot_password_session');
                } catch {
                }
              }}
              className="text-xs sm:text-sm font-semibold text-[#88c958] hover:text-[#96dc63] hover:underline transition-colors"
            >
              Forgot password?
            </Link>
          }
          type="password"
          name="password"
          placeholder="••••••••••••"
          value={formData.password}
          onChange={(e) => handleInputChange('password', e.target.value)}
          error={fieldErrors.password}
          required
          autoComplete="current-password"
        />

        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          spinnerOnly={true}
          disabled={isLoading}
          className="w-full py-3 text-sm font-semibold rounded-xl mt-2 shadow-md shadow-[#88c958]/20"
        >
          Sign In
        </Button>
      </form>

      <AuthDivider label="Or continue with" />

      <SocialButton
        provider="google"
        label="Continue with Google"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
      />

      <AuthFooterLink
        prompt="Don't have an account?"
        actionText="Sign up"
        href="/signup"
      />
    </div>
  );
};
