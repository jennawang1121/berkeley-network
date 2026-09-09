import { authenticatedClient, jsonError } from '@/lib/api-auth';
import { contactSchema } from '@/lib/validation';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const auth = await authenticatedClient(request);
  if (!auth) return jsonError('Authentication required.', 401);
  const { data, error } = await auth.supabase.from('contacts').select('*').order('created_at', { ascending: false });
  return error ? jsonError(error.message, 400) : Response.json({ contacts: data });
}

export async function POST(request: Request) {
  const auth = await authenticatedClient(request);
  if (!auth) return jsonError('Authentication required.', 401);
  const parsed = contactSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? 'Invalid contact.', 422);
  const { data, error } = await auth.supabase.from('contacts').insert(parsed.data).select().single();
  return error ? jsonError(error.message, 400) : Response.json({ contact: data }, { status: 201 });
}
