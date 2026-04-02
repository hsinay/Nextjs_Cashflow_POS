// lib/validations/auth.schema.ts

import { z } from 'zod';

/**
 * Username validation: 3-20 chars, alphanumeric + underscore, no spaces
 */
const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must be at most 20 characters')
  .regex(
    /^[a-zA-Z0-9_]+$/,
    'Username can only contain letters, numbers, and underscores'
  )
  .transform((val) => val.toLowerCase());

/**
 * Email validation: RFC 5322 format
 */
const emailSchema = z
  .string()
  .email('Please enter a valid email address')
  .transform((val) => val.toLowerCase());

/**
 * Password validation: 8+ chars with uppercase, lowercase, number, special char
 */
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(
    /^(?=.*[A-Z])/,
    'Password must contain at least one uppercase letter'
  )
  .regex(
    /^(?=.*[a-z])/,
    'Password must contain at least one lowercase letter'
  )
  .regex(
    /^(?=.*\d)/,
    'Password must contain at least one number'
  )
  .regex(
    /^(?=.*[!@#$%^&*])/,
    'Password must contain at least one special character (!@#$%^&*)'
  );

/**
 * Phone number validation: flexible format
 */
const phoneSchema = z
  .string()
  .regex(
    /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
    'Please enter a valid phone number'
  )
  .optional()
  .nullable();

/**
 * Login schema
 */
export const loginSchema = z.object({
  username: usernameSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Register schema
 */
export const registerSchema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    contactNumber: phoneSchema,
    agreeToTerms: z
      .boolean()
      .refine((val) => val === true, 'You must agree to the terms and conditions'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Change password schema
 */
export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.oldPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/**
 * Update user profile schema
 */
export const updateUserSchema = z.object({
  email: emailSchema.optional(),
  contactNumber: phoneSchema,
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

/**
 * Assign roles schema
 */
export const assignRolesSchema = z.object({
  roleIds: z
    .array(z.string().uuid('Invalid role ID'))
    .min(1, 'At least one role must be selected'),
});

export type AssignRolesInput = z.infer<typeof assignRolesSchema>;
