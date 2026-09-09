import { z } from 'zod';

const optionalText = z.string().trim().max(1000).default('');
export const contactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.').max(120, 'Name must be 120 characters or fewer.'),
  company: optionalText,
  role: optionalText,
  met_at: optionalText,
  notes: optionalText,
  priority: z.enum(['high', 'medium', 'low'], { message: 'Priority must be high, medium, or low.' }),
});
export type ContactInput = z.infer<typeof contactSchema>;
export type Priority = ContactInput['priority'];
