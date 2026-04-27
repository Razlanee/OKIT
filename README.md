# OKIT LTMS - Learning & Training Management System

An enterprise-grade, multi-tenant SaaS platform for educational institutions built on **Zero-Trust** principles.

## Tech Stack

- **Framework:** Next.js 15 (App Router) + TypeScript
- **Database:** Prisma ORM with SQLite (swap to PostgreSQL for production)
- **Auth:** NextAuth.js v5 with JWT + role-based access control
- **Styling:** Tailwind CSS 4
- **Payment:** PayMongo integration (GCash, Maya, Card)

## Quick Start

```bash
# Install dependencies
npm install

# Generate Prisma client & push schema
npx prisma generate
npx prisma db push

# Seed demo data (run the dev server first, then POST to /api/seed)
npm run dev
# In another terminal:
curl -X POST http://localhost:3000/api/seed

# Access the app
open http://localhost:3000
```

## Demo Credentials

After seeding, use these accounts (password for all: `admin123`):

| Role | Email | Access |
|------|-------|--------|
| Super Admin | superadmin@okit.com | Platform management |
| Admin | admin@mmti.edu.ph | Institution configuration |
| Operator | operator@mmti.edu.ph | Student enrollment |
| Cashier | cashier@mmti.edu.ph | Payment processing |
| Instructor | instructor@mmti.edu.ph | Content & grading |
| Student | student@mmti.edu.ph | Learning portal |

## System Architecture

### Zero-Trust Enforcement Gates

1. **Financial Gate:** Students cannot access materials until payment is cleared
2. **Engagement Gate:** 75% participation threshold required for final exams
3. **Grading Formula:** Locked at 20% Quizzes + 30% Assignments + 50% Exams

### Role Boundaries

- **Super Admin:** Cannot access institutional internal data
- **Admin:** Cannot process payments or override grades
- **Operator:** Cannot collect cash or alter tuition prices
- **Cashier:** Cannot enroll students or view academic records
- **Instructor:** Cannot view finances or change enrollment status
- **Student:** Cannot access anything until payment is cleared

## Project Structure

```
src/
├── app/
│   ├── api/                  # API routes
│   │   ├── auth/             # NextAuth handlers
│   │   ├── institutions/     # Institution CRUD + approval
│   │   ├── departments/      # Academic hierarchy
│   │   ├── programs/
│   │   ├── subjects/
│   │   ├── year-levels/
│   │   ├── tuition-rates/    # Financial setup
│   │   ├── misc-fees/
│   │   ├── users/            # Staff management
│   │   ├── enrollments/      # Enrollment processing
│   │   ├── payments/         # Payment processing
│   │   ├── course-content/   # Learning materials
│   │   ├── attendance/       # Attendance logging
│   │   ├── quizzes/          # Quiz management
│   │   ├── gradebook/        # Grade computation
│   │   ├── participation/    # Participation meter
│   │   ├── certificates/     # Certificate generation
│   │   ├── webhooks/         # PayMongo webhooks
│   │   └── seed/             # Demo data seeder
│   ├── dashboard/
│   │   ├── super-admin/      # Platform management
│   │   ├── admin/            # Institution config
│   │   ├── operator/         # Enrollment desk
│   │   ├── cashier/          # Payment window
│   │   ├── instructor/       # Teaching tools
│   │   └── student/          # Learning portal
│   ├── login/
│   ├── request-account/
│   └── unauthorized/
├── components/
│   ├── ui/                   # Reusable UI components
│   └── layout/               # Dashboard layout + sidebar
├── lib/
│   ├── auth.ts               # NextAuth configuration
│   ├── auth-guard.ts         # Role-based route protection
│   ├── db.ts                 # Prisma client singleton
│   └── utils.ts              # Helpers (currency, grading, etc.)
└── generated/prisma/         # Generated Prisma client
```
