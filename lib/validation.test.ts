import { describe, expect, it } from 'vitest';
import { contactSchema } from './validation';

const valid = { name: 'Maya Chen', company: 'Cal', role: 'Researcher', met_at: 'Soda Hall', notes: '', priority: 'high' };
describe('contact validation', () => {
  it('accepts a valid contact', () => expect(contactSchema.safeParse(valid).success).toBe(true));
  it('rejects an empty name', () => expect(contactSchema.safeParse({ ...valid, name: '   ' }).success).toBe(false));
  it('rejects an invalid priority', () => expect(contactSchema.safeParse({ ...valid, priority: 'urgent' }).success).toBe(false));
});
