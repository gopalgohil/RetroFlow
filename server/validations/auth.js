import { z } from 'zod';

/**
 * Universal Comprehensive Email Validation Schema for Backend API
 * Validates RFC-compliant email addresses across all email providers:
 * standard personal emails (Gmail, Yahoo, Outlook, iCloud, etc.),
 * corporate & enterprise domains, subdomains (corp.co.uk),
 * plus-addressing (user+tag@domain.com), and all modern TLDs (.io, .ai, .app, .dev, .tech, etc.)
 */
export const emailValidation = z
  .string({ required_error: 'Email is required' })
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
    message: 'Please provide a valid email address (e.g. name@example.com)',
  });

export const registerSchema = z.object({
  name: z
    .string({ required_error: 'Full name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(60, 'Name must be under 60 characters'),
  email: emailValidation,
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const loginSchema = z.object({
  email: emailValidation,
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

export const verifyEmailSchema = z.object({
  email: emailValidation,
  otp: z
    .string({ required_error: 'Verification code is required' })
    .trim()
    .length(6, 'Verification code must be exactly 6 digits')
    .regex(/^\d+$/, 'Verification code must contain only numbers'),
});

export const resendVerificationSchema = z.object({
  email: emailValidation,
});

export const forgotPasswordSchema = z.object({
  email: emailValidation,
});

export const resetPasswordSchema = z.object({
  email: emailValidation,
  otp: z
    .string({ required_error: 'OTP is required' })
    .trim()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d+$/, 'OTP must contain only numbers'),
  newPassword: z
    .string({ required_error: 'New password is required' })
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});
