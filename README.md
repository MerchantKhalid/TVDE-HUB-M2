# TVDE Hub Portugal

Bilingual (PT-PT / EN) marketplace connecting TVDE drivers, fleet owners and customers.
Stack: Next.js 15 (App Router) · React 19 · TypeScript (strict) · Prisma · Neon Postgres · next-intl · Tailwind CSS.

## Requirements
- Node.js 20+
- A free [Neon](https://neon.tech) project

## 1. Install
```bash
npm install
cp .env.example .env
```

## 2. Neon setup (two connection strings)
In the Neon dashboard → **Connect**:

| Variable       | Which string                                  | Used for              |
| -------------- | --------------------------------------------- | --------------------- |
| `DATABASE_URL` | **Pooled** (host contains `-pooler`)          | App runtime queries   |
| `DIRECT_URL`   | **Direct** (toggle "Pooled connection" off)   | `prisma migrate`      |

- Append `&pgbouncer=true&connect_timeout=15` to the pooled `DATABASE_URL`.
- Both need `?sslmode=require`.
- `schema.prisma` declares `url = env("DATABASE_URL")` and `directUrl = env("DIRECT_URL")`.

## 3. Database
```bash
npm run db:migrate -- --name init   # creates tables
npm run db:seed                     # ~20 drivers, 8 fleets, reviews, requests, 1 admin
npm run db:studio                   # optional: browse data
```
Seed accounts:
- Admin: `admin@tvdehub.pt` / value of `SEED_ADMIN_PASSWORD`
- Any sample user: `<slug>@example.com` / `Password123!` (e.g. `joao-silva@example.com`)

### Optional: DB check constraint for ratings
After the first migration, add to a new migration (`npx prisma migrate dev --create-only --name rating_check`):
```sql
ALTER TABLE "Review" ADD CONSTRAINT "Review_rating_range" CHECK ("rating" BETWEEN 1 AND 5);
```

## 4. Run
```bash
npm run dev      # http://localhost:3000 → redirects to /pt
```

## Scripts
`dev`, `build`, `start`, `lint`, `typecheck`, `format`, `db:migrate`, `db:deploy`, `db:seed`, `db:studio`, `db:reset`.

## i18n
- Locales: `pt` (default), `en`. Messages in `messages/*.json`.
- Never hardcode UI text. Add keys to **both** files.
- Use `Link`, `useRouter`, `usePathname` from `@/i18n/navigation`, not from `next/*`.

## Design tokens
Defined as RGB channel variables in `src/app/globals.css` and mapped in `tailwind.config.ts`
(light + dark). Primary green `#0B6E4F`, accent red `#D7263D`, gold `#F2B705`.

## M2: Auth, profiles, documents
```bash
npm install
npx auth secret            # writes AUTH_SECRET to .env.local; copy it into .env
npm run dev
```
- Register at `/pt/register` (or log in with a seed account). Google login is optional (`AUTH_GOOGLE_ID/SECRET`).
- Dashboard: `/pt/dashboard` (overview, profile, vehicles, documents). Admin lands on `/pt/admin` (placeholder until M5).
- Storage: without Blob tokens, files go to `public/uploads` (photos) and `.private-uploads` (documents). Production needs two Vercel Blob stores (one Public, one Private): `BLOB_PUBLIC_READ_WRITE_TOKEN`, `BLOB_PRIVATE_READ_WRITE_TOKEN`.
- Documents are only readable via `/api/documents/[id]/file` (owner or admin; admin views are audit-logged).
- Rate limiting is in-memory (per instance). Swap for Upstash Redis before launch (`src/lib/rate-limit.ts`).

## Roadmap
M1 setup ✅ · M2 auth + profiles + uploads ✅ · M3 public pages · M4 connections + requests + email · M5 reviews + admin + cron · M6 SEO, tests, deploy.# TVDE-HUB-M2
