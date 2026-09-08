'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input, Button, Checkbox, Alert } from '@/components/ui';
import { AuthHeader, SocialButton, AuthDivider, AuthFooterLink } from '@/components/auth';
import { signupSchema, SignupFormData } from '@/lib/validations/auth';
import { api, ENDPOINTS } from '@/lib/api';

export interface SignupFormProps {
  onSubmit?: (data: SignupFormData) => Promise<void> | void;
  onGoogleSignUp?: () => void;
}

export const SignupForm: React.FC<SignupFormProps> = ({ onSubmit, onGoogleSignUp }) => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreedToTerms: false,
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field-specific error as user types
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
    if (generalError) setGeneralError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setGeneralError(null);

    // Run Zod Schema Validation
    const validationResult = signupSchema.safeParse(formData);

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
        // Send request to backend via clean Universal API Client
        await api.post(ENDPOINTS.AUTH.REGISTER, {
          name: validationResult.data.fullName,
          email: validationResult.data.email,
          password: validationResult.data.password,
        });

        setIsSuccess(true);

        // Transition immediately to the OTP email verification form
        setTimeout(() => {
          router.push(`/verify-email?email=${encodeURIComponent(validationResult.data.email)}`);
        }, 1000);
      }
    } catch (err: any) {
      setGeneralError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Reusable Auth Header */}
      <AuthHeader
        title="Create an account"
        subtitle="Start running high-impact retrospectives with your team"
      />

      {/* Reusable Google OAuth Button */}
      <SocialButton
        provider="google"
        label="Sign up with Google"
        onClick={onGoogleSignUp}
      />

      {/* Reusable Divider */}
      <AuthDivider label="Or register with email" />

      {/* General Alert Banner */}
      {generalError && <Alert variant="error" message={generalError} />}
      {isSuccess && (
        <Alert variant="success">
          Account created successfully!{' '}
          <Link href="/login" className="font-bold underline">
            Click here to sign in
          </Link>
          .
        </Alert>
      )}

      {/* Registration Form with Zod Field Validation */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="Full Name"
          type="text"
          name="fullName"
          placeholder="Sarah Miller"
          value={formData.fullName}
          onChange={(e) => handleInputChange('fullName', e.target.value)}
          error={fieldErrors.fullName}
          required
          autoComplete="name"
        />

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
          placeholder="Create a strong password (8+ chars)"
          value={formData.password}
          onChange={(e) => handleInputChange('password', e.target.value)}
          error={fieldErrors.password}
          helperText={!fieldErrors.password ? 'Must be at least 8 characters with letters & numbers' : undefined}
          required
          autoComplete="new-password"
        />

        <Input
          label="Confirm Password"
          type="password"
          name="confirmPassword"
          placeholder="Re-enter your password"
          value={formData.confirmPassword}
          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
          error={fieldErrors.confirmPassword}
          required
          autoComplete="new-password"
        />

        {/* Terms agreement checkbox with Zod validation */}
        <div className="pt-1">
          <Checkbox
            checked={formData.agreedToTerms}
            onChange={(e) => handleInputChange('agreedToTerms', e.target.checked)}
            error={fieldErrors.agreedToTerms}
            label={
              <span>
                I agree to the{' '}
                <a href="#" className="font-semibold text-indigo-600 hover:underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="font-semibold text-indigo-600 hover:underline">
                  Privacy Policy
                </a>
                .
              </span>
            }
          />
        </div>

        {/* Reusable Action Button */}
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          className="w-full py-3 text-sm font-semibold rounded-xl mt-2 shadow-md shadow-indigo-600/20"
        >
          Create Account
        </Button>
      </form>

      {/* Reusable Auth Footer Link */}
      <AuthFooterLink
        prompt="Already have an account?"
        actionText="Sign in"
        href="/login"
      />
    </div>
  );
};
