import z from 'zod';

/**
 * Base validation schemas for common fields
 */
const nameSchema = z
  .string()
  .min(2, { message: 'Name must be at least 2 characters long' })
  .max(50, { message: 'Name cannot exceed 50 characters' })
  .trim();

const emailSchema = z
  .string()
  .email({ message: 'Invalid email address' })
  .trim()
  .toLowerCase();

const passwordSchema = z
  .string()
  .min(8, { message: 'Password must be at least 8 characters long' })
  .max(100, { message: 'Password cannot exceed 100 characters' })
  .regex(/[A-Z]/, {
    message: 'Password must contain at least one uppercase letter',
  })
  .regex(/[a-z]/, {
    message: 'Password must contain at least one lowercase letter',
  })
  .regex(/\d/, { message: 'Password must contain at least one number' })
  .regex(/[@$!%*?&]/, {
    message: 'Password must contain at least one special character (@$!%*?&)',
  });

const profilePicSchema = z
  .string()
  .url({ message: 'Invalid profile picture URL' })
  .optional()
  .or(z.literal(''));

/**
 * Form validation schemas
 */
export const signUpSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  profilePic: profilePicSchema.optional(),
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: 'Password is required' }),
});

export const resetPasswordRequestSchema = z.object({
  email: emailSchema,
});

export const passwordResetSchema = z.object({
  password: passwordSchema,
});

export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, { message: 'Current Password is required' }),
  newPassword: passwordSchema,
});
