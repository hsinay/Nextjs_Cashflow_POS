# Copilot Instructions for POS/ERP System

**Project:** POS/ERP Management System  
**Stack:** Next.js 14 + TypeScript + PostgreSQL + Prisma + NextAuth v4  
**Architecture:** Full-stack monolith with API routes, hierarchical categories, and role-based access control

---

## Architecture Overview

### Core Structure

- **Frontend:** Next.js 14 App Router with Server/Client components
- **Backend:** API Routes (`/app/api/*`) with NextAuth authentication
- **Database:** PostgreSQL via Prisma ORM with hierarchical category support
- **Styling:** Tailwind CSS + Shadcn UI components

### Key Data Models (Prisma)

1. **User** - Authentication users with `username`/`email`, indexed for fast lookups
2. **Role** - RBAC roles (ADMIN, INVENTORY_MANAGER) with JSON permissions array
3. **UserRole** - Many-to-many junction table for user-role relationships
4. **Category** - Hierarchical categories with self-referencing parent relation (prevents circular refs)
5. **Product** - Related to categories with stock tracking

### Route Structure

- **Protected Routes:** `/dashboard/*` protected via NextAuth middleware
- **Auth Routes:** `/login`, `/register` in `(auth)` route group
- **API Pattern:** `/api/[resource]/` for list/create, `/api/[resource]/[id]/` for detail operations
- **Fallback Pages:** `(dashboard)` mirrors API structure for consistency

---

## Authentication & Authorization

### Authentication Flow (NextAuth v4)

1. **CredentialsProvider** - Username/email + password validation against Prisma User model
2. **Password Hashing** - bcryptjs (10 salt rounds), never returned in responses
3. **Session Strategy** - JWT tokens in httpOnly cookies (7-day expiry, daily refresh)
4. **Protected Routes** - Middleware at `middleware.ts` checks token before dashboard access

**Key Files:**

- `lib/auth.ts` - NextAuth configuration with custom JWT encoding (includes `userId`, `username`, `roles`, `permissions`)
- `middleware.ts` - Route protection (protects `/dashboard/*`, `/api/users`, `/api/roles`)
- `app/api/auth/[...nextauth]/route.ts` - NextAuth handler

### Authorization Pattern

1. All protected API endpoints call `getServerSession(authOptions)` to get session
2. Check required roles from session.user.roles (populated from DB on login)
3. Return 403 Forbidden if user lacks required role

**Example (see `app/api/categories/route.ts`):**

```typescript
const session = await getServerSession(authOptions);
if (!session?.user)
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
const hasPermission =
  session.user.roles.includes("ADMIN") ||
  session.user.roles.includes("INVENTORY_MANAGER");
if (!hasPermission)
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
```

---

## Validation & Error Handling

### Zod Schema Pattern

All input validation uses Zod schemas in `lib/validations/*.schema.ts`:

```typescript
// Define schema, export both schema and inferred type
export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  parentCategoryId: z.string().uuid().optional().nullable(),
});
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
```

### Service Layer Pattern

- `services/*.service.ts` contains all business logic and DB operations
- Services validate input with `schema.parse()` or `schema.parseAsync()`
- Services throw descriptive errors with context
- Example: `services/category.service.ts` handles circular reference detection, tree building

### API Route Pattern (see `app/api/categories/route.ts`)

```typescript
try {
  // 1. Validate input with schema
  const body = await req.json();
  const validated = await schema.parse(body);

  // 2. Check auth/permissions
  const session = await getServerSession(authOptions);
  if (!hasPermission) return error(403, "Forbidden");

  // 3. Call service layer
  const result = await service.create(validated);

  // 4. Return standardized response
  return NextResponse.json({ success: true, data: result }, { status: 201 });
} catch (error) {
  return NextResponse.json(
    { success: false, error: error.message },
    { status: 500 }
  );
}
```

---

## Component Patterns

### Client Components (`'use client'`)

- Use `react-hook-form` + `@hookform/resolvers` for form state management
- Combine with Zod validation: `zodResolver(schema)`
- Shadcn UI form primitives for consistent styling

**Example pattern (see `components/categories/category-form.tsx`):**

