'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { ArrowRight, Check, CircleAlert, RefreshCw, Sparkles, UsersRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

const SIGNUPS_URL = 'https://class2-signups-fall26.vercel.app/api/signups';
type Signup = { name: string };
type ModelContext = {
  registerTool: (
    tool: {
      name: string;
      title: string;
      description: string;
      inputSchema: object;
      annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
      execute: (input: unknown) => Promise<object>;
    },
    options: { signal: AbortSignal },
  ) => void | Promise<void>;
};

async function getErrorMessage(response: Response, fallback: string) {
  try {
    const result = (await response.json()) as { error?: string };
    return result.error || fallback;
  } catch {
    return fallback;
  }
}

export default function Home() {
  const [signups, setSignups] = useState<Signup[]>([]);
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string }>();

  const loadSignups = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const response = await fetch(SIGNUPS_URL, { cache: 'no-store' });
      if (!response.ok) throw new Error(await getErrorMessage(response, 'Could not load signups.'));
      const result = (await response.json()) as { signups?: Signup[] };
      setSignups(Array.isArray(result.signups) ? result.signups : []);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Could not reach the signup service. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void loadSignups(); }, [loadSignups]);

  const createSignup = useCallback(async (rawName: string) => {
    const trimmedName = rawName.trim();
    if (!trimmedName) throw new Error('Please enter your name.');

    const response = await fetch(SIGNUPS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmedName }),
    });
    if (!response.ok) {
      const fallback = response.status === 409
        ? 'That name is already signed up.'
        : response.status >= 500
          ? 'The signup service had a problem. Please try again.'
          : 'Could not sign you up.';
      throw new Error(response.status === 409 ? fallback : await getErrorMessage(response, fallback));
    }

    const result = (await response.json()) as { signup: Signup };
    setSignups((current) => [result.signup, ...current.filter((signup) => signup.name !== result.signup.name)]);
    return result.signup;
  }, []);

  useEffect(() => {
    const context = (document as Document & { modelContext?: ModelContext }).modelContext;
    if (!context?.registerTool) return;

    const lifecycle = new AbortController();
    try {
      void Promise.resolve(context.registerTool({
        name: 'add_class_signup',
        title: 'Join Class 2',
        description: 'Add one public display name to the Class 2 signup list.',
        inputSchema: {
          type: 'object',
          properties: { name: { type: 'string', description: 'The public display name to add.' } },
          required: ['name'],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: true },
        async execute(input) {
          if (!input || typeof input !== 'object' || typeof (input as { name?: unknown }).name !== 'string') {
            throw new Error('A name is required.');
          }
          const signup = await createSignup((input as { name: string }).name);
          setName('');
          setFormMessage({ type: 'success', text: `You're on the list, ${signup.name}!` });
          return { signup, status: 'added' };
        },
      }, { signal: lifecycle.signal })).catch(() => undefined);
    } catch {
      return;
    }
    return () => lifecycle.abort();
  }, [createSignup]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormMessage({ type: 'error', text: 'Please enter your name.' });
      return;
    }

    setIsSubmitting(true);
    setFormMessage(undefined);
    try {
      const signup = await createSignup(trimmedName);
      setName('');
      setFormMessage({ type: 'success', text: `You're on the list, ${signup.name}!` });
    } catch (error) {
      setFormMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Could not reach the signup service. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden px-4 py-5 text-foreground sm:px-6 sm:py-8 lg:px-10 lg:py-10">
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between sm:mb-12">
          <a href="#main-content" className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-[0_8px_22px_-10px_var(--primary)]">
              <Sparkles className="size-[18px]" aria-hidden="true" />
            </span>
            <span><span className="block text-sm font-semibold tracking-tight">Agentic AI</span><span className="block text-xs text-muted-foreground">Class 2</span></span>
          </a>
          <div className="hidden items-center gap-2 rounded-full border border-border/80 bg-card/70 px-3 py-2 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur sm:flex">
            <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgb(16_185_129/12%)]" /> Fall 2026 cohort
          </div>
        </header>

        <div id="main-content" className="grid items-start gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10">
          <section className="flex flex-col lg:sticky lg:top-10">
            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-secondary-foreground">
              <UsersRound className="size-3.5" aria-hidden="true" /> Classroom signup
            </div>
            <h1 className="max-w-xl text-balance text-[clamp(2.5rem,7vw,5rem)] font-semibold leading-[0.98] tracking-[-0.055em]">Add your name to the room.</h1>
            <p className="mt-5 max-w-lg text-pretty text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">Join your classmates for the next session. Use a display name you’re comfortable sharing—nothing else is needed.</p>

            <form onSubmit={handleSubmit} className="mt-8 rounded-[1.75rem] border border-border/80 bg-card/88 p-4 shadow-[0_24px_70px_-36px_rgb(30_64_62/38%)] backdrop-blur sm:p-5">
              <Field>
                <FieldLabel htmlFor="name" className="text-sm font-semibold">Your name</FieldLabel>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    id="name" name="name" value={name}
                    onChange={(event) => { setName(event.target.value); if (formMessage?.type === 'error') setFormMessage(undefined); }}
                    placeholder="e.g. Ada Lovelace" autoComplete="name" required disabled={isSubmitting}
                    aria-describedby="name-help form-status"
                    className="h-12 flex-1 rounded-xl border-border bg-background/80 px-4 text-base shadow-inner shadow-black/[0.02]"
                  />
                  <Button type="submit" size="lg" disabled={isSubmitting || !name.trim()} className="h-12 rounded-xl px-5 text-sm shadow-[0_10px_22px_-12px_var(--primary)]">
                    {isSubmitting ? <><Spinner /> Joining…</> : <>Join the class <ArrowRight aria-hidden="true" /></>}
                  </Button>
                </div>
                <FieldDescription id="name-help" className="px-1 text-xs">Names only, please. This list is public to the class.</FieldDescription>
              </Field>
              <div id="form-status" aria-live="polite">
                {formMessage && (
                  <div className={`mt-3 flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm ${formMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`} role={formMessage.type === 'error' ? 'alert' : 'status'}>
                    {formMessage.type === 'success' ? <Check className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> : <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}
                    <span>{formMessage.text}</span>
                  </div>
                )}
              </div>
            </form>
          </section>

          <section aria-labelledby="signup-list-title" className="min-h-[34rem] rounded-[2rem] border border-border/80 bg-card/78 p-4 shadow-[0_30px_90px_-50px_rgb(30_64_62/45%)] backdrop-blur sm:p-6">
            <div className="flex items-end justify-between border-b border-border/80 pb-4 sm:pb-5">
              <div><p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Who’s joining</p><h2 id="signup-list-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">The class list</h2></div>
              {!isLoading && !loadError && <span className="rounded-full bg-secondary px-3 py-1.5 text-sm font-semibold tabular-nums text-secondary-foreground">{signups.length} {signups.length === 1 ? 'person' : 'people'}</span>}
            </div>
            <div className="pt-4" aria-live="polite">
              {isLoading ? (
                <div className="grid min-h-80 place-items-center text-center"><div><Spinner className="mx-auto size-6 text-primary" /><p className="mt-3 text-sm font-medium">Gathering the class list…</p></div></div>
              ) : loadError ? (
                <div className="grid min-h-80 place-items-center px-3 text-center"><div className="max-w-sm"><span className="mx-auto grid size-11 place-items-center rounded-full bg-rose-50 text-rose-700"><CircleAlert className="size-5" aria-hidden="true" /></span><h3 className="mt-4 font-semibold">We couldn’t load the list</h3><p className="mt-1.5 text-sm leading-6 text-muted-foreground">{loadError}</p><Button type="button" variant="outline" onClick={() => void loadSignups()} className="mt-5 h-10 rounded-xl px-4"><RefreshCw aria-hidden="true" /> Try again</Button></div></div>
              ) : signups.length === 0 ? (
                <div className="grid min-h-80 place-items-center px-3 text-center"><div className="max-w-xs"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-secondary text-primary"><Sparkles className="size-5" aria-hidden="true" /></span><h3 className="mt-4 font-semibold">Be the first one here</h3><p className="mt-1.5 text-sm leading-6 text-muted-foreground">Add your name and get this class list started.</p></div></div>
              ) : (
                <ol className="divide-y divide-border/70">
                  {signups.map((signup, index) => (
                    <li key={`${signup.name}-${index}`} className="group flex items-center gap-3 py-3.5 first:pt-1 sm:gap-4 sm:py-4">
                      <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-secondary text-sm font-bold text-primary transition-transform group-hover:-rotate-2 sm:size-11">{signup.name.trim().charAt(0).toLocaleUpperCase() || '?'}</span>
                      <span className="min-w-0 flex-1 truncate font-medium tracking-tight sm:text-lg">{signup.name}</span>
                      {index === 0 && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-800">Newest</span>}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </section>
        </div>
        <footer className="relative mt-8 flex flex-col gap-1 border-t border-border/70 py-5 text-xs leading-5 text-muted-foreground sm:mt-12 sm:flex-row sm:items-center sm:justify-between"><p>Built for Class 2 · Fall 2026</p><p>Please share only a display name you’re comfortable making public.</p></footer>
      </div>
    </main>
  );
}
