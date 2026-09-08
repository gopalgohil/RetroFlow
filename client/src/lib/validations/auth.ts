import { z } from 'zod';

/**
 * Zod Schema for User Registration (Sign Up)
 */
export const signupSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, 'Full name must be at least 2 characters long')
      .max(60, 'Full name must be under 60 characters')
      .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, and hyphens'),
    email: z
      .string()
      .trim()
      .min(1, 'Work email is required')
      .email('Please enter a valid email address (e.g. name@company.com)'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Za-z]/, 'Password must contain at least one letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z
      .string()
      .min(1, 'Please confirm your password'),
    agreedToTerms: z
      .boolean()
      .refine((val) => val === true, {
        message: 'You must agree to the Terms of Service and Privacy Policy',
      }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match. Please re-enter identical passwords.',
    path: ['confirmPassword'],
  });

export type SignupFormData = z.infer<typeof signupSchema>;

/**
 * Zod Schema for Verifying Email Signup OTP
 */
export const verifyEmailSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  otp: z
    .string()
    .trim()
    .length(6, 'Verification code must be exactly 6 digits')
    .regex(/^\d+$/, 'Verification code must contain only numbers'),
});

export type VerifyEmailFormData = z.infer<typeof verifyEmailSchema>;

/**
 * Zod Schema for User Login
 */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Zod Schema for Requesting Password Reset OTP
 */
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Work email is required')
    .email('Please enter a valid email address'),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

/**
 * Zod Schema for Verifying OTP and Resetting Password
 */
export const resetPasswordSchema = z
  .object({
    otp: z
      .string()
      .trim()
      .length(6, 'Verification code must be exactly 6 digits')
      .regex(/^\d+$/, 'Verification code must contain only numbers'),
    password: z
      .string()
      .min(8, 'New password must be at least 8 characters long')
      .regex(/[A-Za-z]/, 'Password must contain at least one letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z
      .string()
      .min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match. Please re-enter identical passwords.',
    path: ['confirmPassword'],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
