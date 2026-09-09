'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDownAZ, BriefcaseBusiness, LogOut, Pencil, Plus, Search, Trash2, UsersRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase';
import { contactSchema, type ContactInput, type Priority } from '@/lib/validation';

type Contact = ContactInput & { id: string; user_id: string; created_at: string; updated_at: string };
type User = { id: string; email?: string };
const blank: ContactInput = { name: '', company: '', role: '', met_at: '', notes: '', priority: 'medium' };

export default function Home() {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [form, setForm] = useState<ContactInput>(blank);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [priority, setPriority] = useState<'all' | Priority>('all');
  const [sort, setSort] = useState<'newest' | 'name' | 'priority'>('newest');
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const apiFetch = useCallback(async (path: string, init?: RequestInit) => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error('Your session has expired. Please sign in again.');
    const response = await fetch(path, {
      ...init,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...init?.headers },
    });
    const body = await response.json().catch(() => ({})) as { error?: string; contacts?: Contact[]; contact?: Contact };
    if (!response.ok) throw new Error(body.error || 'The request failed.');
    return body;
  }, [supabase]);

  const loadContacts = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const data = await apiFetch('/api/contacts');
      setContacts(data.contacts ?? []);
    } catch (error) {
      setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'Could not load contacts.' });
    }
    setLoading(false);
  }, [apiFetch]);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => { setUser(data.user as User | null); setAuthReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => { setUser((session?.user as User | undefined) ?? null); setAuthReady(true); });
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => { if (user) void loadContacts(); else setContacts([]); }, [user, loadContacts]);

  async function handleAuth(event: FormEvent) {
    event.preventDefault();
    setSaving(true); setMessage(null);
    const result = authMode === 'signin'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    setSaving(false);
    if (result.error) setMessage({ kind: 'error', text: result.error.message });
    else setMessage({ kind: 'success', text: authMode === 'signup' && !result.data.session ? 'Check your email to confirm your account.' : 'Welcome to your private network.' });
  }

  async function saveContact(event: FormEvent) {
    event.preventDefault();
    const parsed = contactSchema.safeParse(form);
    if (!parsed.success) { setMessage({ kind: 'error', text: parsed.error.issues[0]?.message ?? 'Please check the form.' }); return; }
    setSaving(true); setMessage(null);
    try {
      const data = await apiFetch(editingId ? `/api/contacts/${editingId}` : '/api/contacts', {
        method: editingId ? 'PATCH' : 'POST',
        body: JSON.stringify(parsed.data),
      });
      if (!data.contact) throw new Error('The server returned an incomplete response.');
      setContacts((current) => editingId ? current.map((item) => item.id === editingId ? data.contact! : item) : [data.contact!, ...current]);
      setForm(blank); setEditingId(null);
      setMessage({ kind: 'success', text: editingId ? 'Contact updated.' : 'Contact added.' });
    } catch (error) {
      setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'Could not save contact.' });
    } finally {
      setSaving(false);
    }
  }

  function editContact(contact: Contact) {
    setEditingId(contact.id);
    setForm({ name: contact.name, company: contact.company, role: contact.role, met_at: contact.met_at, notes: contact.notes, priority: contact.priority });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function deleteContact(contact: Contact) {
    if (!window.confirm(`Delete ${contact.name}? This cannot be undone.`)) return;
    try {
      await apiFetch(`/api/contacts/${contact.id}`, { method: 'DELETE' });
      setContacts((current) => current.filter((item) => item.id !== contact.id));
      setMessage({ kind: 'success', text: 'Contact deleted.' });
    } catch (error) {
      setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'Could not delete contact.' });
    }
  }

  const visibleContacts = useMemo(() => {
    const rank = { high: 0, medium: 1, low: 2 };
    return contacts.filter((contact) => {
      const haystack = `${contact.name} ${contact.company} ${contact.role} ${contact.met_at} ${contact.notes}`.toLowerCase();
      return haystack.includes(query.toLowerCase()) && (priority === 'all' || contact.priority === priority);
    }).sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name) : sort === 'priority' ? rank[a.priority] - rank[b.priority] : b.created_at.localeCompare(a.created_at));
  }, [contacts, query, priority, sort]);

  if (!authReady) return <main className="grid min-h-screen place-items-center"><p className="text-sm text-muted-foreground">Opening your network…</p></main>;

  if (!user) return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-10">
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <section className="relative w-full max-w-md rounded-[2rem] border bg-card/90 p-7 shadow-2xl shadow-blue-950/10 backdrop-blur sm:p-9">
        <div className="mb-8 flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-primary text-primary-foreground"><UsersRound className="size-5" /></span><div><p className="font-heading text-lg font-bold">Berkeley Network</p><p className="text-xs text-muted-foreground">Your relationships, kept private.</p></div></div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">Private by design</p>
        <h1 className="text-3xl font-bold tracking-tight">{authMode === 'signin' ? 'Welcome back.' : 'Start your network.'}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Sign in to keep track of the people you meet across Berkeley.</p>
        <form onSubmit={handleAuth} className="mt-7 space-y-4">
          <label className="block text-sm font-semibold">Email<Input className="mt-2 h-11" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></label>
          <label className="block text-sm font-semibold">Password<Input className="mt-2 h-11" type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'} /></label>
          {message && <p role="alert" className={`rounded-xl px-3 py-2.5 text-sm ${message.kind === 'error' ? 'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-800'}`}>{message.text}</p>}
          <Button className="h-11 w-full" disabled={saving}>{saving ? 'Please wait…' : authMode === 'signin' ? 'Sign in' : 'Create account'}</Button>
        </form>
        <button className="mt-5 w-full text-sm font-semibold text-primary hover:underline" onClick={() => { setAuthMode(authMode === 'signin' ? 'signup' : 'signin'); setMessage(null); }}>{authMode === 'signin' ? 'New here? Create an account' : 'Already have an account? Sign in'}</button>
      </section>
    </main>
  );

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-10"><div className="mx-auto max-w-7xl">
      <header className="flex items-center justify-between border-b py-3"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground"><UsersRound className="size-5" /></span><div><p className="font-heading font-bold">Berkeley Network</p><p className="hidden text-xs text-muted-foreground sm:block">{user.email}</p></div></div><Button variant="outline" onClick={() => void supabase.auth.signOut()}><LogOut /> Sign out</Button></header>
      <section className="grid gap-6 py-7 lg:grid-cols-[23rem_1fr]">
        <form onSubmit={saveContact} className="h-fit rounded-[1.5rem] border bg-card p-5 shadow-sm lg:sticky lg:top-6">
          <div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Contact details</p><h1 className="mt-1 text-2xl font-bold">{editingId ? 'Edit contact' : 'Add someone'}</h1></div><span className="grid size-10 place-items-center rounded-xl bg-secondary text-primary">{editingId ? <Pencil className="size-4" /> : <Plus className="size-5" />}</span></div>
          <div className="space-y-3">
            <label className="block text-sm font-semibold">Name *<Input className="mt-1.5" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Maya Chen" /></label>
            <div className="grid grid-cols-2 gap-3"><label className="block text-sm font-semibold">Company<Input className="mt-1.5" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></label><label className="block text-sm font-semibold">Role<Input className="mt-1.5" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} /></label></div>
            <label className="block text-sm font-semibold">Where you met<Input className="mt-1.5" value={form.met_at} onChange={(e) => setForm({ ...form, met_at: e.target.value })} placeholder="Soda Hall meetup" /></label>
            <label className="block text-sm font-semibold">Priority<select className="mt-1.5 h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label>
            <label className="block text-sm font-semibold">Notes<Textarea className="mt-1.5 min-h-24" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="What should you remember?" /></label>
          </div>
          <div className="mt-5 flex gap-2"><Button className="flex-1" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Save changes' : 'Add contact'}</Button>{editingId && <Button type="button" variant="outline" onClick={() => { setEditingId(null); setForm(blank); }}>Cancel</Button>}</div>
        </form>
        <section>
          <div className="mb-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Your people</p><h2 className="mt-1 text-3xl font-bold tracking-tight">Stay thoughtfully connected.</h2><p className="mt-2 text-sm text-muted-foreground">Only you can view and manage these contacts.</p></div>
          <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]"><label className="relative"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><Input className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search names, companies, notes…" aria-label="Search contacts" /></label><select className="h-10 rounded-md border bg-background px-3 text-sm" value={priority} onChange={(e) => setPriority(e.target.value as 'all' | Priority)} aria-label="Filter by priority"><option value="all">All priorities</option><option value="high">High priority</option><option value="medium">Medium priority</option><option value="low">Low priority</option></select><label className="relative"><ArrowDownAZ className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" /><select className="h-10 rounded-md border bg-background pl-9 pr-3 text-sm" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label="Sort contacts"><option value="newest">Newest</option><option value="name">Name</option><option value="priority">Priority</option></select></label></div>
          {message && <p role="status" className={`mb-4 rounded-xl px-4 py-3 text-sm ${message.kind === 'error' ? 'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-800'}`}>{message.text}</p>}
          {loading ? <div className="rounded-2xl border bg-card p-10 text-center text-sm text-muted-foreground">Loading your contacts…</div> : visibleContacts.length === 0 ? <div className="rounded-2xl border border-dashed bg-card/60 p-10 text-center"><UsersRound className="mx-auto size-8 text-primary" /><h3 className="mt-3 font-bold">{contacts.length ? 'No contacts match' : 'Your network starts here'}</h3><p className="mt-1 text-sm text-muted-foreground">{contacts.length ? 'Try a broader search or filter.' : 'Add the first person you want to stay connected with.'}</p></div> : <div className="grid gap-3">{visibleContacts.map((contact) => <article key={contact.id} className="rounded-2xl border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-secondary font-heading font-bold text-primary">{contact.name.charAt(0).toUpperCase()}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-lg font-bold">{contact.name}</h3><span className={`priority priority-${contact.priority}`}>{contact.priority}</span></div><p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground"><BriefcaseBusiness className="size-3.5" /> {[contact.role, contact.company].filter(Boolean).join(' at ') || 'No role added'}</p>{contact.met_at && <p className="mt-1 text-sm text-muted-foreground">Met at {contact.met_at}</p>}{contact.notes && <p className="mt-3 rounded-xl bg-muted/60 p-3 text-sm leading-6">{contact.notes}</p>}</div><div className="flex gap-1"><Button size="icon-sm" variant="ghost" aria-label={`Edit ${contact.name}`} onClick={() => editContact(contact)}><Pencil /></Button><Button size="icon-sm" variant="ghost" aria-label={`Delete ${contact.name}`} onClick={() => void deleteContact(contact)}><Trash2 /></Button></div></div></article>)}</div>}
          <footer className="mt-5 flex items-center justify-between text-xs text-muted-foreground"><span>{visibleContacts.length} of {contacts.length} contacts</span><span>Private to {user.email}</span></footer>
        </section>
      </section>
    </div></main>
  );
}