```tsx
"use client";
const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { name: "", parentCategoryId: null },
});
const onSubmit = async (data) => {
  const res = await fetch("/api/categories", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) setError(res.statusText);
  else router.refresh(); // Refresh server data after mutation
};
```

### Server Components (Default)

- Page components in `app/(dashboard)/` are server components by default
- Fetch data directly in page components (no extra loading state needed)
- Pass data to client child components via props

**Fetch Pattern (see pages like `app/(dashboard)/categories/page.tsx`):**

```tsx
// Server component - direct Prisma/service calls
export default async function CategoriesPage() {
  const categories = await getAllCategories();
  return <CategoryList data={categories} />;
}
```

---

## Hierarchical Categories Implementation

### Data Structure

- **Self-referencing relation:** `Category.parentCategoryId` → `Category.id`
- **Tree building:** `services/category.service.ts` recursively builds tree from flat array
- **Circular reference prevention:** `checkCircularReference()` traverses parent chain before update

### API Behavior

- `GET /api/categories` returns hierarchical tree by default
- `GET /api/categories?flat=true` returns flat list (for dropdowns)
- `PUT /api/categories/[id]` validates no circular refs before updating parent

### Display

- `components/categories/category-tree.tsx` renders tree with expand/collapse
- Products filtered by category show only children in category selector

---

## Development Workflows

### Setup & Running

```bash
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Build for production
npm run lint             # Run ESLint
npm run prisma:generate  # Regenerate Prisma client (after schema changes)
npm run prisma:migrate   # Create new migration
npm run db:push          # Push schema to DB without migration
npm run db:seed          # Run seed script (prisma/seed.ts)
```

### Database Operations

1. **Schema Changes:** Edit `prisma/schema.prisma`, then run `npm run prisma:migrate`
2. **Migrations:** Auto-created in `prisma/migrations/` - commit these to version control
3. **Type Safety:** After schema changes, Prisma Client auto-generates types in `node_modules/.prisma/`

### Testing Endpoints

- Use `curl`, Postman, or VS Code REST Client
- Include `Cookie: next-auth.session-token=...` for authenticated requests
- Or use browser login at `/login` first

---

## Path Aliases (tsconfig.json)

Use these aliases throughout the codebase:

- `@/*` → root directory (can import `@/prisma`, `@/services`, etc.)
- `@/app/*` → `./app/`
- `@/components/*` → `./components/`
- `@/lib/*` → `./lib/`
- `@/services/*` → `./services/`
- `@/types/*` → `./types/`

**Example:** `import { getAllCategories } from '@/services/category.service';`

---

## Common Tasks

### Adding a New Resource Module (e.g., Suppliers)

1. **Schema:** Add `model Supplier { ... }` to `prisma/schema.prisma`
2. **Service:** Create `services/supplier.service.ts` with CRUD operations
3. **Validation:** Create `lib/validations/supplier.schema.ts` with Zod schemas
4. **API Routes:** Create `app/api/suppliers/route.ts` and `app/api/suppliers/[id]/route.ts`
5. **Types:** Export TypeScript types in `types/supplier.types.ts`
6. **UI:** Create page components in `app/(dashboard)/suppliers/` and form in `components/suppliers/`
7. **Permissions:** Add new permission to Role permissions in seed.ts

### Fixing Auth Issues

- Check `.env.local` has `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `DATABASE_URL`
- Run `npm run prisma:generate` if Prisma client seems out of sync
- Test `/api/auth/me` endpoint (requires valid session token)
- Check middleware.ts protectedRoutes list matches actual protected routes

### Database Connection Issues

- Verify PostgreSQL is running and URL in `.env.local` is correct
- Run `npm run db:push` to sync schema without migration
- Check `prisma.ts` exports singleton client correctly

---

## Important Notes

- **No direct REST client config:** Authentication is session-based (NextAuth), not bearer tokens
- **Type safety critical:** Enable strict mode in `tsconfig.json` - run `npm run lint` regularly
- **Route groups:** Use `(auth)` and `(dashboard)` for layout organization, not URL structure
- **API consistency:** Always return `{ success: boolean, data?: any, error?: string }` format
- **Fresh data:** Use `router.refresh()` in client components after mutations, not client-side state updates
- **Circular refs:** Category module prevents parent=descendant; reuse this pattern for other hierarchies
