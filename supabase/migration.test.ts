import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(new URL('./migrations/001_contacts.sql', import.meta.url), 'utf8').toLowerCase();

describe('Supabase security migration', () => {
  it('enables and forces row level security', () => {
    expect(sql).toContain('alter table public.contacts enable row level security');
    expect(sql).toContain('alter table public.contacts force row level security');
  });

  it.each(['select', 'insert', 'update', 'delete'])('defines a policy for %s', (operation) => {
    expect(sql).toContain(`for ${operation} to authenticated`);
  });

  it('prevents ownership transfer during updates', () => {
    expect(sql).toMatch(/for update[\s\S]*using \(auth\.uid\(\) = user_id\)[\s\S]*with check \(auth\.uid\(\) = user_id\)/);
  });
});
