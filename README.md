# Berkeley Network

Berkeley Network is a secure, mobile-friendly relationship tracker for Berkeley students. Users sign in, record the people they meet, and search, sort, edit, or delete those records. React powers the frontend, Node.js route handlers provide the backend, and Supabase Auth plus PostgreSQL Row Level Security keep every account's contacts private.

## Live application

**Vercel URL:** https://berkeley-network-one.vercel.app

**Public repository:** https://github.com/jennawang1121/berkeley-network

## Grading evidence

Add the final screenshots after deploying to Vercel:

- [ ] Sign up, sign in, and sign out
- [ ] Create, refresh, edit, and delete a contact
- [ ] Invalid input rejected with a clear message
- [ ] Two-account privacy verification
- [x] Automated validation and RLS migration tests

## Features

- Email/password sign-up, sign-in, persistent sessions, and sign-out
- Private create, view, edit, and delete contact operations
- Name, company, role, where met, notes, and priority fields
- Text search, priority filter, and sorting by newest, name, or priority
- Clear loading, empty, success, validation, and server-error states
- Responsive phone, tablet, and desktop layout

## Technology stack

- **React 19:** interactive frontend
- **Next.js 16 and Node.js:** authenticated backend API routes
- **Supabase Auth:** identity and session tokens
- **Supabase Postgres:** durable contact storage
- **PostgreSQL RLS:** database-enforced ownership
- **Zod and Vitest:** shared validation and automated tests
- **Tailwind CSS and shadcn/ui:** responsive design system
- **Vercel:** production hosting

## Architecture

~~~text
React frontend
  -> Supabase Auth session
  -> bearer access token
Next.js Node.js backend
  -> verifies the token
  -> validates data with Zod
  -> queries with the user's token
Supabase Postgres
  -> CHECK constraints
  -> auth.uid() RLS ownership policies
~~~

The frontend never receives a database password or service-role key. The public anonymous key cannot bypass RLS.

- **app/page.tsx:** React UI, auth, search, filtering, and sorting
- **app/api/contacts/route.ts:** Node GET and POST endpoints
- **app/api/contacts/[id]/route.ts:** Node PATCH and DELETE endpoints
- **lib/api-auth.ts:** server-side token verification
- **lib/validation.ts:** contact validation
- **supabase/migrations/001_contacts.sql:** schema, constraints, and policies

## Local setup

1. Clone this repository and enter its directory.
2. Install Node.js 22 or newer.
3. Run **npm install**.
4. Create or open a Supabase project.
5. Run **supabase/migrations/001_contacts.sql** in the Supabase SQL Editor.
6. Copy **.env.example** to **.env.local**.
7. Add the project URL and public anon key.
8. Run **npm run dev** and open **http://localhost:3000**.

If email confirmation is enabled, confirm the account before signing in.

## Environment variables

| Variable | Visibility | Purpose |
| --- | --- | --- |
| NEXT_PUBLIC_SUPABASE_URL | Public | Supabase HTTPS project endpoint |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Public | Public client key; RLS protects all rows |

The example file contains placeholders only. Local environment files and Vercel metadata are ignored by Git. Never add the service-role key or Postgres connection string to frontend code.

## Database schema

| Column | Type | Rules |
| --- | --- | --- |
| id | uuid | Generated primary key |
| user_id | uuid | Not null; defaults to auth.uid(); references auth.users |
| name | text | Required; trimmed length 1–120 |
| company | text | Defaults to empty; maximum 1,000 characters |
| role | text | Defaults to empty; maximum 1,000 characters |
| met_at | text | Defaults to empty; maximum 1,000 characters |
| notes | text | Defaults to empty; maximum 1,000 characters |
| priority | text | Only high, medium, or low |
| created_at | timestamptz | Defaults to now |
| updated_at | timestamptz | Maintained by trigger |

An index on **(user_id, created_at desc)** supports the primary list query.

## Authentication and RLS

RLS is enabled and forced on **public.contacts**. Four separate policies apply to authenticated users:

- SELECT uses **auth.uid() = user_id**
- INSERT uses **WITH CHECK (auth.uid() = user_id)**
- UPDATE uses both **USING** and **WITH CHECK**, preventing ownership transfer
- DELETE uses **auth.uid() = user_id**

Anonymous access is revoked. The Node backend forwards each user's token, so it cannot bypass these policies.

### Two-account privacy test

1. Create User A and add a recognizable contact.
2. Record the contact UUID from User A's network response.
3. Sign out and create User B.
4. Confirm User A's contact is absent.
5. Using User B's token, PATCH and DELETE User A's UUID.
6. Confirm both fail and the record remains unchanged.
7. Sign back in as User A and capture the unchanged record.

## Automated tests

Run **npm test**. The suite verifies valid data, blank-name rejection, invalid-priority rejection, RLS activation, four separate CRUD policies, and UPDATE ownership protection.

Also run:

~~~bash
npm run lint
npm run build
~~~

Database constraints repeat critical validation in trusted Postgres code.

The production Supabase migration was applied successfully. A direct request using only the public key was rejected with PostgreSQL error `42501`, confirming that anonymous users cannot read the contacts table.

## Deployment

1. Push this project to a public GitHub repository.
2. Import the repository into Vercel.
3. Add both Supabase environment variables to Development, Preview, and Production.
4. Deploy.
5. Add the Vercel production URL to Supabase Auth's Site URL and Redirect URLs.
6. Open the deployment privately and run the two-account privacy test.
7. Add the live URL and evidence screenshots above.

## Verification checklist

- [x] React frontend and Node.js backend separated
- [x] Authentication and full contact CRUD implemented
- [x] Search, filter, sort, persistence, and responsive states implemented
- [x] Per-user SELECT, INSERT, UPDATE, and DELETE RLS policies
- [x] Server and database validation
- [x] Automated tests
- [x] Secret-bearing environment files ignored
- [x] Supabase migration applied to production
- [x] Public GitHub repository created
- [x] Vercel production deployment completed
- [ ] Production two-account evidence added

## Known limitations and next steps

- Email/password is the only sign-in method; Berkeley SSO could be added later.
- Browser filtering is appropriate for a small personal list; server pagination would help at scale.
- A connected Supabase test project would enable automated integration tests in CI.
- Evidence screenshots require a configured production project and two test accounts.
