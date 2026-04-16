import * as z from 'zod';

export const LoginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(1, { message: 'Password is required.' })
});

export type LoginInput = z.infer<typeof LoginSchema>;

// Signup validation schema
export const SignupSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }).max(255, { message: "Full name is too long." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters long." }),
  confirmPassword: z.string().min(8, { message: "Please confirm your password." }),
  companyName: z.string().min(2, { message: "Company name must be at least 2 characters." }).max(255, { message: "Company name is too long." }),
  phoneNumber: z.string().min(10, { message: "Please enter a valid phone number." }).regex(/^[\d\s\+\-\(\)]+$/, { message: "Phone number can only contain digits, spaces, +, -, and parentheses." }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type SignupInput = z.infer<typeof SignupSchema>;

// Step 1: Basic Signup (Email & Password)
export const SignupBasicSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters long." }),
  confirmPassword: z.string().min(8, { message: "Please confirm your password." }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type SignupBasicInput = z.infer<typeof SignupBasicSchema>;

// Step 2: OTP Verification
export const VerifyOTPSchema = z.object({
  otp: z.string().length(6, { message: "OTP must be exactly 6 digits." }),
});

export type VerifyOTPInput = z.infer<typeof VerifyOTPSchema>;

// Step 3: Business Information Onboarding
export const BusinessOnboardingSchema = z.object({
  fullName: z.string().min(2, { message: "Full name is required." }),
  role: z.string().min(1, { message: "Role is required." }),
  companyName: z.string().min(2, { message: "Company name is required." }),
  industry: z.string().min(1, { message: "Industry is required." }),
  phoneNumber: z.string().min(1, { message: "Phone number is required." }),
});

export type BusinessOnboardingInput = z.infer<typeof BusinessOnboardingSchema>;

// Phone number validation helper
export const validatePhoneNumber = (phoneNumber: string): boolean => {
  // Remove all non-digit characters except + for international codes
  const cleaned = phoneNumber.replace(/[^\d\+]/g, '');

  // Check if it has at least 10 digits (minimum for most phone numbers)
  const digitCount = cleaned.replace(/\+/g, '').length;
  return digitCount >= 10 && digitCount <= 15;
};

// Email validation helper (more comprehensive)
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Auto-format phone number as user types
export const formatPhoneNumber = (value: string): string => {
  // Remove all non-digit characters except + and space
  const cleaned = value.replace(/[^\d\+\s]/g, '');

  // If it starts with +, it's international
  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  // For US/Canada numbers (assuming this format)
  const digits = cleaned.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
};

// Onboarding validation schema
export const OnboardingSchema = z.object({
  businessName: z.string().optional().or(z.literal("")), // Now optional, collected during signup
  industry: z.string().optional(),
  website: z.string().max(500, { message: "Website URL is too long." }).optional().or(z.literal("")),
  contactName: z.string().min(2, { message: "Contact name is required." }).max(255, { message: "Contact name is too long." }),
  contactEmail: z.string().email({ message: "Please enter a valid email address." }),
  contactPhone: z.string().min(10, { message: "Please enter a valid phone number." }).regex(/^[\d\s\+\-\(\)]+$/, { message: "Phone number can only contain digits, spaces, +, -, and parentheses." }),
  assistantPurpose: z.string().optional(),
  expectedCallVolume: z.string().optional(),
  preferredLanguage: z.string().default("English"),
  existingSystems: z.string().optional(),
  integrationNeeds: z.string().optional(),
  specialRequirements: z.string().optional(),
  notes: z.string().optional(),
});

export type OnboardingInput = z.infer<typeof OnboardingSchema>;