import { z } from 'zod';

/**
 * Universal Comprehensive Email Validation Schema
 * Validates RFC-compliant email addresses across all email providers:
 * standard personal emails (Gmail, Yahoo, Outlook, iCloud, etc.),
 * corporate & enterprise domains, subdomains (corp.co.uk),
 * plus-addressing (user+tag@domain.com), and all modern TLDs (.io, .ai, .app, .dev, .tech, etc.)
 */
export const emailValidation = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .max(254, 'Email address cannot exceed 254 characters')
  .refine((val) => !/\s/.test(val), {
    message: 'Email address cannot contain spaces',
  })
  .refine((val) => !val.includes('..'), {
    message: 'Email address cannot contain consecutive dots',
  })
  .refine((val) => {
    const atParts = val.split('@');
    return atParts.length === 2 && atParts[0].length > 0 && atParts[1].length > 0;
  }, {
    message: 'Email must contain a valid username and domain separated by "@"',
  })
  .refine((val) => {
    const [localPart, domain] = val.split('@');
    if (!localPart || !domain) return false;
    if (localPart.startsWith('.') || localPart.endsWith('.')) return false;
    if (domain.startsWith('.') || domain.endsWith('.')) return false;
    return true;
  }, {
    message: 'Email cannot start or end with a dot',
  })
  .refine((val) => {
    const parts = val.split('@');
    if (parts.length !== 2) return false;
    const domain = parts[1];
    const tld = domain.split('.').pop();
    return domain.includes('.') && Boolean(tld && tld.length >= 2 && /^[a-zA-Z]+$/.test(tld));
  }, {
    message: 'Please provide a valid domain extension (e.g. .com, .io, .org, .in, .ai)',
  })
  .refine((val) => /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test(val), {
    message: 'Please enter a valid email address (e.g. name@company.com or name@gmail.com)',
  });

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
    email: emailValidation,
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
  email: emailValidation,
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
  email: emailValidation,
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
  email: emailValidation,
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
