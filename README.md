# Berkeley Network

Berkeley Network is a secure, mobile-friendly relationship tracker for Berkeley students. Users sign in, record the people they meet, and search, sort, edit, or delete those records. React powers the frontend, Node.js route handlers provide the backend, and Supabase Auth plus PostgreSQL Row Level Security keep every account's contacts private.

## Live application

**Vercel URL:** https://berkeley-network-one.vercel.app

**Public repository:** https://github.com/jennawang1121/berkeley-network

## Grading evidence

The product walkthrough below covers the complete intended workflow. Production screenshots can be added to this section as additional visual evidence.

- [ ] Sign up, sign in, and sign out
- [ ] Create, refresh, edit, and delete a contact
- [ ] Invalid input rejected with a clear message
- [ ] Two-account privacy verification
- [x] Automated validation and RLS migration tests

## Product walkthrough

1. Open the live application and create an account with an email address and a password of at least six characters.
2. Confirm the email if Supabase email confirmation is enabled, then sign in.
3. Add a contact with a name and optional company, role, meeting location, priority, and notes.
4. Refresh the page to confirm the contact persists in Supabase.
5. Search, filter by priority, and sort the private contact list.
6. Edit the contact, save the changes, and then delete it using the confirmation dialog.
7. Sign out and confirm the private tracker is replaced by the authentication screen.

## Requirements coverage

### Functional requirements

| Requirement | Implementation |
| --- | --- |
| Sign up, sign in, and sign out | Supabase email/password authentication with persistent browser sessions |
| Add complete contact details | Name, company, role, meeting location, notes, and priority form fields |
| Restrict priority values | Zod and PostgreSQL both allow only `high`, `medium`, or `low` |
| View and sort contacts | Searchable list with newest, name, and priority sorting |
| Edit and delete contacts | Authenticated PATCH and DELETE Node.js API routes |
| Persist through refresh | Contacts are stored in Supabase Postgres and loaded after authentication |
| Reject invalid input clearly | Blank names and invalid priorities return specific validation messages |
| Understandable UI states | Dedicated loading, empty, success, validation, and server-error states |
| Web and mobile friendly | Responsive layout adapts from a single-column phone view to a desktop workspace |

### Security requirements and provider mapping

The course assignment specifies **Next.js + Supabase + Vercel**. Some later checklist wording refers to Neon's `text user_id`, `auth.user_id()`, and Data API. This implementation uses the direct Supabase equivalents: Supabase Auth user IDs are UUIDs, so `user_id` is `uuid not null default auth.uid()` and references `auth.users(id)`. Using `text` would discard the native type and weaken the foreign-key design.

| Requirement | Implementation or evidence status |
| --- | --- |
| Non-null authenticated owner | `user_id uuid not null default auth.uid()` with an `auth.users` foreign key |
| Row Level Security | RLS is enabled and forced on `public.contacts` |
| Separate CRUD policies | Dedicated SELECT, INSERT, UPDATE, and DELETE policies target `authenticated` users |
| Owner-only rows | Every policy compares `auth.uid()` with `user_id` |
| Prevent ownership transfer | UPDATE has both `using` and `with check` ownership expressions |
| Two-account production proof | Implementation is ready; final production evidence is still pending |
| Public browser configuration | Only the Supabase project URL and publishable key are exposed; anonymous table access is revoked |
| Secrets remain server-only | No service-role key, database connection string, or cookie secret is used or committed; local environment files are ignored |

## Features

- Email/password sign-up, sign-in, persistent sessions, and sign-out
- Private create, view, edit, and delete contact operations
- Name, company, role, where met, notes, and priority fields
- Text search, priority filter, and sorting by newest, name, or priority
- Clear loading, empty, success, validation, and server-error states
- Responsive phone, tablet, and desktop layout

## Technology stack

| Technology | Role and reason for choosing it |
| --- | --- |
| React 19 | Builds a responsive, stateful contact-management interface from reusable components. |
| Next.js 16 and Node.js | Keep the React frontend and authenticated backend API in one deployable project. |
| Supabase Auth | Provides email/password identity, secure sessions, and signed access tokens. |
| Supabase Postgres | Provides durable relational storage and integrates directly with Supabase Auth. |
| PostgreSQL RLS | Enforces contact ownership in the database even if an API request is malformed. |
| Zod and Vitest | Share input validation rules and provide fast automated regression tests. |
| Tailwind CSS and shadcn/ui | Provide accessible UI primitives and a responsive design system. |
| Vercel | Provides managed Next.js builds, Node.js functions, HTTPS, and production hosting. |

## Architecture

~~~text
Browser
  -> React frontend hosted by Vercel
  -> Supabase Auth session and bearer access token
Vercel Node.js backend
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

1. Clone this repository and enter its directory:

~~~bash
git clone https://github.com/jennawang1121/berkeley-network.git
cd berkeley-network
~~~

2. Install Node.js 22 or newer.
3. Install dependencies with **npm install**.
4. Create or open a Supabase project.
5. Run **supabase/migrations/001_contacts.sql** in the Supabase SQL Editor.
6. Run **cp .env.example .env.local**.
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

Latest local result:

~~~text
Test Files  2 passed (2)
Tests       9 passed (9)
~~~

Also run:

~~~bash
npm run lint
npm run build
~~~

Database constraints repeat critical validation in trusted Postgres code.

The production Supabase migration was applied successfully. A direct request using only the public key was rejected with PostgreSQL error `42501`, confirming that anonymous users cannot read the contacts table.

## Deployment

1. Push this project to a public GitHub repository.
2. Import the repository into Vercel or run **vercel deploy --prod** from the project directory.
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
