# OKIT — Master Project Prompt (C# / Visual Studio 2022)

> **Single, self-contained specification for the OKIT multi-tenant school management platform.**
> Paste the entire contents of this file into your AI coding assistant (Cursor, Copilot, Claude, GPT, etc.) or hand it to a developer. Every dashboard, role, page, table, field, action, rule, brand token, subscription plan, landing page section, and security control needed to build the system end-to-end is included here.
>
> **Project:** OKIT — Multi-tenant School Management & LMS Platform for Philippine institutions.
> **IDE:** Visual Studio 2022.
> **Stack:** C# 12 / .NET 8 / ASP.NET Core (Blazor Server + Web API) / EF Core 8 / SQL Server 2022 / ASP.NET Core Identity.
> **Branding:** Derived from the OKIT logo — orange `#F37021`, teal `#1FA9A0`, navy `#1B2A4E` on white.
> **Domains:** `okit.ph` (public), `admin.okit.ph` (Super Admin), `{institution}.okit.ph` (per-tenant dashboards).

---

## Table of Contents

0. [How To Use This Prompt](#0-how-to-use-this-prompt)
1. [Tech Stack & Solution Layout](#1-tech-stack--solution-layout)
2. [Architectural Rules](#2-architectural-rules)
3. [Brand System](#3-brand-system)
4. [Domain Model](#4-domain-model)
5. [Cross-Cutting Rules](#5-cross-cutting-rules)
6. [Public Landing Page (`okit.ph`)](#6-public-landing-page-okitph)
7. [Subscription Plans](#7-subscription-plans)
8. [Dashboards](#8-dashboards)
   - 8.1 [Super Admin Dashboard](#81-super-admin-dashboard)
   - 8.2 [Institution Admin Dashboard](#82-institution-admin-dashboard)
   - 8.3 [Operator Dashboard](#83-operator-dashboard)
   - 8.4 [Cashier Dashboard](#84-cashier-dashboard)
   - 8.5 [Instructor Dashboard](#85-instructor-dashboard)
   - 8.6 [Student Dashboard](#86-student-dashboard)
9. [Admin-Managed Grade Scale System](#9-admin-managed-grade-scale-system)
10. [Loophole Audit & Hardening](#10-loophole-audit--hardening)
11. [Notifications](#11-notifications)
12. [PDFs, Reports & Exports](#12-pdfs-reports--exports)
13. [Implementation Task Order](#13-implementation-task-order)
14. [Acceptance Criteria](#14-acceptance-criteria)
15. [Out of Scope](#15-out-of-scope)
16. [Seed Data](#16-seed-data)

---

## 0. How To Use This Prompt

You are an expert full-stack .NET engineer. Build the **OKIT** platform end-to-end based on the specifications below. Treat this document as authoritative — when in doubt, prefer clarity, security, multi-tenant isolation, and explicit data-driven configuration over cleverness or hardcoded constants.

**Working principles:**

- **No hardcoded business rules.** Passing grades, grade bands, fees, payment schemes, plan caps, and notification preferences are stored in the database and managed through the appropriate dashboard.
- **Tenant isolation is the highest-priority invariant.** Every tenant-scoped query MUST be filtered by `TenantId`. There must be no way for one institution to see another's data.
- **Every write is audited.** No exceptions.
- **Every dashboard is role-gated** at the route, controller, and service layers.
- **Every monetary value is `decimal(18,2)`** and rendered as PHP (`₱`).
- **Every timestamp is UTC in storage** and **Asia/Manila on screen.**
- **Every form is validated** (FluentValidation) with inline field errors and a disabled Submit until valid.
- **Every destructive action requires typed confirmation.**
- **Every locked configuration is read-only on the server, not just hidden in the UI.**

---

## 1. Tech Stack & Solution Layout

### 1.1 Mandatory Stack

| Concern | Choice | Notes |
|:---|:---|:---|
| IDE | **Visual Studio 2022** (latest update) | Must build with F5 and `dotnet build` from CLI. |
| Language | **C# 12** | |
| Runtime | **.NET 8 (LTS)** | |
| Web framework | **ASP.NET Core 8** with **Blazor Server** for dashboards + **Web API** for future mobile/external consumers | Blazor Server keeps the UI interactive without SPA build pipelines. |
| ORM | **Entity Framework Core 8** with Code-First migrations | Run `dotnet ef migrations add` / `dotnet ef database update`. |
| Database | **SQL Server 2022** (LocalDB for dev, full SQL Server for prod) | |
| Auth | **ASP.NET Core Identity** with role + claims authorization, optional TOTP 2FA (mandatory for Admin and Cashier) | |
| Multi-tenancy | Subdomain-resolved `TenantId` middleware + EF global query filter | One shared database, `TenantId` discriminator on every tenant-scoped entity. |
| PDF | **QuestPDF** | Slips, Receipts, Reports. |
| Charts | **ApexCharts.Blazor** or **ChartJs.Blazor** | |
| CSV | **CsvHelper** | |
| Email | **MailKit** + SMTP (configurable per environment) | |
| Payments (platform-level only) | **PayMongo REST API** | Used only for SaaS subscription billing — never for student tuition. |
| Logging | **Serilog** (rolling file + console) | Structured logs, redact secrets. |
| Validation | **FluentValidation** | |
| Testing | **xUnit** + **bUnit** (Blazor component tests) + **Moq** | |
| Mediator | **MediatR** (or hand-rolled equivalent) | CQRS-lite separation between commands and queries. |
| Scheduler | **Quartz.NET** or **HostedService** | For daily jobs (subscription state machine, reconciliation rollovers). |

### 1.2 Solution Layout

Create exactly this structure:

```
OKIT.sln
├── src/
│   ├── OKIT.Domain/              // Entities, enums, value objects, domain events
│   ├── OKIT.Application/         // Use-case services, DTOs, validators, MediatR handlers, interfaces
│   ├── OKIT.Infrastructure/      // EF Core DbContext, migrations, repositories, email, PDF, PayMongo, audit interceptor
│   ├── OKIT.Web/                 // Blazor Server app: public landing pages + all 6 dashboards
│   └── OKIT.Api/                 // ASP.NET Core Web API (mobile/external integrations, future)
└── tests/
    ├── OKIT.Domain.Tests/        // xUnit
    ├── OKIT.Application.Tests/   // xUnit + Moq
    └── OKIT.Web.Tests/           // bUnit component tests
```

---

## 2. Architectural Rules

1. **Clean Architecture dependency direction:** `Domain` ← `Application` ← `Infrastructure` / `Web` / `Api`. `Domain` depends on nothing.
2. **Tenant isolation:** Every tenant-scoped entity has `TenantId Guid NOT NULL`. EF Core global query filter applies `e => e.TenantId == _currentTenant.TenantId` on every read. The current tenant is resolved by middleware from the subdomain — *never* from a user-supplied claim.
3. **Audit logging:** Implement an EF Core `SaveChangesInterceptor` that emits one `AuditLog` row per Create/Update/Delete on tenant-scoped entities. Each row includes a SHA-256 hash chain (see §10.3).
4. **Repository / Unit of Work:** Inject `IApplicationDbContext` as a scoped service. Avoid generic repositories — use focused query/command handlers via MediatR.
5. **Money:** `decimal(18,2)`, `MidpointRounding.ToEven`. Installments rounded individually; the final installment absorbs the centavo remainder so the sum equals the assessed total exactly.
6. **Time:** Persist UTC. Render Asia/Manila. The application's "today" for Cashier reconciliation, Pending Payments, and Final Exam deadlines uses `TimeZoneInfo.FindSystemTimeZoneById("Asia/Manila")` (Windows) / `"Asia/Manila"` (Linux).
7. **Enums:** Persisted as **strings** (use `.HasConversion<string>()` in EF) for forward compatibility.
8. **Authorization:** Every Blazor route has `[Authorize(Roles = "...")]`. Every API endpoint has equivalent attributes. Every service method asserts the caller's role and tenant.
9. **Locking:** Lockable configurations (Grade Scales, Grading Formulas, Financial Setup, Subjects, Term dates) become read-only the moment the locking precondition is met (e.g. ≥ 1 student enrolled). Enforced server-side, not just in the UI.
10. **No hardcoded business constants.** Pass/fail thresholds, grade bands, plan limits, notification toggles, and locking rules are read from the database. Defaults exist only as seed data the Admin can edit.

---

## 3. Brand System

The OKIT logo combines an orange graduation cap, a teal looped letter "O", and a navy "Okit" wordmark. Use this palette across the public landing page, login screens, dashboards (default), and PDFs (Slips, Receipts, Reports). Per-tenant branding **overrides only the primary accent (`--okit-orange`)**; the rest of the palette stays consistent so the platform feels unified.

### 3.1 Color Tokens

Persist these as CSS custom properties on `:root` in `src/OKIT.Web/wwwroot/css/okit-brand.css`.

| Token | Hex | Usage |
|:---|:---|:---|
| `--okit-orange` | `#F37021` | Primary CTAs, key highlights, logo accent (graduation cap). **Tenant-overridable.** |
| `--okit-orange-deep` | `#D85A12` | Hover state for primary CTAs |
| `--okit-teal` | `#1FA9A0` | Secondary buttons, links, infographic accents (logo loop) |
| `--okit-teal-deep` | `#137A74` | Hover state for secondary buttons |
| `--okit-navy` | `#1B2A4E` | Headings, top navigation, footer background, "Okit" wordmark color |
| `--okit-slate` | `#3F4A66` | Body copy |
| `--okit-mist` | `#F4F6FA` | Section background bands |
| `--okit-white` | `#FFFFFF` | Page background, card surfaces |
| `--okit-border` | `#E5E9F2` | Card and table borders |
| `--okit-success` | `#1E9E6A` | Active / paid badges |
| `--okit-warning` | `#E0A100` | Pending / attention badges |
| `--okit-danger` | `#C0392B` | Restricted / overdue / errors |
| `--okit-info` | `#2A6FB5` | Informational badges |

### 3.2 Typography

- **Headings:** `Plus Jakarta Sans` (Google Fonts), color `--okit-navy`, semibold (600).
- **UI + body:** `Inter` (Google Fonts), color `--okit-slate`, regular (400) for copy, medium (500) for table headers and labels.
- **Fallback:** system sans-serif.
- **Base size:** 16 px. **Line height:** 1.6.

### 3.3 Components

- **Buttons:** 8 px border-radius, 12 px vertical / 20 px horizontal padding.
  - Primary: `--okit-orange` background, white text. Hover: `--okit-orange-deep`.
  - Secondary: outlined `--okit-teal`, teal text. Hover: filled teal, white text.
  - Tertiary: text-only, `--okit-navy`, underline on hover.
  - Destructive: outlined `--okit-danger`, red text. Hover: filled red, white text. Always paired with a typed-confirmation modal.
- **Cards:** 12 px border-radius, 1 px `--okit-border`, shadow `0 2px 8px rgba(27,42,78,0.06)`.
- **Tables:** zebra rows (`--okit-mist` for even rows), sticky header, 12 px row padding.
- **Status badges:** rounded pill, 11 px font, uppercase, 1 px border in the badge color.
- **Inputs:** 8 px radius, 1 px `--okit-border`, focus ring `--okit-teal` 2 px outline.
- **Sidebar:** 240 px wide, `--okit-navy` background, white text, active item indicated by a 3 px `--okit-orange` left bar and a slightly lighter background.
- **Top bar:** white background, 64 px tall, 1 px bottom border `--okit-border`.

### 3.4 Per-Tenant Branding

The Institution Admin's **Branding** page allows the institution to:
- Upload a logo (PNG/SVG ≤ 2 MB) — replaces the OKIT logo in the top bar of that tenant's dashboards (but **not** the platform-level public site).
- Choose an accent color (hex input or color wheel) — overrides `--okit-orange` for that tenant only.
- Live preview shown on a mock header and a mock primary button.
- Save applies institution-wide immediately via a `Branding` DB row + cache invalidation.

---

## 4. Domain Model

Create these aggregates in `OKIT.Domain`. Use `Guid` primary keys unless stated otherwise. Every monetary field is `decimal(18,2)`. Every enum is persisted as a string.

### 4.1 Platform-level (no `TenantId`)

| Entity | Fields |
|:---|:---|
| **Institution** | `Id`, `Name`, `Subdomain` (unique), `Status` (`PENDING_REVIEW` \| `PENDING_PAYMENT` \| `ACTIVE` \| `READ_ONLY` \| `SUSPENDED` \| `CANCELLED`), `PlanId`, `SubscriptionExpiresAt`, `CreatedAt`, `RowVersion` |
| **OnboardingRequest** | `Id`, `InstitutionName`, `InstitutionType` (`College` \| `HighSchool` \| `K12` \| `Vocational`), `Address`, `ExpectedStudentCount`, `RepresentativeName`, `RepresentativeRole`, `RepresentativeEmail`, `RepresentativePhone`, `ChosenPlanId`, `Status` (`PENDING_REVIEW` \| `PENDING_PAYMENT` \| `ACTIVE` \| `REJECTED` \| `EXPIRED`), `RejectionReason?`, `CreatedAt` |
| **SubscriptionPlan** | `Id`, `Name`, `Slug`, `MonthlyPricePhp`, `MaxStudents`, `MaxStaff`, `StorageGb`, `AuditRetentionYears`, `IncludesPrioritySupport`, `IncludesDedicatedOnboarding`, `IncludesQuarterlyReview`, `AnnualDiscountMonths`, `Features` (JSON), `IsPublic`, `OrderIndex` |
| **PlatformPayment** | `Id`, `InstitutionId`, `AmountPhp`, `PayMongoReference`, `PaidAt`, `BillingPeriodStart`, `BillingPeriodEnd` |
| **SupportAccessSession** | `Id`, `InstitutionId`, `RequestedByUserId`, `Code` (6-digit), `ApprovedByAdminUserId?`, `StartedAt?`, `ExpiresAt?` (max 24 h), `Status` (`PENDING` \| `ACTIVE` \| `EXPIRED` \| `DENIED`) |
| **PlatformAuditLog** | `Id`, `Timestamp`, `ActorUserId`, `Action`, `TargetType`, `TargetId`, `BeforeJson`, `AfterJson`, `PreviousRowHash`, `RowHash` |

### 4.2 Tenant-scoped (every entity has `TenantId`)

| Entity | Fields |
|:---|:---|
| **AppUser** (extends `IdentityUser<Guid>`) | `TenantId`, `FullName`, `Role` (`SuperAdmin` \| `Admin` \| `Operator` \| `Cashier` \| `Instructor` \| `Student`), `IsActive`, `LastLoginAt`, `MustChangePassword` |
| **Branding** | `TenantId` (PK), `LogoBlob`, `AccentColorHex` |
| **AcademicYear** | `Id`, `Name`, `StartDate`, `EndDate` |
| **Term** | `Id`, `AcademicYearId`, `Name`, `StartDate`, `EndDate`, `Status` (`UPCOMING` \| `ACTIVE` \| `COMPLETED`), `RowVersion` |
| **Department** | `Id`, `Name`, `IsActive` |
| **Program** | `Id`, `DepartmentId`, `Name`, `RequiredUnits`, `IsActive` |
| **YearLevel** | `Id`, `ProgramId`, `Name`, `OrderIndex` |
| **Subject** | `Id`, `YearLevelId`, `TermId`, `Code`, `Name`, `Units`, `InstructorUserId?`, `IsActive`, `RowVersion` |
| **GradeScale** | `Id`, `Name`, `Description?`, `MinRawScore`, `MaxRawScore`, `PassingRawScore`, `IsDefault`, `IsLocked`, `RowVersion` |
| **GradeScaleBand** | `Id`, `GradeScaleId`, `MinRawScore`, `MaxRawScore`, `DisplayValue` (e.g. `"1.00"`, `"A"`, `"Excellent"`), `Remark`, `OrderIndex` |
| **GradingFormula** | `Id`, `Scope` (`Program` \| `Subject`), `ScopeRefId`, `GradeScaleId` (FK), `ParticipationThreshold`, `AttendanceWeight`, `EngagementWeight`, `IsLocked`, `RowVersion` |
| **GradingComponent** | `Id`, `GradingFormulaId`, `Name`, `WeightPercent` |
| **FinancialSetup** | `Id`, `TermId`, `TuitionPerUnitPhp`, `RefundDeadlineDays`, `IsLocked`, `RowVersion` |
| **MiscFee** | `Id`, `FinancialSetupId`, `Name`, `AmountPhp` |
| **PaymentScheme** | `Id`, `FinancialSetupId`, `Name` (`Full` \| `2-Installment` \| `3-Installment` \| custom) |
| **PaymentSchemeInstallment** | `Id`, `PaymentSchemeId`, `OrderIndex`, `Percent`, `DueDayOffset` |
| **Student** | `Id`, `StudentNumber` (auto-generated, e.g. `2026-00001`), `FirstName`, `MiddleName?`, `LastName`, `BirthDate`, `Gender`, `Contact`, `Email?`, `Address`, `GuardianName?`, `GuardianContact?`, `IdPhotoBlob?`, `Status` (`APPLICANT` \| `ASSESSED` \| `ENROLLED_ACTIVE` \| `ENROLLED_RESTRICTED` \| `WITHDRAWN` \| `ON_LEAVE`), `LinkedUserId?` |
| **Enrollment** | `Id`, `StudentId`, `TermId`, `ProgramId`, `YearLevelId`, `Status`, `EnrolledAt` |
| **EnrollmentSubject** | `Id`, `EnrollmentId`, `SubjectId`, `Status` (`ONGOING` \| `PASSED` \| `FAILED` \| `DROPPED` \| `CREDITED`) |
| **AssessmentSlip** | `Id`, `Code`, `EnrollmentId`, `PaymentSchemeId`, `TotalAmountPhp`, `GeneratedAt`, `PaymentStatus` (`UNPAID` \| `PARTIALLY_PAID` \| `FULLY_PAID`), `QrSignature` |
| **AssessmentSlipLine** | `Id`, `AssessmentSlipId`, `Description`, `AmountPhp` |
| **Payment** | `Id`, `AssessmentSlipId`, `OrNumber` (unique per tenant), `AmountPhp`, `Type` (`Full` \| `InstallmentN`), `AmountTendered`, `Change`, `PaidAt`, `CashierUserId`, `IsVoided`, `VoidReason?`, `QrSignature` |
| **Refund** | `Id`, `StudentId`, `Reason` (`SubjectDrop` \| `FullWithdrawal`), `AmountPhp`, `Status` (`PENDING` \| `PROCESSED`), `ProcessedByUserId?`, `ProcessedAt?` |
| **DailyReconciliation** | `Id`, `Date`, `CashierUserId`, `SystemTotal`, `VoidedTotal`, `RefundsTotal`, `NetCollection`, `CashOnHand`, `Discrepancy`, `Notes` |
| **AttendanceSession** | `Id`, `SubjectId`, `Date`, `Type` (`Lecture` \| `Lab` \| `Tutorial`), `RecordedByUserId` |
| **AttendanceEntry** | `Id`, `AttendanceSessionId`, `StudentId`, `Status` (`Present` \| `Late` \| `Absent` \| `Excused`), `IsCorrection`, `OriginalEntryId?`, `Reason?` |
| **GradeEntry** | `Id`, `EnrollmentSubjectId`, `GradingComponentId`, `RawScore`, `MaxScore`, `EnteredByUserId`, `EnteredAt` |
| **GradeCorrectionRequest** | `Id`, `GradeEntryId`, `OldScore`, `NewScore`, `Reason`, `Status` (`PENDING` \| `APPROVED` \| `REJECTED`), `ResolvedByUserId?`, `ResolvedAt?` |
| **ContentItem** | `Id`, `SubjectId`, `Type` (`File` \| `Video` \| `Announcement`), `Title`, `Description?`, `FileBlob?`, `ExternalUrl?`, `IsPublished`, `IsDeleted` |
| **ContentInteraction** | `Id`, `ContentItemId`, `StudentId`, `InteractionType` (`Viewed` \| `Downloaded` \| `Watched`), `OccurredAt` |
| **Assessment** | `Id`, `SubjectId`, `Title`, `Type` (`Quiz` \| `Midterm` \| `Final`), `Deadline`, `TimeLimitMinutes?`, `Status` (`Draft` \| `Published` \| `Closed`) |
| **AssessmentQuestion** | `Id`, `AssessmentId`, `OrderIndex`, `Type` (`MCQ` \| `TF` \| `Short`), `Text`, `Points`, `Options` (JSON), `CorrectAnswer` (JSON) |
| **AssessmentSubmission** | `Id`, `AssessmentId`, `StudentId`, `StartedAt`, `SubmittedAt?`, `Score?`, `IsGraded` |
| **PendingAction** | `Id`, `Type` (`GradeCorrection` \| `Withdrawal` \| `LockoutOverride` \| `LeaveOfAbsence` \| `LargeVoidAck`), `PayloadJson`, `Status` (`PENDING` \| `RESOLVED` \| `REJECTED`), `CreatedAt`, `ResolvedByUserId?`, `ResolvedAt?` |
| **Notification** | `Id`, `UserId`, `Category` (`Payment` \| `Academic` \| `Content` \| `System`), `Message`, `LinkUrl?`, `IsRead`, `CreatedAt` |
| **NotificationPreference** | `TenantId` (PK), `EmailEnabled`, `SmsEnabled` (toggle exists; SMS gateway is future), per-category booleans |
| **AuditLog** | `Id`, `Timestamp`, `ActorUserId`, `ActorRole`, `Action`, `TargetType`, `TargetId`, `BeforeJson`, `AfterJson`, `PreviousRowHash`, `RowHash`. **Immutable** at app + DB layer. |

---

## 5. Cross-Cutting Rules

### 5.1 Layout

Every dashboard follows the same structural pattern:
- **Top bar:** institution branding (logo + name), user name, role badge, notifications bell with unread count, logout. 64 px tall, white background, 1 px bottom border.
- **Left sidebar:** role-scoped navigation. 240 px wide, `--okit-navy` background. Active item: 3 px `--okit-orange` left bar + lighter background.
- **Main content area:** padding 24 px, max-width 1440 px, centered.

The public landing page uses a different layout: a sticky white top nav with logo + horizontal links + CTA, and a navy footer.

### 5.2 Tables

All tables support:
- Column sorting (click header).
- Pagination (default 25 rows, options 10 / 25 / 50 / 100).
- Text search (debounced 300 ms).
- Column-specific filters where indicated.
- CSV export where indicated.
- Sticky header on scroll.
- Empty state with an illustrative icon and a "Try adjusting filters or…" hint.

### 5.3 Modals

- Explicit Confirm + Cancel buttons.
- Destructive actions require typed confirmation (e.g. type the slip code or the word `DELETE`).
- Escape closes the modal only on non-destructive flows.
- Focus is trapped inside the modal.

### 5.4 Forms

- FluentValidation rules.
- Inline field errors below the input in `--okit-danger`.
- Submit button disabled until valid.
- Server-side validation always re-runs (never trust the client).

### 5.5 Locking Rules

| Configuration | Locks when |
|:---|:---|
| Grade Scale | At least one Grading Formula referencing it is locked |
| Grading Formula | ≥ 1 student is enrolled in the term it covers |
| Financial Setup | ≥ 1 Assessment Slip has been generated for the term |
| Subject edit | ≥ 1 student is enrolled in it for the current term |
| Term dates | ≥ 1 student is enrolled in the term |
| Assessment Slip amounts | The student is `ASSESSED` (slip generated) |

**Server-side enforcement:** Save handlers re-check the lock predicate inside a serializable transaction with `RowVersion` concurrency. UI shows a lock icon and disables Save when locked, but the server still validates.

### 5.6 Refund Policy

If a Subject is dropped before `FinancialSetup.RefundDeadlineDays` from `Term.StartDate`, a `PENDING` Refund row is auto-created for the Cashier. After the deadline, no refund. Full Withdrawal (Admin-approved) always creates a Refund row sized by the configured policy (default: pro-rated remaining tuition minus a 10% admin fee, all configurable).

### 5.7 Final Exam Participation Gate

A student whose composite Participation score is below the Subject/Program threshold cannot open Final Exam assessments — even if `Published`. UI shows: `"Locked — Participation: X%, Required: Y%"`. Server endpoint returns 403.

### 5.8 No Hardcoded Constants

The string `75` (or any other passing-grade cutoff) must not appear as a magic number in business-logic `.cs` files. Defaults live in seed data and are user-editable.

---

## 6. Public Landing Page (`okit.ph`)

A formal, LMS-grade marketing site — clean grid, generous white space, formal typography, no playful illustrations. Implemented as Blazor Server pages under a `Public` area with **no authentication required**. The aesthetic must feel like a real production LMS (Canvas, Schoology, Moodle Workplace).

### 6.1 Sitemap

| Path | Page |
|:---|:---|
| `/` | Home |
| `/about` | About OKIT |
| `/features` | Features (six dashboards explained) |
| `/pricing` | Subscription Plans |
| `/security` | Security & Data Privacy |
| `/contact` | Contact form |
| `/onboard` | Apply for an institution account |
| `/login` | Role-aware login |
| `/legal/terms` | Terms of Service |
| `/legal/privacy` | Privacy Policy |

### 6.2 Top Navigation (sticky)

- **Left:** OKIT logo (image) + "Okit" wordmark in `--okit-navy`.
- **Center:** Home · About · Features · Pricing · Security · Contact (text links, navy, hover underline in teal).
- **Right:** Tertiary "Sign In" link → `/login`. Primary button "Apply for an Account" (`--okit-orange`) → `/onboard`.
- **Mobile (< 768 px):** Hamburger menu, full-screen overlay.

### 6.3 Home Page Sections (in order)

1. **Hero band** (white background)
   - **H1** (Plus Jakarta Sans 56 px, `--okit-navy`): "School operations, simplified."
   - **Sub** (Inter 20 px, `--okit-slate`): "OKIT is a multi-tenant platform that unifies enrollment, finance, academics, and student engagement for Philippine schools."
   - **Two CTAs:** primary "Apply for an Account" (orange) → `/onboard`; secondary "Sign In" (outlined teal) → `/login`.
   - **Right column:** a polished product mockup — a screenshot of the Admin dashboard with the brand palette applied. Use a placeholder SVG until real screens exist.

2. **Trust strip** (full-width, white)
   - Small caption: "Built for Philippine schools • PHP-native • RA 10173-aware • Subdomain-isolated tenants."
   - Three subtle inline icons (shield, peso sign, building).

3. **Six-role overview** (`--okit-mist` background)
   - **Heading:** "One platform. Six tailored experiences."
   - **3×2 grid of cards:** Super Admin, Institution Admin, Operator, Cashier, Instructor, Student.
   - Each card: Lucide-style icon in `--okit-teal`, role name in navy (Plus Jakarta Sans 18 px semibold), one-sentence description in slate, "Learn more →" link to the matching anchor on `/features`.

4. **How it works** (white)
   - Four numbered steps with thin teal connectors:
     1. **Apply** — Submit your institution's onboarding form.
     2. **Get Approved** — Our team reviews and provisions your subdomain.
     3. **Configure** — Set up your branding, curriculum, grading scale, and finances.
     4. **Operate** — Enroll students, accept payments, run classes, finalize grades.

5. **Why OKIT** (`--okit-mist`, three columns)
   - **Multi-tenant by design** — Every institution lives in its own subdomain with database-level isolation. Your data is never visible to other tenants.
   - **Locked-in audit trail** — Every write is recorded in an append-only, hash-chained audit log. You can always answer "who changed what, when, and why."
   - **PHP-native finances** — Tuition, miscellaneous fees, installments, refunds, daily reconciliation — all in pesos, all matched to Philippine school workflows.

6. **Plan teaser** (white)
   - Three pricing tiers as compact cards (Starter, Standard, Enterprise). Standard has a "Most Popular" ribbon in `--okit-orange`.
   - "See full comparison →" link in `--okit-teal` to `/pricing`.

7. **Final CTA banner** (`--okit-orange` background, white text)
   - **Heading:** "Ready to modernize your campus?"
   - Primary button (white background, orange text) "Apply for an Account →" linking to `/onboard`.

8. **Footer** (`--okit-navy` background, white text, 4 columns + bottom row)
   - **Product:** Features, Pricing, Security, Status.
   - **Company:** About, Contact, Careers.
   - **Legal:** Terms of Service, Privacy Policy, Acceptable Use, Data Processing Addendum.
   - **Contact:** support@okit.ph, +63 (placeholder), Manila placeholder address.
   - **Bottom row:** "© [year] OKIT. All rights reserved." centered, small.

### 6.4 About Page (`/about`)

- **Hero:** "Built for Philippine schools, by people who understand them."
- **Mission section:** 2-paragraph statement on simplifying school operations while respecting RA 10173 (Data Privacy Act) and CHED/DepEd workflows.
- **Who it's for:** card grid — Colleges, K-12 schools, Vocational institutes, Review centers.
- **Key principles:** Tenant isolation • Locked configurations after enrollment • Auditability • PHP-native • Read-only first.
- **Team / Company section** (placeholder).

### 6.5 Features Page (`/features`)

- Six anchored sections, one per role, each with:
  - Role name as `H2` in `--okit-navy`.
  - 3-bullet summary of what that role can do.
  - 3-column feature grid with icons.
  - Screenshot (placeholder until real screens exist).
- Link back to `/pricing` at the bottom.

### 6.6 Security Page (`/security`)

- **Sections:**
  - **Multi-tenant isolation** — Subdomain resolution, EF global query filter, per-tenant secrets for QR signing.
  - **Audit trail** — Append-only, hash-chained, per-tenant retention policy.
  - **Authentication** — ASP.NET Core Identity, password policy, account lockout, mandatory 2FA for Admin and Cashier.
  - **Encryption** — TLS in transit (HSTS preload), encrypted backups at rest.
  - **Data privacy (RA 10173)** — Data Processing Addendum link, breach notification policy, data export on cancellation.
  - **File handling** — MIME and magic-byte validation, per-tenant storage caps.
  - **Headers** — CSP, X-Frame-Options DENY, Referrer-Policy.

### 6.7 Contact Page (`/contact`)

- Two-column layout: contact form (Name, Institution, Email, Phone, Subject dropdown, Message) on the left; office address, email, phone, support hours on the right.
- Form posts to a `ContactMessage` table (out of audit scope, but rate-limited).
- Honeypot field for bot prevention.

### 6.8 Onboarding Page (`/onboard`)

A multi-step form that creates an `OnboardingRequest`:

1. **Institution info:** Institution name, type (College / High School / K-12 / Vocational), address, expected student count.
2. **Representative:** Full name, role/title, email, phone.
3. **Plan selection:** Card-based selector populated from `SubscriptionPlan` (`IsPublic = true` only).
4. **Review & submit:** Preview of all entered data, accept Terms checkbox, submit. On success: confirmation screen "Your application has been received. We'll email you within 2 business days." Creates an `OnboardingRequest` with status `PENDING_REVIEW`.

Server validation: rate-limit by IP (5 submissions per hour). Send notification email to platform admins.

### 6.9 Login Page (`/login`)

- Centered card (max-width 420 px), OKIT logo at top.
- Formal copy: "Sign in to your institution."
- Fields: Email, Password, "Remember me", "Forgot password?".
- On submit, the system reads `User.Role` and `User.TenantId` and redirects to the appropriate dashboard URL. 2FA challenge appears here for Admin/Cashier when enabled.
- Account-lockout message after 5 failed attempts: "Account locked for 15 minutes. Try again later or contact your administrator."

### 6.10 Legal Pages (`/legal/terms`, `/legal/privacy`)

Placeholder content the legal team can replace. Render via Markdown files in `OKIT.Web/Pages/Legal/`. Include a "Last updated" date at the top.

### 6.11 Responsiveness

The landing page must be fully responsive at 360 px (mobile), 768 px (tablet), 1024 px (laptop), 1440 px (desktop), 1920 px (large desktop). Use CSS Grid and Flexbox; no horizontal scroll at any breakpoint.

---

## 7. Subscription Plans

These plans must be **seeded into the `SubscriptionPlan` table** so the Super Admin Dashboard's "Subscription Plans" page reflects them on first run. The Super Admin can then edit prices, caps, and features without redeploying. The `/pricing` page reads from this table — never from hardcoded values.

### 7.1 Plan Comparison

| Feature | Starter | **Standard (Most Popular)** | Enterprise |
|:---|:---:|:---:|:---:|
| **Monthly Price (PHP)** | **₱4,999** | **₱9,999** | **₱19,999** |
| Students included | up to 300 | up to 1,500 | up to 5,000 |
| Staff accounts | up to 20 | up to 100 | up to 500 |
| Departments / Programs | unlimited | unlimited | unlimited |
| Storage (content + uploads) | 20 GB | 100 GB | 500 GB |
| Custom branding (logo + accent color) | ✓ | ✓ | ✓ |
| Audit log retention | 1 year | 3 years | 7 years |
| Reports (CSV + PDF export) | ✓ | ✓ | ✓ |
| 2FA for Admin & Cashier | ✓ | ✓ | ✓ |
| Priority email support | — | ✓ | ✓ |
| Dedicated onboarding session | — | — | ✓ |
| Quarterly account review | — | — | ✓ |
| Annual billing discount | 1 month free | 1 month free | 2 months free |
| **CTA** | "Start with Starter" | "Get Standard" | "Talk to Sales" |

### 7.2 `/pricing` Page Layout

- **Header:** "Choose the plan that fits your institution." Sub: "All plans include the full six-role workflow, multi-tenant isolation, and unlimited audit history. Pricing is monthly in PHP and billed via PayMongo."
- **Three plan cards** side by side. The middle one (Standard) is elevated by 8 px, has a "Most Popular" ribbon in `--okit-orange`, and a 2 px `--okit-orange` border.
- **Below the cards:** A full-width comparison table (same rows as §7.1) for accessibility and detailed comparison.
- **FAQ accordion** (5 items):
  1. *Can we change plans later?* — Yes; prorated immediately.
  2. *What happens if we exceed our student cap?* — Soft warning at 90% capacity; hard limit at 110% for 14-day grace.
  3. *How are refunds handled?* — Pro-rated within the first 14 days; non-refundable after.
  4. *Is data exportable on cancellation?* — Yes, via "Request Data Export" in the Admin dashboard, plus an automatic export at suspension.
  5. *Where is the data hosted?* — In Philippine-region cloud infrastructure with RA 10173-compliant providers.
- **Final CTA banner:** "Ready to modernize your campus? Apply for an Account →" (orange).

### 7.3 Plan Limit Enforcement

- **Soft warning** at 90% of Students or Staff capacity: banner on Admin dashboard, "You're approaching your plan limit. Consider upgrading."
- **Hard limit** at 110% capacity for 14 days: blocks new student / staff creation; existing data remains accessible.
- **Storage cap:** new uploads blocked when total tenant storage exceeds plan limit. Show "Storage full — please upgrade or delete old content."
- All limit checks live in `Application` services, never in UI.

---

## 8. Dashboards

Every dashboard is a Blazor Server area under `src/OKIT.Web/Pages/Dashboards/{Role}/` with route prefixes that match the URLs below. Every page enforces `[Authorize(Roles = "...")]` plus tenant-scoped service guards.

### 8.1 Super Admin Dashboard

**URL:** `admin.okit.ph` — Platform-level oversight: subscriptions, revenue, onboarding. **Zero access** to any institution's internal data (no student names, no grades, no per-student finance).

#### Sidebar

| Menu Item | Icon | Description |
|:---|:---|:---|
| Dashboard Home | `LayoutDashboard` | Overview / summary cards |
| Onboarding Requests | `FileText` | Pending, approved, rejected institution requests |
| Institutions | `Building` | All active, suspended, cancelled tenants |
| Subscription Plans | `CreditCard` | Manage plan tiers and pricing |
| Revenue | `TrendingUp` | Financial reports for SaaS income |
| Support Access | `ShieldCheck` | Request time-limited access to an institution |
| My Account | `User` | Profile settings, change password |

#### Dashboard Home

**Top row — 4 summary cards:**

| Card | Data | Visual |
|:---|:---|:---|
| Total Institutions | Count of all `ACTIVE` institutions | Number + small trend arrow vs. last month |
| Pending Requests | Count of `PENDING_REVIEW` onboarding requests | Number, highlighted `--okit-warning` if > 0 |
| Monthly Revenue | Total PayMongo collections for the current month | Currency (PHP) + percentage change vs. last month |
| Expiring Soon | Count of subscriptions renewing within 7 days | Number, highlighted `--okit-danger` if any are overdue |

**Middle row — Recent Activity Table (last 20):**

| Column | Data |
|:---|:---|
| Date | Timestamp of event |
| Event | `New Request` \| `Payment Received` \| `Subscription Expired` \| `Tenant Provisioned` |
| Institution | Institution name |
| Status | Badge: `Pending` \| `Active` \| `Suspended` \| `Expired` |
| Action | `View Details` button |

Filterable by event type and date range.

**Bottom row — two panels side by side:**

| Left Panel | Right Panel |
|:---|:---|
| Subscription Status Donut: Active / Read-Only / Suspended / Cancelled | Revenue Bar Chart: monthly revenue for the last 12 months |

#### Onboarding Requests Page

**Table columns:** Request Date | Institution Name | Representative (name + email + phone) | Chosen Plan | Status (`PENDING_REVIEW` / `PENDING_PAYMENT` / `ACTIVE` / `REJECTED` / `EXPIRED`) | Actions.

- **Approve flow:** Click Approve → confirm dialog → system generates PayMongo link → status `PENDING_PAYMENT` → email sent to representative with the link and instructions.
- **Reject flow:** Click Reject → modal with required reason text area → confirm → status `REJECTED` → email sent with the reason.

#### Institutions Page

**Table columns:** Institution Name (clickable → detail view) | Subdomain (e.g. `greenvalley.okit.ph`) | Plan | Status (`ACTIVE` / `READ_ONLY` / `SUSPENDED`) | Students (aggregated count only — no individual data) | Staff (aggregated count only) | Subscription Expires | Actions (`View`).

**Detail view shows:** Subscription history (payments, renewals), plan changes, aggregated stats (total students, total staff). **Never** show student names, grades, or per-student financial details.

#### Subscription Plans Page

CRUD on `SubscriptionPlan`. Edit price, caps, features, public visibility. Changes reflect immediately on `/pricing`.

#### Revenue Page

| Component | Function |
|:---|:---|
| Date range filter | Select start/end dates |
| Revenue table | Date, institution, amount, payment method, PayMongo reference ID |
| Export button | Download CSV of filtered results |
| Summary bar | Total revenue for selected period, average per institution |

#### Support Access Page

| Component | Function |
|:---|:---|
| Institution search | By name or subdomain |
| Request Access button | Sends a 6-digit code to the institution Admin's dashboard |
| Active Sessions table | Current support access sessions with countdown timer (max 24 h) |
| History table | Past sessions with timestamps and duration |

Every page viewed by the Super Admin under support access is logged to the tenant's own Audit Log with a distinct "Support Access" actor type.

---

### 8.2 Institution Admin Dashboard

**URL:** `{institution}.okit.ph/admin` — Full institutional control: curriculum, staff, finances (structure only), reports, overrides.

#### Sidebar

Dashboard Home, Branding, Academic Calendar, Curriculum, **Grading Setup** (Grade Scales + Formulas), Financial Setup, Staff Management, Student Records, Grade Management, Reports, Audit Log, Notifications, Support Access, Subscription, My Account.

#### Dashboard Home — 5 summary cards

| Card | Data |
|:---|:---|
| Total Students | Count of `ENROLLED_ACTIVE` + `ENROLLED_RESTRICTED` this term |
| New Enrollments | Students enrolled in the current month |
| Collection Rate | Percentage of total assessed tuition collected |
| Pending Actions | Count of items needing Admin attention |
| Active Staff | Count of active Operator + Cashier + Instructor accounts |

#### Pending Actions Queue

| Type | Details | Buttons |
|:---|:---|:---|
| Grade Correction Request | Instructor, student, subject, old → new score, reason | Approve / Reject |
| Withdrawal Request | Student, program, reason | Approve / Reject |
| Exam Lockout Override | Student, subject, current participation %, reason | Grant Override / Deny |
| Leave of Absence | Student, program, requested duration | Approve / Reject |
| Large Void Acknowledgement | Cashier name, OR number, voided amount, reason | Acknowledge |

#### Bottom row — two charts

| Left | Right |
|:---|:---|
| Enrollment by Program (horizontal bar) | Collection Summary (stacked bar: Collected vs. Outstanding per month) |

#### Branding Page

| Component | Function |
|:---|:---|
| Logo upload area | Drag-and-drop or click (PNG/SVG ≤ 2 MB). Live preview on a mock header. |
| Accent color picker | Hex input or color wheel. Live preview on mock buttons and links. |
| Save button | Applies institution-wide immediately. |

#### Academic Calendar Page

Expandable Academic Year list, "Add Academic Year" modal (name + start + end), "Add Term/Semester" modal within each year (term name + start + end). Status badges (`ACTIVE` / `UPCOMING` / `COMPLETED`). Lock icon when ≥ 1 student is enrolled.

#### Curriculum Page (nested accordion)

Department → Program (with required units) → Year Level → Subject (code, name, units, term, instructor, student count).

| Level | Actions |
|:---|:---|
| Department | Add, rename, deactivate. Cannot delete if Programs exist underneath. |
| Program | Add, rename, deactivate. Set total required units. |
| Year Level | Add (e.g., 1st Year). Reorder. |
| Subject | Add (subject name, code, unit count, assigned term). Edit only if no students enrolled. Deactivate. |

#### Grading Setup Page (fully admin-managed — see §9 for full details)

Two sub-tabs:
- **Grade Scales (CRUD):** Manage `GradeScale` + `GradeScaleBand` rows. Replaces any hardcoded passing grade.
- **Formulas:** Choose a Grade Scale, define grading components, set participation threshold and Attendance/Engagement weights.

#### Financial Setup Page

| Component | Function |
|:---|:---|
| Tuition rate per unit | Numeric input (PHP) |
| Miscellaneous fees table | Itemized rows: fee name, amount. Add/remove/edit. |
| Refund deadline | Days from term start (default 14, editable) |
| Payment Schemes | Define options: Full, 2-installment, 3-installment, custom |
| Per-installment | Percent + due-date offset (e.g., "2nd installment: 50% due 30 days after term start") |
| Lock indicator | Locked once any Assessment Slip is generated for the term |

#### Staff Management Page

**Table columns:** Name | Email | Role (`Operator` / `Cashier` / `Instructor`) | Assigned Subjects (Instructors only) | Status | Last Login | Actions (`Edit`, `Deactivate`, `Reset Password`).

**Add Staff modal:** Full name, email, role (dropdown), and (if Instructor) multi-select subject assignments scoped to the active term.

#### Student Records Page (read-only for Admin)

**Table columns:** Student ID | Name (clickable) | Program | Year Level | Status | Balance (summary only) | Term.

**Filters:** Status, Program, Year Level, Term.

**Detail view:** Student profile, enrollment history across terms, subject list per term with status (`ONGOING` / `PASSED` / `FAILED` / `DROPPED`), participation meter per subject. Admin **cannot** edit grades from here — that's the Grade Management page.

#### Grade Management Page (3 tabs)

| Tab | Content |
|:---|:---|
| Pending Corrections | Table of correction requests with Approve/Reject |
| Submitted Grades | Subjects where Instructor clicked "Submit Grades." Admin clicks "Finalize" per subject. Shows subject, instructor, student count, submission date. |
| Finalized Grades | Read-only archive, searchable by term and program |

#### Reports Page

| Report | Content | Export |
|:---|:---|:---|
| Enrollment Report | Students per Program, per Year Level, per Term. Status breakdown. | CSV, PDF |
| Financial Summary | Total assessed, total collected, outstanding balance. By term, program. | CSV, PDF |
| Academic Performance | Pass/fail rates per subject, per program. Average grades. | CSV, PDF |
| Attendance Summary | Average attendance rate per subject. Students below threshold. | CSV, PDF |
| Collection Report | Daily/weekly/monthly collections. Matches Cashier reports for reconciliation. | CSV, PDF |

#### Audit Log Page

**Columns:** Timestamp | Actor (name + role badge) | Action | Target | Details (expandable JSON diff).

**Filters:** Date range, actor, action type, target type. **Export:** CSV with full JSON diffs.

The Admin can view + export but **cannot edit or delete**.

#### Notifications Page

Per-category email/SMS toggles, default templates with merge tokens, test-send button.

#### Support Access Page

Approve/deny the 6-digit code from Super Admin. Display all currently active support access sessions with countdown timer.

#### Subscription Page

View plan details, current usage vs. limits, request cancellation, **Request Data Export** button (produces a ZIP of CSVs and PDFs and emails the representative).

---

### 8.3 Operator Dashboard

**URL:** `{institution}.okit.ph/operator` — Student enrollment, assessment slip generation, enrollment lifecycle. **Operator does NOT see grades, financial amounts, or participation scores.**

#### Sidebar

Dashboard Home, New Enrollment, Student Directory, Assessment Slips, Re-Enrollment, Year Advancement, My Account.

#### Dashboard Home — 4 cards

| Card | Data |
|:---|:---|
| Enrolled This Term | Count of students with status `ENROLLED_ACTIVE` or `ENROLLED_RESTRICTED` |
| Pending Assessment | Count of `APPLICANT` (registered but no slip yet) |
| Pending Payment | Count of `ASSESSED` (slip generated, not yet paid) |
| Processed Today | Number of enrollments and slips generated today by this Operator |

**Recent Activity Table:** Time | Action (`Student Registered` / `Assessment Slip Generated` / `Subject Dropped` / `Re-Enrollment Processed`) | Student | Program / Year Level | Status.

#### New Enrollment — 3-step wizard

**Step 1 — Student Information**

| Field | Type | Notes |
|:---|:---|:---|
| First Name | Text | Required |
| Middle Name | Text | Optional |
| Last Name | Text | Required |
| Date of Birth | Date | Required |
| Gender | Dropdown | Required |
| Contact Number | Text | Required |
| Email | Text | Optional |
| Address | Text area | Required |
| Guardian Name | Text | Required if minor |
| Guardian Contact | Text | Required if minor |
| ID Photo | File upload | JPEG/PNG ≤ 1 MB |

**Step 2 — Academic Placement**

Cascading dropdowns: Department → Program → Year Level → Term. On selection, the system auto-populates a **read-only Subject List** (code, name, units). Operator cannot modify subjects.

**Step 3 — Payment Scheme & Assessment**

Payment Scheme dropdown (Full / 2-Installment / 3-Installment / custom — from `FinancialSetup`).

**Breakdown Preview:**

| Item | Amount |
|:---|:---|
| Tuition (X units × PHP Y) | PHP Z |
| Lab Fee | PHP A |
| ID Fee | PHP B |
| ... (all misc fees) | ... |
| **Total** | **PHP Total** |
| Installment 1 (due: date) | PHP X |
| Installment 2 (due: date) | PHP Y |

**Confirm & Generate button:** Creates the student record (status `ASSESSED`), generates the Assessment Slip PDF with QR-code verification (§10.6), opens print dialog automatically.

#### Student Directory Page

**Search:** by name, student ID, or contact number.

**Table columns:** Student ID | Name (clickable) | Program | Year Level | Status (color-coded badge) | Actions (`View`, `Drop Subject`, `Request Withdrawal`).

**Detail view:** Profile, current term subjects with status, enrollment history. **No grades, financial amounts, or participation scores.**

**Drop Subject modal:** Dropdown of current subjects → select → confirm. System checks if before refund deadline and shows "Refund eligible" or "No refund — past deadline." If eligible, auto-create `PENDING` Refund for the Cashier.

**Request Withdrawal modal:** Reason text field (required) → submits to Admin's pending actions queue.

#### Assessment Slips Page

**Table columns:** Slip Code | Student Name | Program / Year Level | Total Amount | Payment Scheme | Generated Date | Payment Status (`UNPAID` / `PARTIALLY_PAID` / `FULLY_PAID`) | Actions (`Reprint` PDF download).

#### Re-Enrollment Page

Search existing student → modal: New Term + New Year Level (system suggests next; Operator may override) → auto-populate subjects → assessment generation flow.

#### Year Advancement Page

**Table:** Student Name | Current Program / Year Level | Subjects Passed | Subjects Failed (red if any) | Eligible (Yes/No) | Actions (`Advance` if eligible / `Flag for Admin` if failed subjects exist).

---

### 8.4 Cashier Dashboard

**URL:** `{institution}.okit.ph/cashier` — Payment processing, receipts, refunds, daily reconciliation. **Zero access to academic data.**

#### Sidebar

Dashboard Home, Accept Payment, Payment History, Refunds, Official Receipts, Daily Reconciliation, Collection Reports, My Account.

#### Dashboard Home — 4 cards

| Card | Data |
|:---|:---|
| Collected Today | Total PHP collected today |
| Transactions Today | Count of payments processed today |
| Pending Refunds | Count of approved refund entries awaiting processing |
| Outstanding Balances | Total unpaid balance across all students with installment plans |

**Today's Transactions Table:** Time | OR Number | Student Name | Slip Code | Amount Paid | Payment Type (`Full` / `Installment N`) | Actions (`View OR`, `Reprint OR`).

#### Accept Payment — 3 steps

**Step 1 — Look Up Slip:** Slip Code input + Look Up button.

**Step 2 — Slip Details (read-only):** Student Name, Program / Year Level, Total Assessment, Payment Scheme, Amount Due Now, Previous Payments, Remaining Balance.

**Step 3 — Record Payment:**

| Field | Type | Notes |
|:---|:---|:---|
| Amount Tendered | Numeric | Must be ≥ Amount Due Now |
| Change | Auto-calculated | |

**Confirm Payment button:** Records the payment, updates Student → `ENROLLED_ACTIVE` (or maintains), generates the Official Receipt PDF with QR-code verification, opens print dialog.

The Cashier **cannot** modify any slip details — only confirm the payment amount.

#### Payment History Page

**Filters:** date range, student name, slip code.

**Table:** Date | OR Number | Student Name | Slip Code | Amount | Type | Actions (`View OR`, `Void` requires reason).

Voiding does **not** delete the entry — it creates a `VOID` linked entry. Voids over a configurable PHP threshold queue to the Admin's Pending Actions for acknowledgement.

#### Refunds Page

**Table (system-generated only):** Date Created | Student Name | Reason (`Subject Drop` / `Full Withdrawal`) | Refund Amount | Status (`PENDING` / `PROCESSED`) | `Process Refund` button (records cash disbursement, issues refund receipt PDF, marks `PROCESSED`).

The Cashier **cannot** create refund entries — only process system-generated ones.

#### Daily Reconciliation Page

| Component | Function |
|:---|:---|
| Date selector | Defaults to today (Asia/Manila) |
| System Total | Sum of all ORs issued on the selected date (auto) |
| Voided Total | Sum of voided ORs (auto) |
| Refunds Total | Sum of processed refunds (auto) |
| Net Collection | System − Voided − Refunds (auto) |
| Cash on Hand input | Cashier enters the physical cash count |
| Discrepancy | Cash on Hand − Net Collection (auto, red if ≠ 0) |
| Notes field | Text area for explaining any discrepancy |
| Submit Reconciliation | Saves the record. Visible to Admin in reports. |

#### Collection Reports Page

| Report | Content |
|:---|:---|
| Daily | All transactions for a selected date |
| Weekly | Aggregated by day for a selected week |
| Monthly | Aggregated by week for a selected month |
| Custom Range | User-defined start/end dates |

All show: total collected, total voided, total refunded, net collection. Exportable as CSV and PDF.

---

### 8.5 Instructor Dashboard

**URL:** `{institution}.okit.ph/instructor` — Course delivery, attendance, grading. **Strictly scoped to assigned subjects only. Zero access to financial data.**

#### Sidebar

Dashboard Home, My Subjects, Gradebook, Attendance, Content Manager, Quizzes & Exams, Grade Corrections, My Account.

#### Dashboard Home — 4 cards

| Card | Data |
|:---|:---|
| Assigned Subjects | Count this term |
| Total Students | Sum across all assigned subjects |
| Pending Grading | Count of submitted assignments/quizzes awaiting manual grading |
| Upcoming Deadlines | Count of assignments/quizzes with deadlines in the next 7 days |

**Subject Cards (one per assigned subject):** Subject Code + Name | Program / Year Level | Enrolled Students | Content Items | Average Participation | Average Grade so far (rendered through the Grade Scale) | Quick Actions (`View Students`, `Upload Content`, `Record Attendance`, `Open Gradebook`).

#### My Subjects Page

Tabbed view per assigned subject. Each tab contains the **Student Roster Table:**

| Column | Content |
|:---|:---|
| Student ID | — |
| Name | — |
| Participation | Percentage with color (green ≥ threshold, yellow ≥ 80% of threshold, red < 80%) |
| Attendance Rate | Percentage |
| Current Grade | Rendered through the linked Grade Scale's bands (e.g. "1.50 — Very Good") |
| Exam Eligible | Yes (✓) / No (✗ with "Participation: X%, Required: Y%") |

#### Gradebook Page (spreadsheet-style)

Subject selector dropdown (assigned only). Rows = students. Columns = grading components (Quiz 1, Quiz 2, Assignment 1, Midterm, Final, etc.) + read-only **Computed Final Grade** column (rendered through the Grade Scale).

- Header row shows each component's weight (e.g. "Quizzes — 20%").
- Each cell is an input for the raw score (e.g. 85 out of 100).
- Save scores incrementally — does not require all cells filled at once.
- **Submit Grades** button: submits all grades for this subject to the Admin. Shows confirmation dialog listing students with missing scores.

#### Attendance Page

**Subject selector** at the top.

**Session-Based View:**

| Component | Function |
|:---|:---|
| Date picker | Class session date |
| Session type dropdown | `Lecture`, `Lab`, `Tutorial` |
| Student list | Each student has a radio group: `Present` / `Late` / `Absent` / `Excused` |
| Save Attendance | Saves the session. Entries become immutable. |

**Correction flow:** `Submit Correction` per student → modal (new status + required reason) → creates a `CORRECTION` entry linked to the original, preserving both.

**Attendance Summary Tab:**

| Column | Content |
|:---|:---|
| Student Name | — |
| Total Sessions | Count of sessions recorded |
| Present | Count |
| Late | Count |
| Absent | Count |
| Excused | Count |
| Attendance Rate | Percentage (Present + Late + Excused as attended; Late weighted 0.5) |

#### Content Manager Page

**Subject selector** at the top.

**Content List Table:** Type icon (`File` / `Video` / `Announcement`) | Title | Uploaded Date | File Size | Downloads/Views | Actions (`Edit Title`, `Replace File`, `Delete` — soft-delete).

**Upload Modal:**

| Field | Type | Notes |
|:---|:---|:---|
| Content Type | Radio: File / Video / Announcement | |
| Title | Text | Required |
| Description | Text area | Optional |
| File | File upload | PDF/DOCX/PPTX ≤ 50 MB; MP4 ≤ 500 MB or external URL for video |
| Publish Immediately | Toggle | Off = draft, not visible to students |

#### Quizzes & Exams Page

**Assessment List Table:** Title | Type (`Quiz` / `Midterm` / `Final`) | Questions | Total Points | Status (`Draft` / `Published` / `Closed`) | Deadline | Submissions | Actions (`Edit` if Draft, `Publish`, `Close`, `View Results`).

**Builder:**

| Component | Function |
|:---|:---|
| Title | Assessment name |
| Type | Quiz / Midterm / Final |
| Deadline | Date and time (Asia/Manila) |
| Time Limit | Minutes (0 = unlimited) |
| Question builder | MCQ (4 options + correct mark), True/False, Short Answer (manual grading). Each has a point value. |
| Preview | Shows the assessment as a student would see it |
| Save as Draft / Publish | Draft is invisible to students |

**Final Exam respects the participation gate** (§5.7).

#### Grade Corrections Page

**Table:** Date Submitted | Student Name | Subject | Component | Old Score | New Score | Reason | Status (`PENDING` / `APPROVED` / `REJECTED`).

**Submit Correction modal:** Subject (assigned only) → Student (in subject) → Component → Current Score (auto, read-only) → Corrected Score → Reason (required).

---

### 8.6 Student Dashboard

**URL:** `{institution}.okit.ph/student` — View academic status, access course content, take assessments, track progress. **Zero ability to modify any data.**

#### Sidebar

Dashboard Home, My Subjects, My Grades, My Schedule, Payments, Notifications, My Account.

#### Status Banner (full-width, top of dashboard)

| Status | Color | Message |
|:---|:---|:---|
| `APPLICANT` | Gray | "Your application is being processed. Please visit the Operator's office." |
| `ASSESSED` | `--okit-warning` | "Your Assessment Slip has been generated. Please proceed to the Cashier for payment." |
| `ENROLLED_ACTIVE` | `--okit-success` | "You are enrolled and active for [Term Name]." |
| `ENROLLED_RESTRICTED` | `--okit-danger` | "Your access is restricted due to an overdue payment. Please visit the Cashier." |
| `WITHDRAWN` | Gray | "You have withdrawn from the current term." |
| `ON_LEAVE` | `--okit-info` | "You are on an approved leave of absence." |

#### Summary Cards (visible only when `ENROLLED_ACTIVE` or `ENROLLED_RESTRICTED`)

| Card | Data |
|:---|:---|
| Subjects This Term | Count of enrolled subjects |
| Overall Participation | Average participation across all subjects |
| Assignments Due | Upcoming deadlines in the next 7 days |
| Outstanding Balance | Remaining balance (PHP) or "Fully Paid" |

#### Subject Overview Cards (one per enrolled subject)

| Field | Value |
|:---|:---|
| Subject Code + Name | e.g., "CS101 — Introduction to Programming" |
| Instructor | Instructor's name |
| Participation Meter | Color-coded progress bar with percentage |
| Current Grade | Rendered through Grade Scale (or "No scores yet") |
| Subject Status | `ONGOING` / `PASSED` / `FAILED` |
| New Content | Badge showing count of unviewed files/videos |
| Quick Actions | `Open Subject` |

#### Subject Detail Page — 5 tabs

**Tab 1 — Content:** Type icon | Title | Posted Date | Status (`New` / `Viewed` / `Downloaded`) | Actions (`Download` / `Watch` / `Read`). Disabled (gray + lock icon) if status ≠ `ENROLLED_ACTIVE`.

**Tab 2 — Quizzes & Exams:** Title | Type | Deadline | Status (`Not Started` / `In Progress` / `Completed` / `Locked`) | Score (after grading) | `Take Quiz` (disabled if `Locked` or status ≠ `ENROLLED_ACTIVE`). Final Exam shows "Locked — Participation: X%, Required: Y%" when below threshold.

**Tab 3 — Assignments:** Title | Deadline | Status (`Not Submitted` / `Submitted` / `Late` / `Graded`) | Score | Actions (`Upload Submission`, `View Feedback`).

**Tab 4 — Attendance:** Date | Session Type | Status. Summary header: total sessions, attendance rate.

**Tab 5 — Participation Meter (Detail):**

| Component | Value |
|:---|:---|
| Attendance Score | X% (weight: 60%) — breakdown of present/late/absent |
| Engagement Score | Y% (weight: 40%) — breakdown of files downloaded, videos watched, quizzes attempted |
| **Composite Participation** | **Z%** with threshold line marked |
| Threshold | "Required: 75% to unlock Final Exam" (driven by Grading Formula, not hardcoded) |
| Status | "On Track" (green) / "At Risk" (yellow, within 10% of threshold) / "Below Threshold" (red) |

#### My Grades Page

Term selector (defaults to current; can view past terms).

**Table columns:** Subject Code | Subject Name | Instructor | Component Scores (expandable per component with weights) | **Computed Final Grade** (read-only — rendered through the Grade Scale, e.g. "1.25 — Very Good" or "A−") | Status.

Status remains `ONGOING` until Admin finalizes; then `PASSED` or `FAILED` decided by the Admin-managed Grade Scale (no hardcoded cutoff).

#### Payments Page (informational only)

| Component | Content |
|:---|:---|
| Current Term Assessment | Itemized breakdown (same as Slip): tuition, fees, total |
| Payment Scheme | Full / Installment with the schedule |
| Payment History | Date, OR Number, Amount Paid, Installment # |
| Outstanding Balance | Remaining due |
| Next Due Date | Highlighted red if overdue |
| Download links | Assessment Slip PDF, Official Receipt PDF (one per payment) |

The student **cannot** make online payments here — payments are physical at the Cashier.

#### Notifications Page

Chronological list: Date | Type icon (`Payment` / `Academic` / `Content` / `System`) | Message | Read/Unread. Click marks as read and navigates to the relevant page.

#### My Account Page

| Field | Editable? | Notes |
|:---|:---:|:---|
| Name | No | Set by Operator |
| Student ID | No | System-generated |
| Program | No | Set by Operator |
| Year Level | No | Set by Operator |
| Email | No | Set by Operator |
| Contact Number | No | Set by Operator |
| ID Photo | No | Set by Operator |
| Password | **Yes** | Current + new + confirm |

The student cannot edit their own profile — all changes go through the Operator.

---

## 9. Admin-Managed Grade Scale System

This section is the authoritative spec for grading configuration. **Nothing is hardcoded.** Every passing cutoff, grade band, display value, and remark lives in the database and is managed through the Institution Admin's Grading Setup page.

### 9.1 Why

A previous draft used a hardcoded "75" as the passing grade. Schools using a 1.00–5.00 scale, an A–F scale, or a custom rubric could not configure pass/fail correctly without code changes. This is replaced with two new entities and a UI surface for managing them.

### 9.2 Entities (already in §4.2, repeated here for clarity)

**`GradeScale`**

| Field | Type | Notes |
|:---|:---|:---|
| `Id` | Guid | |
| `TenantId` | Guid | |
| `Name` | string | e.g. "PH College 1.00–5.00" |
| `Description` | string? | |
| `MinRawScore` | decimal | Lower bound of raw score range |
| `MaxRawScore` | decimal | Upper bound of raw score range |
| `PassingRawScore` | decimal | **Cutoff for pass/fail** — replaces hardcoded "75" |
| `IsDefault` | bool | One default per tenant |
| `IsLocked` | bool | True if any referencing Grading Formula is locked |
| `RowVersion` | byte[] | Concurrency |

**`GradeScaleBand`**

| Field | Type | Notes |
|:---|:---|:---|
| `Id` | Guid | |
| `TenantId` | Guid | |
| `GradeScaleId` | Guid (FK) | |
| `MinRawScore` | decimal | Lower bound (inclusive) |
| `MaxRawScore` | decimal | Upper bound (inclusive on the last band, exclusive otherwise) |
| `DisplayValue` | string | e.g. "1.00", "A", "Excellent" |
| `Remark` | string | e.g. "Excellent", "Very Good", "Failed" |
| `OrderIndex` | int | Display ordering |

**Validation rule:** Bands MUST cover `[MinRawScore … MaxRawScore]` of the parent `GradeScale` with no gaps and no overlaps. The save handler computes the union of band intervals, sorts them, and rejects the save with a clear error if validation fails.

**`GradingFormula` (revised)**

| Field | Notes |
|:---|:---|
| `GradeScaleId` (FK) | New — replaces hardcoded passing grade |
| `ParticipationThreshold` | Default 75% but **editable** |
| `AttendanceWeight` / `EngagementWeight` | Linked sliders, default 60/40 |

### 9.3 Grading Setup Page (in Institution Admin Dashboard)

**Sub-tab 1 — Grade Scales (CRUD):**

**Table columns:** Name | Min–Max Raw | Passing Cutoff | # Bands | Default? | Locked? | Actions (`Edit`, `Duplicate`, `Set Default`, `Delete` if unused).

**Add/Edit Grade Scale modal:**

| Field | Type | Notes |
|:---|:---|:---|
| Name | Text | Required |
| Description | Text area | Optional |
| Min Raw Score | Decimal | Required (e.g. 0) |
| Max Raw Score | Decimal | Required (e.g. 100) |
| Passing Raw Score | Decimal | Required — this REPLACES any hardcoded "75" |
| Bands editor | Rows | Each row: Min Raw, Max Raw, Display Value, Remark, Order |

The system validates that bands fully cover the Min–Max range with no gaps or overlaps before saving.

**Seeded but editable presets:**

1. **PH College 1.00–5.00 (Passing 3.00)**
   | Min | Max | Display | Remark |
   |:---:|:---:|:---:|:---|
   | 97.0 | 100.0 | 1.00 | Excellent |
   | 94.0 | 96.99 | 1.25 | Excellent |
   | 91.0 | 93.99 | 1.50 | Very Good |
   | 88.0 | 90.99 | 1.75 | Very Good |
   | 85.0 | 87.99 | 2.00 | Good |
   | 82.0 | 84.99 | 2.25 | Good |
   | 79.0 | 81.99 | 2.50 | Satisfactory |
   | 76.0 | 78.99 | 2.75 | Satisfactory |
   | 75.0 | 75.99 | 3.00 | Passing |
   | 0.0  | 74.99 | 5.00 | Failed |

2. **PH K-12 60–100 (Passing 75)**
   | Min | Max | Display | Remark |
   |:---:|:---:|:---:|:---|
   | 90 | 100 | Outstanding | Outstanding |
   | 85 | 89 | Very Satisfactory | Very Satisfactory |
   | 80 | 84 | Satisfactory | Satisfactory |
   | 75 | 79 | Fairly Satisfactory | Fairly Satisfactory |
   | 60 | 74 | Did Not Meet Expectations | Failed |

3. **US Letter A–F (Passing C, raw 70)**
   | Min | Max | Display | Remark |
   |:---:|:---:|:---:|:---|
   | 90 | 100 | A | Excellent |
   | 80 | 89 | B | Good |
   | 70 | 79 | C | Passing |
   | 60 | 69 | D | Below Passing |
   | 0 | 59 | F | Failed |

The Admin may **edit, duplicate, or delete** any preset. Deletion is blocked when a Grading Formula references the scale.

**Sub-tab 2 — Formulas:**

| Component | Function |
|:---|:---|
| Scope selector | Program \| Subject |
| Grade Scale dropdown | Choose which scale this formula uses |
| Component builder | Add components (Quizzes, Assignments, Final Exam, etc.) with weight % — must total 100% |
| Participation threshold | Numeric input (default 75% but editable) |
| Attendance/Engagement weight split | Two linked sliders (default 60/40) |
| Lock indicator | Shows "Locked" with lock icon if students are enrolled |

### 9.4 Computed Final Grade Algorithm

```text
1. For each enrollment subject, compute raw score:
   rawScore = SUM(componentScore_i * componentWeight_i / 100) for all components
2. Render final grade:
   band = bands.First(b => rawScore >= b.MinRawScore && rawScore <= b.MaxRawScore)
   display = band.DisplayValue + " — " + band.Remark
3. Pass/fail:
   passed = rawScore >= gradeScale.PassingRawScore
```

The displayed value (e.g. "1.25 — Very Good") and the Pass/Fail decision both come from `GradeScale` data, not from code constants.

### 9.5 Locking

A Grade Scale becomes locked when at least one Grading Formula referencing it is itself locked (i.e. students are enrolled in the term). UI shows the locked Grade Scale read-only with a lock icon. Server rejects edits with HTTP 409 Conflict.

---

## 10. Loophole Audit & Hardening

This section enumerates loopholes identified in earlier drafts and the corrective requirements that close them. **All items below are mandatory.**

### 10.1 Hardcoded grading values

- **Loophole:** Default passing grade was `75`; bands were implied by code, not data.
- **Fix:** §9 — `GradeScale` + `GradeScaleBand` entities. Acceptance criterion forbids the literal `75` (or any other cutoff) appearing in business-logic `.cs` files.

### 10.2 Cross-tenant data leakage

- **Loophole:** A LINQ query that omits `TenantId` could leak another institution's data.
- **Fix:** EF Core global query filter on every tenant-scoped entity. Add an integration test: log in as Tenant A, attempt to fetch a known Tenant B record by `Id`, assert null/404. Pen-test by attempting a forged `TenantId` claim — must be ignored in favor of subdomain-resolved tenant.

### 10.3 Audit-log tampering

- **Loophole:** A privileged DB user or a buggy migration could rewrite audit entries.
- **Fix:**
  - Append-only at app layer: `SaveChangesInterceptor` refuses Modified/Deleted state for `AuditLog`.
  - Append-only at DB layer: SQL `INSTEAD OF UPDATE` and `INSTEAD OF DELETE` triggers raise an error.
  - **Hash chain:** each row stores `PreviousRowHash` + `RowHash` (SHA-256 of canonical JSON of the row including `PreviousRowHash`). Any after-the-fact edit breaks the chain.
  - Background job validates the chain nightly and alerts the Super Admin on tamper detection.

### 10.4 Race conditions on locking

- **Loophole:** Concurrent saves could leave a "locked" config in an inconsistent state.
- **Fix:** Every lockable entity has a `RowVersion` (`byte[]`, `[Timestamp]`) column. Save operations re-check the lock predicate inside a serializable transaction; failure → friendly "This was just locked by enrollment activity — please refresh."

### 10.5 Money / decimal precision

- **Loophole:** `double`/`float` for tuition introduces rounding errors.
- **Fix:** All money is `decimal(18,2)`. All math uses `MidpointRounding.ToEven`. Installments are rounded individually; the **last** installment absorbs the centavo remainder so the sum equals the assessed total exactly. Unit test asserts a 3-installment split of ₱10,000 / 3 sums to exactly ₱10,000.00.

### 10.6 PDF / Receipt forgery

- **Loophole:** A reprinted Receipt is indistinguishable from a forged one.
- **Fix:** Every Slip and Receipt PDF includes a system-generated QR code encoding a signed URL: `https://{tenant}.okit.ph/verify/{or-or-slip-number}?sig={hmac}` (HMAC-SHA256 with a per-tenant secret stored encrypted at rest). The verification endpoint is public (no login) but tenant-scoped; it shows "Valid Receipt" with amount/date or "Not Found / Tampered."

### 10.7 File-upload abuse

- **Loophole:** Malicious files or storage abuse via uploads.
- **Fix:**
  - Whitelist MIME types and extensions per upload type.
  - Validate magic bytes server-side, not just the extension.
  - Cap total per-tenant storage by plan (§7).
  - Store uploads outside the web root; serve via authorized streaming endpoint.

### 10.8 Brute force and credential stuffing

- **Fix:**
  - Lock the account for 15 minutes after 5 failed sign-ins.
  - Password policy: ≥ 10 chars, mixed case + digit + symbol.
  - Mandatory TOTP 2FA for Admin and Cashier; optional for Operator and Instructor.
  - Force password change on first login for all seeded users.

### 10.9 CSRF, XSS, clickjacking

- **Fix:** Antiforgery tokens on every Blazor form. Strict CSP: `default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com`. Headers: `X-Frame-Options: DENY`, `Referrer-Policy: same-origin`, `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`. All user-supplied content is HTML-encoded at render time.

### 10.10 Cashier voids / refunds abuse

- **Loophole:** A Cashier can void any payment unilaterally.
- **Fix:**
  - Voids require a reason and route to the Audit Log.
  - Voids over a configurable PHP threshold queue to the Admin's Pending Actions for acknowledgement.
  - Refunds can only originate from system events (Admin-approved drops/withdrawals), never from a free-form Cashier action.

### 10.11 Time and timezone bugs

- **Loophole:** Mixing local and UTC times causes off-by-a-day in cutoffs.
- **Fix:** All persisted timestamps are UTC. The application's "today" for Cashier reconciliation, Pending Payments, and Final Exam deadlines uses Asia/Manila explicitly. Add a unit test creating a payment at 23:30 UTC and asserting it counts toward the next Manila day, not yesterday.

### 10.12 Subscription expiry edge cases

- **Loophole:** Unclear what happens to a tenant after subscription expiry.
- **Fix:** State machine, run by a daily HostedService:
  - `ACTIVE` → on subscription expiry → `READ_ONLY` (login allowed, no writes).
  - After 30 days in `READ_ONLY` → `SUSPENDED` (login blocked, data preserved).
  - After 90 days in `SUSPENDED` → tenant data exported as ZIP, emailed to the representative, then `CANCELLED`.
  - 14-day grace after `CANCELLED` before data is wiped.
  - Super Admin can manually pause this state machine for any tenant.

### 10.13 Self-service data export on cancellation

- **Fix:** Institution Admin's **Subscription** page has a "Request Data Export" button at any time, producing a ZIP of CSVs (students, enrollments, grades, payments) plus PDFs of every Receipt and Slip from the active term backwards.

### 10.14 Support Access misuse

- **Loophole:** Super Admin could enter a tenant covertly.
- **Fix:** 6-digit code + Admin approval + max 24 h. Every page viewed by the Super Admin under support access is logged to the tenant's Audit Log with a distinct "Support Access" actor type, visible to the Admin in real time.

### 10.15 Plan-limit bypass

- **Loophole:** Mass-importing students or staff could bypass plan caps.
- **Fix:** Limit checks live in `Application` services (`IStudentService.CreateAsync`, `IStaffService.CreateAsync`) and trigger on every create call, including bulk imports. UI shows soft warning at 90%; hard limit at 110% with 14-day grace.

### 10.16 Notification spam

- **Loophole:** Misconfigured rules could flood users.
- **Fix:** Per-user rate limit (max 50 in-app notifications + 10 emails per day), per-category preferences, opt-out link in every email.

---

## 11. Notifications

### 11.1 Channels

- **In-app bell:** unread count + dropdown of 10 most recent + "View all" link.
- **Email:** SMTP via MailKit. Per-tenant SMTP settings (configurable).
- **SMS:** toggle exists; gateway integration is future (out of scope).

### 11.2 Triggers

| Event | Audience | Channels |
|:---|:---|:---|
| Onboarding request approved | Representative | Email |
| Subscription payment received | Admin | Email, In-app |
| Subscription expiring in 7 days | Admin | Email, In-app |
| Slip generated | Student | Email, In-app |
| Payment recorded | Student | Email, In-app |
| Grade correction approved/rejected | Instructor | In-app |
| Grade finalized | Student | In-app |
| Withdrawal request approved/rejected | Operator + Student | In-app |
| Final Exam deadline in 24 h | Student | Email, In-app |
| Daily reconciliation discrepancy | Admin | Email, In-app |

### 11.3 Templates

Markdown templates in `OKIT.Infrastructure/EmailTemplates/{event}.md` with merge tokens like `{{StudentName}}`, `{{Amount}}`, `{{Date}}`. Admin can override per-tenant via the Notifications page.

---

## 12. PDFs, Reports & Exports

### 12.1 Assessment Slip PDF

Generated by Operator at enrollment. QuestPDF template with:
- Tenant logo and accent color in the header.
- Slip Code, Generated Date.
- Student info (name, ID, program, year level, term).
- Itemized breakdown (tuition by units × rate, each misc fee, total).
- Payment scheme (Full or per-installment with due dates).
- QR code (bottom-right) linking to the verification URL.
- Footer with "Computer-generated. Verify at the URL above." disclaimer.

### 12.2 Official Receipt PDF

Generated by Cashier at payment. QuestPDF template with:
- Tenant logo and accent color in the header.
- OR Number, Paid At.
- Student name, Slip Code reference.
- Amount Paid, Payment Type (Full or Installment N), Amount Tendered, Change.
- Cashier name.
- QR code (bottom-right) linking to the verification URL.
- Footer with "Computer-generated. Verify at the URL above." disclaimer.

### 12.3 Verification Endpoint

`GET /verify/{or-or-slip-number}?sig={hmac}` — public, no login. Renders a small page showing:
- "Valid Receipt" or "Not Found / Tampered."
- If valid: institution name, amount, date.

### 12.4 Reports

Per §8.2, every Admin Report exports as CSV and PDF. Per §8.4, every Cashier Collection Report exports as CSV and PDF. CSV uses UTF-8 BOM for Excel compatibility.

### 12.5 Data Export ZIP

When an Admin clicks "Request Data Export" or when the subscription state machine triggers, generate a ZIP containing:
- `students.csv`
- `enrollments.csv`
- `grades.csv`
- `payments.csv`
- `audit_log.csv`
- `slips/{slip-code}.pdf` (one per slip)
- `receipts/{or-number}.pdf` (one per receipt)
- `manifest.json` with tenant info and generation timestamp.

Email the ZIP to the representative.

---

## 13. Implementation Task Order

Build in this order. Each step must be fully functional before moving on.

1. **Solution scaffolding** — 5 src projects + 3 test projects with the Clean Architecture references in §1.2.
2. **Brand system & shared layout** — `wwwroot/css/okit-brand.css` with §3 tokens. Shared Blazor layout: top bar + sidebar + content. Public landing layout: sticky nav + footer.
3. **Domain entities & enums** — implement §4 in `OKIT.Domain`, including `GradeScale`, `GradeScaleBand`.
4. **DbContext & migrations** — `ApplicationDbContext` in `OKIT.Infrastructure`, `TenantId` global query filter, initial migration, `dotnet ef database update`. Add `AuditLog` triggers and `RowVersion` columns from §10.
5. **Identity + multi-tenancy** — ASP.NET Core Identity with `AppUser`, tenant-resolution middleware mapping `{subdomain}.okit.ph` → `TenantId`, role policies, lockout, password policy, mandatory/optional 2FA.
6. **Audit log infrastructure** — `SaveChangesInterceptor` emitting hash-chained `AuditLog` rows for every Create/Update/Delete on tenant-scoped entities. Nightly chain-validation job.
7. **Public landing pages** — Home, About, Features, Pricing, Security, Contact, Onboard, Login, Legal — per §6.
8. **Seed data** — platform tenant; three subscription plans from §7; one demo institution; one user per role with known passwords; three Grade Scale presets from §9.3.
9. **Super Admin Dashboard** — fully functional, including PayMongo integration for onboarding approval.
10. **Institution Admin Dashboard** — including the new **Grade Scales** sub-tab (§9), Branding, Curriculum, Financial Setup, Staff, Student Records, Grade Management, Reports, Audit Log, Subscription.
11. **Operator Dashboard** — New Enrollment wizard, Student Directory, Slip generation with QR.
12. **Cashier Dashboard** — Accept Payment, Payment History, Refunds, Daily Reconciliation, Collection Reports, OR generation with QR.
13. **Instructor Dashboard** — My Subjects, Gradebook (driven by Grade Scale), Attendance, Content Manager, Quizzes & Exams (with Final Exam gate), Grade Corrections.
14. **Student Dashboard** — Status banner, Subject Detail tabs, My Grades (Grade Scale rendered), Payments, Notifications, My Account.
15. **PDFs** — Slip + Receipt with QR-code verification (§12).
16. **Reports & exports** — all CSV/PDF exports (§12.4) plus the Data Export ZIP (§12.5).
17. **Notifications** — in-app bell + DB persistence + email (§11). SMS toggle exists; integration is future.
18. **Subscription state machine** — daily HostedService applying transitions in §10.12.
19. **Tests:**
    - **Domain:** money rounding, attendance-rate computation.
    - **Application:** grading-formula computation driven by Grade Scale (no hardcoded cutoffs), refund eligibility, locking rules, plan-limit checks, Manila-time edge cases.
    - **Infrastructure:** tenant isolation integration test, audit-log immutability test, audit hash chain validation test.
    - **Web (bUnit):** at least one page per dashboard plus the public landing page.
20. **Polish** — loading states, empty states, error pages (`404`, `403`, `500`), mobile-responsive layouts (landing page fully responsive 360 px–1920 px), accessible focus rings, ARIA labels.
21. **README** — setup steps, connection-string config, default seeded credentials, how to run migrations, how to run tests, how to run the app locally on `localhost` with a hosts-file entry simulating subdomains.

---

## 14. Acceptance Criteria

- The solution opens cleanly in Visual Studio 2022 and builds with no errors.
- **Public landing page** renders the OKIT brand palette (orange / teal / navy on white) and is fully responsive from 360 px to 1920 px wide.
- `/pricing` shows the three plans seeded into `SubscriptionPlan`; editing a plan in the Super Admin dashboard immediately reflects on `/pricing`.
- All six dashboards are reachable and role-gated; logging in as the wrong role to a dashboard URL returns 403.
- **No hardcoded grading constant exists in the codebase.** A grep for the literal `75` in `*.cs` files (excluding seed data, migrations, tests, and CSS) returns zero matches in business logic. Pass/fail and grade-band rendering are driven entirely by Admin-managed `GradeScale` rows.
- Locking rules behave exactly as specified: editing a locked Grading Formula or Grade Scale → UI shows "Locked" with a lock icon and Save is rejected server-side.
- **Tenant isolation:** SQL trace shows every tenant-scoped query carries a `WHERE TenantId = @p` clause via the global filter; the integration test in §10.2 passes.
- **Audit log:** captures every write; attempts to `UPDATE`/`DELETE` `AuditLog` raise a SQL error; the hash chain validates end-to-end; tampering with a row breaks the chain and triggers the alert.
- Slip and OR PDFs render with the institution's logo, accent color, and a working QR-code verification URL.
- Final Exam is genuinely blocked for a student whose composite participation is below threshold (button disabled and server endpoint returns 403).
- All decimal money displays as `₱` with two decimals; installments sum to the assessed total exactly; all dates display in Asia/Manila.
- Subscription state machine moves a stale tenant `ACTIVE → READ_ONLY → SUSPENDED → CANCELLED` per the documented timeline in a fast-forwarded test.
- 2FA challenge appears for Admin and Cashier on login; account lockout triggers after 5 failed attempts.
- File uploads validate magic bytes; uploading a `.exe` renamed to `.pdf` fails with a clear error.
- CSP, HSTS, and X-Frame-Options headers are present on every response (verified via curl).

---

## 15. Out of Scope

- **Online student-side payments.** All tuition payments are physical at the Cashier.
- **Mobile apps.** The Web API project is scaffolded for future use but no mobile client is built.
- **SMS notifications.** Toggle exists; gateway integration is future.
- **AI-powered features** (grade prediction, plagiarism detection, chat assistance, etc.).
- **Calendar / schedule generator.** The Student "My Schedule" page reads from data the Admin imports manually for now.

---

## 16. Seed Data

On first run, populate the database with:

### 16.1 Platform tenant

- One `Institution` representing the platform (`Subdomain = "admin"`, `Status = "ACTIVE"`).
- One `AppUser` with role `SuperAdmin` (`email: superadmin@okit.ph`, password: `Okit!Super2026` — must change on first login).

### 16.2 Subscription plans

The three plans from §7.1, stored in `SubscriptionPlan` with `IsPublic = true`, ordered by `OrderIndex` 0/1/2.

### 16.3 Demo institution

- One `Institution` (`Subdomain = "demo"`, `Status = "ACTIVE"`, `PlanId = Standard`).
- One `Branding` row with default OKIT logo and `--okit-orange` accent.
- One `AppUser` per non-SuperAdmin role with password `Okit!Demo2026` (must change on first login):
  - `admin@demo.okit.ph` — Admin
  - `operator@demo.okit.ph` — Operator
  - `cashier@demo.okit.ph` — Cashier
  - `instructor@demo.okit.ph` — Instructor
  - `student@demo.okit.ph` — Student
- Three `GradeScale` presets (PH College 1.00–5.00, PH K-12 60–100, US Letter A–F) with `IsDefault = true` on the first.
- One `AcademicYear` and one `Term` (`Status = "ACTIVE"`).
- Two `Department`s, each with one `Program`, four `YearLevel`s, and a handful of `Subject`s.
- One `FinancialSetup` for the active term with three `MiscFee`s and three `PaymentScheme`s (Full, 2-Installment, 3-Installment).
- One `Student` already enrolled in the active term to exercise the locking rules.

### 16.4 README credentials

The README must list these credentials clearly under a "Local Development Credentials" section, with a warning never to use them in production.

---

**End of prompt.**

Build the OKIT platform per the specifications above, exactly as written. When in doubt, prefer clarity, security, multi-tenant isolation, and explicit data-driven configuration over cleverness or hardcoded constants. Every dashboard, page, table, modal, button, validation rule, and locking constraint specified above is a **requirement, not a suggestion**.
