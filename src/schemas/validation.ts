import { z } from 'zod';

// Share dialog validation schemas
export const shareDialogSchema = z.object({
  preset: z.enum(['full', 'lite', 'custom']),
  selectedFields: z.array(z.string()).min(1, "At least one field must be selected"),
  expiryMinutes: z.number().min(5, "Minimum expiry is 5 minutes").max(10080, "Maximum expiry is 7 days"),
  maxViews: z.number().min(1, "Minimum views is 1").max(1000, "Maximum views is 1000"),
  accessCode: z.string().optional(),
  requireAccessCode: z.boolean(),
}).refine((data) => {
  // If access code is required, it must be provided and be at least 4 characters
  if (data.requireAccessCode) {
    return data.accessCode && data.accessCode.length >= 4;
  }
  return true;
}, {
  message: "Access code must be at least 4 characters when required",
  path: ["accessCode"]
});

// Field name validation to prevent injection
export const fieldNameSchema = z.string()
  .min(1, "Field name cannot be empty")
  .max(100, "Field name too long")
  .regex(/^[a-zA-Z0-9_\-\s\.]+$/, "Field name contains invalid characters")
  .refine((val) => {
    // Prevent common injection patterns
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+=/i,
      /data:/i,
      /vbscript:/i,
      /expression\(/i,
      /eval\(/i,
      /function\(/i
    ];
    return !dangerousPatterns.some(pattern => pattern.test(val));
  }, "Field name contains potentially dangerous content");

// Credential import validation
export const credentialImportSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  issuer: z.string().min(1, "Issuer is required").max(100, "Issuer too long"),
  type: z.string().min(1, "Type is required").max(50, "Type too long"),
  category: z.enum(['degree', 'certificate', 'transcript', 'diploma', 'license', 'badge', 'other']),
  payload: z.record(z.any()).optional(),
  expiresAt: z.date().optional(),
}).refine((data) => {
  // Validate issuer domain format if provided
  if (data.issuer && data.issuer.includes('.')) {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    return domainRegex.test(data.issuer);
  }
  return true;
}, {
  message: "Invalid issuer domain format",
  path: ["issuer"]
});

// User profile validation
export const profileUpdateSchema = z.object({
  display_name: z.string().max(100, "Display name too long").optional(),
  avatar_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  recovery_email: z.string().email("Invalid email").optional().or(z.literal("")),
  language: z.enum(['en', 'hi', 'es', 'fr', 'de']).optional(),
  settings: z.object({
    darkMode: z.boolean(),
    telemetry: z.boolean(),
    notifications: z.boolean(),
  }).optional(),
  security_preferences: z.object({
    appLock: z.boolean(),
    biometric: z.boolean(),
    twoFactor: z.boolean(),
    enablePasskey: z.boolean(),
  }).optional(),
});

// Rate limiting schemas
export const rateLimitSchema = z.object({
  endpoint: z.string().min(1, "Endpoint required"),
  limit: z.number().min(1).max(1000),
  windowMinutes: z.number().min(1).max(1440), // Max 24 hours
});

// Security event logging schema
export const securityEventSchema = z.object({
  eventType: z.string().min(1, "Event type required"),
  resourceType: z.string().optional(),
  resourceId: z.string().uuid().optional(),
  metadata: z.record(z.any()).optional(),
  riskLevel: z.enum(['low', 'medium', 'high']).default('low'),
});

// Sanitization helpers
export const sanitizeString = (input: string): string => {
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
};

export const sanitizeObject = (obj: Record<string, any>): Record<string, any> => {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};