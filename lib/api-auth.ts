import { createClient } from '@/lib/supabase';

export async function authenticatedClient(request: Request) {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return null;
  const token = authorization.slice(7);
  const supabase = createClient(token);
  const { data, error } = await supabase.auth.getUser(token);
  return error || !data.user ? null : { supabase, user: data.user };
}

export function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}
