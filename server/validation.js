import { z } from 'zod';

export const loginSchema = z.object({ email: z.string().email().max(254), password: z.string().min(8).max(200) });
export const eventSchema = z.object({ studentId: z.string().trim().min(1).max(50), type: z.enum(['Appreciation','Sanction']), amount: z.number().int().min(1).max(20), reason: z.string().trim().min(2).max(500), notifyParent: z.boolean().optional().default(false) });
export const permissionSchema = z.object({ studentId: z.string().trim().min(1).max(50), reason: z.string().trim().min(2).max(500), outTime: z.string().datetime(), backTime: z.string().datetime() });
export const permissionStatusSchema = z.object({ status: z.enum(['Approved','Rejected']) });
export const notificationSchema = z.object({ to: z.string().email().max(254), message: z.string().trim().min(1).max(2000) });
export function validate(schema, source = 'body') { return (req, res, next) => { const result = schema.safeParse(req[source]); if (!result.success) return res.status(400).json({ error: 'Validation failed', code: 'VALIDATION_ERROR', details: result.error.flatten().fieldErrors }); req[source] = result.data; next(); }; }
