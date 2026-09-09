import { z } from 'zod';
import { authenticatedClient, jsonError } from '@/lib/api-auth';
import { contactSchema } from '@/lib/validation';

export const runtime = 'nodejs';
const idSchema = z.string().uuid();

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await authenticatedClient(request);
  if (!auth) return jsonError('Authentication required.', 401);
  const { id } = await context.params;
  if (!idSchema.safeParse(id).success) return jsonError('Invalid contact ID.', 400);
  const parsed = contactSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? 'Invalid contact.', 422);
  const { data, error } = await auth.supabase.from('contacts').update(parsed.data).eq('id', id).select().single();
  return error ? jsonError(error.message, 404) : Response.json({ contact: data });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await authenticatedClient(request);
  if (!auth) return jsonError('Authentication required.', 401);
  const { id } = await context.params;
  if (!idSchema.safeParse(id).success) return jsonError('Invalid contact ID.', 400);
  const { data, error } = await auth.supabase.from('contacts').delete().eq('id', id).select('id').single();
  return error ? jsonError(error.message, 404) : Response.json({ deleted: data.id });
}
