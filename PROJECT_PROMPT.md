# OKIT — Full Project Prompt (C# / Visual Studio 2022)

> **Use this file as a single, self-contained prompt to drive end-to-end implementation of the OKIT multi-tenant school management platform in C# using Visual Studio 2022.**
>
> Paste the entire contents of this file into your AI coding assistant (or hand it to a developer) as the master specification. Every dashboard, role, page, table, field, action, and rule needed to build the system is included here.

---

## 0. How To Use This Prompt

You are an expert full-stack .NET engineer. Build the **OKIT** platform end-to-end based on the specifications below.

**Tech stack (mandatory):**

- **IDE:** Visual Studio 2022 (latest update).
- **Language:** C# 12 / .NET 8 (LTS).
- **Web framework:** ASP.NET Core 8 — **Blazor Server** for the dashboards (interactive, role-scoped UIs) and **ASP.NET Core Web API** for backend endpoints (so a future mobile client can reuse them).
- **ORM:** Entity Framework Core 8 with **Code-First migrations**.
- **Database:** SQL Server 2022 (LocalDB for development, full SQL Server for production).
- **Auth:** ASP.NET Core Identity with role-based + claims-based authorization. Optional 2FA (TOTP) for Admin and Cashier.
- **Multi-tenancy:** Subdomain-based tenant resolution middleware (`{institution}.okit.ph`) + a single shared database with a `TenantId` discriminator on every tenant-scoped entity. The Super Admin tenant (`admin.okit.ph`) is a special platform tenant with no academic data.
- **PDF generation:** QuestPDF (Assessment Slips, Official Receipts, Reports).
- **Charts:** ApexCharts.Blazor or ChartJs.Blazor.
- **CSV export:** CsvHelper.
- **Email:** MailKit + SMTP (configurable per environment).
- **Payments (platform-level only):** PayMongo REST integration for SaaS subscription payments.
- **Logging:** Serilog (rolling file + console).
- **Validation:** FluentValidation.
- **Testing:** xUnit + bUnit (Blazor component tests) + Moq.
- **CI-friendly:** Solution must build cleanly with `dotnet build` and run with `dotnet run` from the command line as well as F5 in Visual Studio 2022.

**Solution layout (create exactly this structure):**

```
OKIT.sln
├── src/
│   ├── OKIT.Domain/              // Entities, enums, value objects, domain events
│   ├── OKIT.Application/         // Use-case services, DTOs, validators, interfaces
│   ├── OKIT.Infrastructure/      // EF Core DbContext, migrations, repositories, email, PDF, PayMongo
│   ├── OKIT.Web/                 // Blazor Server app (all 6 dashboards)
│   └── OKIT.Api/                 // ASP.NET Core Web API (for future mobile/external integrations)
└── tests/
    ├── OKIT.Domain.Tests/
    ├── OKIT.Application.Tests/
    └── OKIT.Web.Tests/           // bUnit component tests
```

**Architectural rules:**

1. Follow Clean Architecture: `Domain` has zero dependencies; `Application` depends only on `Domain`; `Infrastructure` and `Web`/`Api` depend on `Application` and `Domain`.
2. Every tenant-scoped query MUST be filtered by `TenantId` via an EF Core global query filter. There must be no way for one institution to see another's data.
3. Every write action MUST produce an immutable `AuditLog` entry with timestamp, actor, action, target, and a JSON diff of before/after values.
4. Use the **Repository + Unit of Work** pattern via `IApplicationDbContext` injected as a scoped service.
5. Use **MediatR** (or a hand-rolled equivalent) for command/query separation.
6. All money is stored as `decimal(18,2)` and displayed as PHP (`₱`).
7. All timestamps are stored as UTC and rendered in Asia/Manila time on the UI.
8. All enums are persisted as strings (not ints) for forward compatibility.
9. Every page enforces role-based authorization at the route level (e.g. `[Authorize(Roles = "Admin")]`).
10. **Lockable configurations** (Grading formulas, Financial Setup, Subjects) become read-only the moment any student is enrolled in the affected term.

---

## 1. Domain Model (Core Entities)

Create these aggregates in `OKIT.Domain`. Use `Guid` primary keys unless stated otherwise.

### 1.1 Platform-level (no `TenantId`)

- **Institution** — `Id`, `Name`, `Subdomain`, `Status` (`PENDING_REVIEW` | `PENDING_PAYMENT` | `ACTIVE` | `READ_ONLY` | `SUSPENDED` | `CANCELLED`), `PlanId`, `SubscriptionExpiresAt`, `CreatedAt`.
- **OnboardingRequest** — `Id`, `InstitutionName`, `RepresentativeName`, `RepresentativeEmail`, `RepresentativePhone`, `ChosenPlanId`, `Status`, `RejectionReason?`, `CreatedAt`.
- **SubscriptionPlan** — `Id`, `Name`, `MonthlyPricePhp`, `MaxStudents`, `MaxStaff`, `Features` (JSON).
- **PlatformPayment** — `Id`, `InstitutionId`, `AmountPhp`, `PayMongoReference`, `PaidAt`.
- **SupportAccessSession** — `Id`, `InstitutionId`, `RequestedByUserId`, `Code` (6-digit), `ApprovedByAdminUserId?`, `StartedAt?`, `ExpiresAt?` (max 24h), `Status`.

### 1.2 Tenant-scoped (every entity has `TenantId`)

- **AppUser** (extends `IdentityUser<Guid>`) — `TenantId`, `FullName`, `Role` (`SuperAdmin` | `Admin` | `Operator` | `Cashier` | `Instructor` | `Student`), `IsActive`, `LastLoginAt`.
- **Branding** — `TenantId` (PK), `LogoBlob`, `AccentColorHex`.
- **AcademicYear** — `Id`, `Name`, `StartDate`, `EndDate`.
- **Term** — `Id`, `AcademicYearId`, `Name`, `StartDate`, `EndDate`, `Status` (`UPCOMING` | `ACTIVE` | `COMPLETED`).
- **Department** — `Id`, `Name`, `IsActive`.
- **Program** — `Id`, `DepartmentId`, `Name`, `RequiredUnits`, `IsActive`.
- **YearLevel** — `Id`, `ProgramId`, `Name`, `OrderIndex`.
- **Subject** — `Id`, `YearLevelId`, `TermId`, `Code`, `Name`, `Units`, `InstructorUserId?`, `IsActive`.
- **GradeScale** — `Id`, `Name` (e.g. "PH College 1.0–5.0", "PH K–12 90–100", "US Letter A–F"), `Description?`, `MinRawScore` (e.g. 0), `MaxRawScore` (e.g. 100), `PassingRawScore` (admin-defined cutoff, **not hardcoded**), `IsDefault`, `IsLocked`.
- **GradeScaleBand** — `Id`, `GradeScaleId`, `MinRawScore`, `MaxRawScore`, `DisplayValue` (e.g. "1.00", "A", "Excellent"), `Remark` (e.g. "Excellent" / "Very Good" / "Failed"), `OrderIndex`. Bands MUST cover the full `[MinRawScore … MaxRawScore]` range without gaps or overlaps; the application validates this on save.
- **GradingFormula** — `Id`, `Scope` (`Program` | `Subject`), `ScopeRefId`, `GradeScaleId` (FK → `GradeScale`), `ParticipationThreshold`, `AttendanceWeight`, `EngagementWeight`, `IsLocked`. **No hardcoded passing grade** — passing comes from the linked `GradeScale.PassingRawScore`.
- **GradingComponent** — `Id`, `GradingFormulaId`, `Name`, `WeightPercent`.
- **FinancialSetup** — `Id`, `TermId`, `TuitionPerUnitPhp`, `IsLocked`.
- **MiscFee** — `Id`, `FinancialSetupId`, `Name`, `AmountPhp`.
- **PaymentScheme** — `Id`, `FinancialSetupId`, `Name` (`Full` | `2-Installment` | `3-Installment` | …).
- **PaymentSchemeInstallment** — `Id`, `PaymentSchemeId`, `OrderIndex`, `Percent`, `DueDayOffset`.
- **Student** — `Id`, `StudentNumber` (auto-generated, e.g. `2026-00001`), `FirstName`, `MiddleName?`, `LastName`, `BirthDate`, `Gender`, `Contact`, `Email?`, `Address`, `GuardianName?`, `GuardianContact?`, `IdPhotoBlob?`, `Status` (`APPLICANT` | `ASSESSED` | `ENROLLED_ACTIVE` | `ENROLLED_RESTRICTED` | `WITHDRAWN` | `ON_LEAVE`), `LinkedUserId?`.
- **Enrollment** — `Id`, `StudentId`, `TermId`, `ProgramId`, `YearLevelId`, `Status`, `EnrolledAt`.
- **EnrollmentSubject** — `Id`, `EnrollmentId`, `SubjectId`, `Status` (`ONGOING` | `PASSED` | `FAILED` | `DROPPED` | `CREDITED`).
- **AssessmentSlip** — `Id`, `Code`, `EnrollmentId`, `PaymentSchemeId`, `TotalAmountPhp`, `GeneratedAt`, `PaymentStatus` (`UNPAID` | `PARTIALLY_PAID` | `FULLY_PAID`).
- **AssessmentSlipLine** — `Id`, `AssessmentSlipId`, `Description`, `AmountPhp`.
- **Payment** — `Id`, `AssessmentSlipId`, `OrNumber`, `AmountPhp`, `Type` (`Full` | `InstallmentN`), `AmountTendered`, `Change`, `PaidAt`, `CashierUserId`, `IsVoided`, `VoidReason?`.
- **Refund** — `Id`, `StudentId`, `Reason` (`SubjectDrop` | `FullWithdrawal`), `AmountPhp`, `Status` (`PENDING` | `PROCESSED`), `ProcessedByUserId?`, `ProcessedAt?`.
- **DailyReconciliation** — `Id`, `Date`, `CashierUserId`, `SystemTotal`, `VoidedTotal`, `RefundsTotal`, `NetCollection`, `CashOnHand`, `Discrepancy`, `Notes`.
- **AttendanceSession** — `Id`, `SubjectId`, `Date`, `Type` (`Lecture` | `Lab` | `Tutorial`), `RecordedByUserId`.
- **AttendanceEntry** — `Id`, `AttendanceSessionId`, `StudentId`, `Status` (`Present` | `Late` | `Absent` | `Excused`), `IsCorrection`, `OriginalEntryId?`, `Reason?`.
- **GradeEntry** — `Id`, `EnrollmentSubjectId`, `GradingComponentId`, `RawScore`, `MaxScore`, `EnteredByUserId`, `EnteredAt`.
- **GradeCorrectionRequest** — `Id`, `GradeEntryId`, `OldScore`, `NewScore`, `Reason`, `Status` (`PENDING` | `APPROVED` | `REJECTED`), `ResolvedByUserId?`.
- **ContentItem** — `Id`, `SubjectId`, `Type` (`File` | `Video` | `Announcement`), `Title`, `Description?`, `FileBlob?`, `ExternalUrl?`, `IsPublished`, `IsDeleted`.
- **ContentInteraction** — `Id`, `ContentItemId`, `StudentId`, `InteractionType` (`Viewed` | `Downloaded` | `Watched`), `OccurredAt`.
- **Assessment** — `Id`, `SubjectId`, `Title`, `Type` (`Quiz` | `Midterm` | `Final`), `Deadline`, `TimeLimitMinutes?`, `Status` (`Draft` | `Published` | `Closed`).
- **AssessmentQuestion** — `Id`, `AssessmentId`, `OrderIndex`, `Type` (`MCQ` | `TF` | `Short`), `Text`, `Points`, `Options` (JSON), `CorrectAnswer` (JSON).
- **AssessmentSubmission** — `Id`, `AssessmentId`, `StudentId`, `StartedAt`, `SubmittedAt?`, `Score?`, `IsGraded`.
- **PendingAction** — `Id`, `Type` (`GradeCorrection` | `Withdrawal` | `LockoutOverride` | `LeaveOfAbsence`), `PayloadJson`, `Status`.
- **Notification** — `Id`, `UserId`, `Category` (`Payment` | `Academic` | `Content` | `System`), `Message`, `LinkUrl?`, `IsRead`, `CreatedAt`.
- **AuditLog** — `Id`, `Timestamp`, `ActorUserId`, `ActorRole`, `Action`, `TargetType`, `TargetId`, `BeforeJson`, `AfterJson`. **Immutable** (no UPDATE or DELETE permitted at the DB level).

---

## 2. Cross-Cutting Rules

- **Layout for every dashboard:** top bar (institution branding, user name, role badge, notifications bell, logout) + left sidebar (role-scoped nav) + main content area.
- **Status banners and badges** use a consistent color palette: gray (neutral), green (active/passed), yellow (warning/pending), red (restricted/failed), blue (informational).
- **Notifications bell** shows unread count and a dropdown with the 10 most recent notifications + a "View all" link.
- **All tables** support: column sorting, pagination (default 25 rows), text search, and CSV export where indicated.
- **All modals** include explicit Confirm + Cancel buttons; destructive actions require typed confirmation.
- **All forms** use FluentValidation; show inline field errors; disable Submit until valid.
- **Locking rules:**
  - Grading formula → locked when ≥ 1 student is enrolled in the term it covers.
  - Grade Scale → locked when at least one Grading Formula referencing it is locked.
  - Financial Setup → locked when ≥ 1 Assessment Slip has been generated for the term.
  - Subject edit → locked when ≥ 1 student is enrolled in it for the current term.
  - Term dates → locked when ≥ 1 student is enrolled in the term.
  - Once a student is `ASSESSED`, the slip's amounts are immutable.
- **No hardcoded grading values anywhere.** Pass/fail thresholds, grade bands, display values, and remarks are *always* read from the Admin-managed `GradeScale` + `GradeScaleBand` tables. The string "75" must not appear as a magic number in business logic — defaults live in seed data only.
- **Refund policy:** if a Subject is dropped before the configurable refund deadline, a `PENDING` Refund row is auto-created; after the deadline, no refund.
- **Final Exam gating:** A student whose composite Participation score is below the Subject/Program threshold cannot open Final Exam assessments — even if `Published`.

---

## 3. Dashboards

Every dashboard below must be implemented as a Blazor Server area with the exact pages, sidebars, tables, columns, and actions specified.

### 3.1 Super Admin Dashboard

**URL:** `admin.okit.ph` — Platform-level oversight. **Zero access** to any institution's internal data.

**Sidebar:**

| Menu Item | Icon | Description |
|:---|:---|:---|
| Dashboard Home | LayoutDashboard | Overview / summary cards |
| Onboarding Requests | FileText | Pending, approved, rejected requests |
| Institutions | Building | All active, suspended, cancelled tenants |
| Subscription Plans | CreditCard | Manage plan tiers and pricing |
| Revenue | TrendingUp | Financial reports for SaaS income |
| Support Access | ShieldCheck | Request time-limited access to an institution |
| My Account | User | Profile settings, change password |

**Dashboard Home — 4 summary cards:** Total Institutions (active count + trend arrow), Pending Requests (count, orange if > 0), Monthly Revenue (PHP + % change), Expiring Soon (renewing within 7 days, red if overdue).

**Recent Activity Table (last 20):** Date | Event (`New Request` / `Payment Received` / `Subscription Expired` / `Tenant Provisioned`) | Institution | Status badge | `View Details` button. Filterable by event type and date range.

**Bottom row — two panels:** Subscription Status Donut (Active / Read-Only / Suspended / Cancelled) + Revenue Bar Chart (last 12 months).

**Onboarding Requests Page — table:** Request Date | Institution Name | Representative (name + email + phone) | Chosen Plan | Status (`PENDING_REVIEW` / `PENDING_PAYMENT` / `ACTIVE` / `REJECTED` / `EXPIRED`) | Actions.
- **Approve flow:** confirm → generate PayMongo link → status `PENDING_PAYMENT` → email representative.
- **Reject flow:** required reason text area → confirm → status `REJECTED` → email reason.

**Institutions Page — table:** Institution Name (clickable) | Subdomain | Plan | Status (`ACTIVE` / `READ_ONLY` / `SUSPENDED`) | Students (aggregated count only) | Staff (aggregated count only) | Subscription Expires | `View` action. Detail view shows subscription history, plan changes, aggregated stats. **Never** show student names, grades, or financial details.

**Revenue Page:** date range filter, table (Date | Institution | Amount | Payment Method | PayMongo Reference), CSV export, summary bar (Total Revenue, Average per Institution).

**Support Access Page:** institution search, "Request Access" button (sends 6-digit code to that institution Admin's dashboard), Active Sessions table with countdown timer (max 24h), History table.

---

### 3.2 Institution Admin Dashboard

**URL:** `{institution}.okit.ph/admin` — Full institutional control. Curriculum, staff, finances (structure only), reports, overrides.

**Sidebar:** Dashboard Home, Branding, Academic Calendar, Curriculum, Grading Setup, Financial Setup, Staff Management, Student Records, Grade Management, Reports, Audit Log, Notifications, Support Access, Subscription, My Account.

**Dashboard Home — 5 summary cards:** Total Students (`ENROLLED_ACTIVE` + `ENROLLED_RESTRICTED` this term), New Enrollments (current month), Collection Rate (% of assessed tuition collected), Pending Actions, Active Staff (Operator + Cashier + Instructor count).

**Pending Actions Queue — types:**

| Type | Details | Buttons |
|:---|:---|:---|
| Grade Correction Request | Instructor, student, subject, old → new score, reason | Approve / Reject |
| Withdrawal Request | Student, program, reason | Approve / Reject |
| Exam Lockout Override | Student, subject, current participation %, reason | Grant Override / Deny |
| Leave of Absence | Student, program, requested duration | Approve / Reject |

**Bottom row — two charts:** Enrollment by Program (horizontal bar) + Collection Summary (stacked bar Collected vs. Outstanding per month).

**Branding Page:** logo upload (PNG/SVG ≤ 2 MB) with live preview on a mock header, accent color picker (hex or wheel) with live preview on mock buttons/links, Save (applies institution-wide).

**Academic Calendar Page:** expandable Academic Year list, "Add Academic Year" modal (name + start + end), "Add Term/Semester" modal within each year, status badges (`ACTIVE` / `UPCOMING` / `COMPLETED`), lock icon when students are enrolled.

**Curriculum Page (nested accordion):** Department → Program (with required units) → Year Level → Subject (code, name, units, term, instructor, student count). Edit/deactivate rules per the locking section above.

**Grading Setup Page (fully admin-managed — nothing is hardcoded):**

- **Sub-tab 1 — Grade Scales (CRUD):**
  - Table: Name | Min–Max Raw | Passing Cutoff | # Bands | Default? | Locked? | Actions (Edit / Duplicate / Set Default / Delete if unused).
  - **Add/Edit Grade Scale modal:** Name, Description, Min Raw Score, Max Raw Score, **Passing Raw Score** (numeric, required — this REPLACES any hardcoded "75"), Bands editor (rows: Min Raw, Max Raw, Display Value, Remark, Order). The system validates that bands fully cover the Min–Max range with no gaps and no overlaps before saving.
  - Seeded but editable presets: "PH College 1.00–5.00 (Passing 3.00)", "PH K–12 60–100 (Passing 75)", "US Letter A–F (Passing C)". Admin may edit, duplicate, or delete any preset.
  - Locking: a Grade Scale becomes locked when at least one Grading Formula referencing it is itself locked (i.e. students are enrolled).
- **Sub-tab 2 — Formulas:** scope selector (Program | Subject), **Grade Scale dropdown** (choose which scale this formula uses), component builder (must total 100%), participation threshold (default 75% but editable), Attendance/Engagement weight split (linked sliders, default 60/40), lock indicator.
- **Computed Final Grade** is always rendered through the linked Grade Scale's bands — meaning the displayed value (e.g. "1.25", "A−", "Very Good") and the Pass/Fail decision both come from data, not from code constants.

**Financial Setup Page:** tuition rate per unit (PHP), miscellaneous fees table (add/edit/remove), Payment Schemes (Full, 2-installment, 3-installment, etc.) with installment percent + due-date offset, lock indicator (locked once any slip is generated).

**Staff Management Page — table:** Name | Email | Role (`Operator` / `Cashier` / `Instructor`) | Assigned Subjects (instructors only) | Status | Last Login | Actions (Edit / Deactivate / Reset Password). **Add Staff modal:** full name, email, role, multi-select subject assignments (instructors only).

**Student Records Page (read-only) — table:** Student ID | Name (clickable) | Program | Year Level | Status | Balance (summary only) | Term. Filters: Status, Program, Year Level, Term. **Detail view:** profile, enrollment history, per-term subject list with status, participation meter per subject. Admin **cannot** edit grades from here.

**Grade Management Page — tabs:** Pending Corrections (Approve/Reject), Submitted Grades (subjects where Instructor clicked "Submit Grades"; Admin clicks "Finalize"), Finalized Grades (read-only archive, searchable by term & program).

**Reports Page — each exportable as CSV and PDF:** Enrollment, Financial Summary, Academic Performance, Attendance Summary, Collection Report.

**Audit Log Page — table:** Timestamp | Actor (name + role badge) | Action | Target | Details (expandable JSON diff). Filters: date range, actor, action type, target type. Admin can view + export but **cannot edit or delete**.

---

### 3.3 Operator Dashboard

**URL:** `{institution}.okit.ph/operator` — Student enrollment, assessment slip generation, enrollment lifecycle.

**Sidebar:** Dashboard Home, New Enrollment, Student Directory, Assessment Slips, Re-Enrollment, Year Advancement, My Account.

**Dashboard Home — 4 cards:** Enrolled This Term, Pending Assessment (`APPLICANT`), Pending Payment (`ASSESSED`), Processed Today.

**Recent Activity Table:** Time | Action (`Student Registered` / `Assessment Slip Generated` / `Subject Dropped` / `Re-Enrollment Processed`) | Student | Program / Year Level | Status.

**New Enrollment — 3-step wizard:**

- **Step 1 — Student Information:** First Name (req), Middle Name, Last Name (req), Date of Birth (req), Gender (req), Contact Number (req), Email, Address (req), Guardian Name (req if minor), Guardian Contact (req if minor), ID Photo (JPEG/PNG ≤ 1 MB).
- **Step 2 — Academic Placement:** Department → Program → Year Level → Term (cascading dropdowns), then a **read-only** Subject List (code, name, units). Operator cannot modify subjects.
- **Step 3 — Payment Scheme & Assessment:** Payment Scheme dropdown, Breakdown Preview (Tuition (units × rate), each misc fee, Total, per-installment lines with due dates), **"Confirm & Generate"** → creates Student (`ASSESSED`), generates Assessment Slip PDF, opens print dialog.

**Student Directory Page — search by name/ID/contact. Table:** Student ID | Name (clickable) | Program | Year Level | Status (color-coded) | Actions (`View`, `Drop Subject`, `Request Withdrawal`).

- **Drop Subject modal:** dropdown of current subjects → confirm → system shows "Refund eligible" or "No refund — past deadline"; if eligible, auto-create `PENDING` Refund for the Cashier.
- **Request Withdrawal modal:** required reason → submits to Admin's pending actions queue.

**Operator does NOT see grades, financial amounts, or participation scores in detail views.**

**Assessment Slips Page — table:** Slip Code | Student Name | Program / Year Level | Total Amount | Payment Scheme | Generated Date | Payment Status (`UNPAID` / `PARTIALLY_PAID` / `FULLY_PAID`) | `Reprint` (PDF download).

**Re-Enrollment Page:** search existing student → modal: New Term + New Year Level (system suggests next, Operator may override) → auto-populate subjects → assessment generation flow.

**Year Advancement Page — table:** Student Name | Current Program / Year Level | Subjects Passed | Subjects Failed (red if any) | Eligible (Yes/No) | Actions (`Advance` if eligible / `Flag for Admin` if failed subjects exist).

---

### 3.4 Cashier Dashboard

**URL:** `{institution}.okit.ph/cashier` — Payment processing, receipts, refunds, daily reconciliation. **Zero access** to academic data.

**Sidebar:** Dashboard Home, Accept Payment, Payment History, Refunds, Official Receipts, Daily Reconciliation, Collection Reports, My Account.

**Dashboard Home — 4 cards:** Collected Today, Transactions Today, Pending Refunds, Outstanding Balances.

**Today's Transactions Table:** Time | OR Number | Student Name | Slip Code | Amount Paid | Payment Type (`Full` / `Installment N`) | Actions (`View OR`, `Reprint OR`).

**Accept Payment — 3 steps:**

1. **Look Up Slip:** Slip Code input + Look Up button.
2. **Slip Details (read-only):** Student Name, Program / Year Level, Total Assessment, Payment Scheme, Amount Due Now, Previous Payments, Remaining Balance.
3. **Record Payment:** Amount Tendered (must be ≥ Amount Due), Change (auto-calculated). **Confirm** → record payment, update Student → `ENROLLED_ACTIVE` (or maintain), generate OR PDF, print dialog.

The Cashier **cannot** modify slip details — only confirm payment against system display.

**Payment History — filters: date range, student name, slip code. Table:** Date | OR Number | Student Name | Slip Code | Amount | Type | Actions (`View OR`, `Void` requires reason; void creates a `VOID` entry — does not delete).

**Refunds Page — table (system-generated only):** Date Created | Student Name | Reason (`Subject Drop` / `Full Withdrawal`) | Refund Amount | Status (`PENDING` / `PROCESSED`) | `Process Refund` button (records cash disbursement, issues refund receipt, marks `PROCESSED`). Cashier **cannot** create refund entries.

**Daily Reconciliation Page:** Date selector (default today), System Total (auto), Voided Total (auto), Refunds Total (auto), Net Collection = System − Voided − Refunds, Cash on Hand input, Discrepancy = Cash on Hand − Net Collection (red if ≠ 0), Notes, **Submit Reconciliation** (saved record, visible to Admin).

**Collection Reports Page:** Daily / Weekly / Monthly / Custom Range. Each report shows total collected, total voided, total refunded, net collection. Exportable as CSV and PDF.

---

### 3.5 Instructor Dashboard

**URL:** `{institution}.okit.ph/instructor` — Course delivery, attendance, grading. **Strictly scoped** to assigned subjects only. **Zero access** to financial data.

**Sidebar:** Dashboard Home, My Subjects, Gradebook, Attendance, Content Manager, Quizzes & Exams, Grade Corrections, My Account.

**Dashboard Home — 4 cards:** Assigned Subjects, Total Students, Pending Grading, Upcoming Deadlines (next 7 days).

**Subject Cards (one per assigned subject):** Subject Code + Name | Program / Year Level | Enrolled Students | Content Items | Average Participation | Average Grade so far | Quick Actions (`View Students`, `Upload Content`, `Record Attendance`, `Open Gradebook`).

**My Subjects Page — Student Roster Table per subject:** Student ID | Name | Participation (color: green ≥ threshold, yellow ≥ 80% of threshold, red < 80%) | Attendance Rate | Current Grade | Exam Eligible (Yes ✓ or No ✗ with "Participation: X%, Required: Y%").

**Gradebook Page (spreadsheet-style):** subject selector (assigned only), rows = students, columns = grading components (e.g. Quiz 1, Quiz 2, Assignment 1, Midterm Exam, Final Exam) + read-only **Computed Final Grade** column. Header row shows each component's weight (e.g. "Quizzes — 20%"). Save scores incrementally. **Submit Grades** button shows confirmation listing students with missing scores.

**Attendance Page — Session-Based View:** date picker, session type (`Lecture` / `Lab` / `Tutorial`), per-student radio (`Present` / `Late` / `Absent` / `Excused`), Save (entries become immutable). **Correction flow:** `Submit Correction` per student → modal (new status + required reason) → creates `CORRECTION` entry linked to original. **Summary tab:** Total Sessions | Present | Late | Absent | Excused | Attendance Rate (Present + Late + Excused as attended, Late weighted 0.5).

**Content Manager Page — table:** Type icon (`File` / `Video` / `Announcement`) | Title | Uploaded Date | File Size | Downloads/Views | Actions (`Edit Title`, `Replace File`, `Delete` — soft-delete). **Upload modal:** Content Type (radio), Title (req), Description, File (PDF/DOCX/PPTX ≤ 50 MB; MP4 ≤ 500 MB or external URL), Publish Immediately toggle.

**Quizzes & Exams Page — table:** Title | Type (`Quiz` / `Midterm` / `Final`) | Questions | Total Points | Status (`Draft` / `Published` / `Closed`) | Deadline | Submissions | Actions (`Edit` if Draft, `Publish`, `Close`, `View Results`). **Builder:** Title, Type, Deadline, Time Limit (0 = unlimited), Question builder (MCQ with 4 options + correct mark, T/F, Short Answer with manual grading), Preview, Save as Draft / Publish. **Final Exam respects participation gate.**

**Grade Corrections Page — table:** Date Submitted | Student Name | Subject | Component | Old Score | New Score | Reason | Status (`PENDING` / `APPROVED` / `REJECTED`). **Submit Correction modal:** Subject (assigned only) → Student (in subject) → Component → Current Score (auto, read-only) → Corrected Score → Reason (required).

---

### 3.6 Student Dashboard

**URL:** `{institution}.okit.ph/student` — View academic status, access course content, take assessments, track progress. **Zero ability to modify any data.**

**Sidebar:** Dashboard Home, My Subjects, My Grades, My Schedule, Payments, Notifications, My Account.

**Status Banner (full-width, top of dashboard):**

| Status | Color | Message |
|:---|:---|:---|
| `APPLICANT` | Gray | "Your application is being processed. Please visit the Operator's office." |
| `ASSESSED` | Yellow | "Your Assessment Slip has been generated. Please proceed to the Cashier for payment." |
| `ENROLLED_ACTIVE` | Green | "You are enrolled and active for [Term Name]." |
| `ENROLLED_RESTRICTED` | Red | "Your access is restricted due to an overdue payment. Please visit the Cashier." |
| `WITHDRAWN` | Gray | "You have withdrawn from the current term." |
| `ON_LEAVE` | Blue | "You are on an approved leave of absence." |

**Summary Cards (visible only when `ENROLLED_ACTIVE` or `ENROLLED_RESTRICTED`):** Subjects This Term, Overall Participation, Assignments Due (next 7 days), Outstanding Balance.

**Subject Overview Cards (one per enrolled subject):** Subject Code + Name | Instructor | Participation Meter (color-coded progress bar) | Current Grade ("No scores yet" if none) | Subject Status (`ONGOING` / `PASSED` / `FAILED`) | New Content badge | `Open Subject`.

**Subject Detail Page — 5 tabs:**

- **Tab 1 — Content:** Type icon | Title | Posted Date | Status (`New` / `Viewed` / `Downloaded`) | Actions (`Download` / `Watch` / `Read`). Disabled with lock icon if status ≠ `ENROLLED_ACTIVE`.
- **Tab 2 — Quizzes & Exams:** Title | Type | Deadline | Status (`Not Started` / `In Progress` / `Completed` / `Locked`) | Score (after grading) | `Take Quiz` (disabled if `Locked` or not `ENROLLED_ACTIVE`). Final Exam shows "Locked — Participation: X%, Required: Y%" if below threshold.
- **Tab 3 — Assignments:** Title | Deadline | Status (`Not Submitted` / `Submitted` / `Late` / `Graded`) | Score | Actions (`Upload Submission`, `View Feedback`).
- **Tab 4 — Attendance:** Date | Session Type | Status. Summary header: total sessions, attendance rate %.
- **Tab 5 — Participation Meter (Detail):** Attendance Score (X%, weight 60%) | Engagement Score (Y%, weight 40%) | Composite Participation (Z%) with threshold line | Status ("On Track" / "At Risk" / "Below Threshold").

**My Grades Page:** term selector (default current). Table: Subject Code | Subject Name | Instructor | Component Scores (expandable per component with weights) | Computed Final Grade (read-only — rendered through the linked Grade Scale's bands, e.g. "1.25 — Very Good" or "A−") | Status. Status remains `ONGOING` until Admin finalizes; then `PASSED` or `FAILED`, decided by the Admin-managed Grade Scale (no hardcoded cutoff).

**Payments Page (informational only):** Current Term Assessment (itemized), Payment Scheme (with schedule), Payment History (Date, OR Number, Amount, Installment #), Outstanding Balance, Next Due Date (red if overdue), Download Assessment Slip PDF, Download OR PDF (one per payment). The student **cannot** make online payments here.

**Notifications Page:** chronological list (Date | Type icon | Message | Read/Unread). Click to mark as read and navigate to relevant page.

**My Account Page:** Name (no), Student ID (no), Program (no), Year Level (no), Email (no), Contact Number (no), ID Photo (no), Password (yes — current + new + confirm). All non-password edits go through the Operator.

---

## 4. Public Landing Page (`www.okit.ph` and `okit.ph`)

A formal, LMS-grade marketing site that introduces OKIT, lists subscription plans, and routes visitors to onboarding or login. Implemented as Blazor Server pages under a separate `Public` area with **no authentication required**. The aesthetic must feel like a real production LMS (think Canvas, Schoology, Moodle Workplace) — clean grid, generous white space, formal typography, no playful illustrations.

### 4.1 Brand System (derived from the OKIT logo)

Use this palette across the landing page, marketing pages, login screens, and the default institution branding before an Admin customizes it.

| Token | Hex | Usage |
|:---|:---|:---|
| `--okit-orange` | `#F37021` | Primary CTAs, key highlights, logo accent (graduation cap) |
| `--okit-orange-deep` | `#D85A12` | Hover state for primary CTAs |
| `--okit-teal` | `#1FA9A0` | Secondary buttons, links, infographic accents (logo loop) |
| `--okit-teal-deep` | `#137A74` | Hover state for secondary buttons |
| `--okit-navy` | `#1B2A4E` | Headings, top nav, footer background, "Okit" wordmark color |
| `--okit-slate` | `#3F4A66` | Body copy |
| `--okit-mist` | `#F4F6FA` | Section background bands |
| `--okit-white` | `#FFFFFF` | Page background, card surfaces |
| `--okit-success` | `#1E9E6A` | Active / paid badges |
| `--okit-warning` | `#E0A100` | Pending / attention badges |
| `--okit-danger` | `#C0392B` | Restricted / overdue / errors |

Typography: **Inter** (UI + body) and **Plus Jakarta Sans** (headings) loaded via Google Fonts; fall back to system sans-serif. Base font size 16px, line height 1.6. Headings use `--okit-navy`. Body copy uses `--okit-slate`. Buttons use 8px radius. Cards use 12px radius with a 1px `#E5E9F2` border and a subtle `0 2px 8px rgba(27,42,78,0.06)` shadow.

Persist the palette as CSS custom properties on `:root` in `wwwroot/css/okit-brand.css`. Per-tenant accent color overrides `--okit-orange` only; the rest of the palette stays consistent so the platform feels unified.

### 4.2 Page Map

| Path | Page |
|:---|:---|
| `/` | Home (hero + value props + plan teaser + CTA) |
| `/about` | About OKIT (mission, who it's for, key principles) |
| `/features` | Features (six dashboards explained at a marketing level) |
| `/pricing` | Subscription Plans (full plan comparison table) |
| `/security` | Security & Data Privacy (multi-tenant isolation, audit log, RA 10173 compliance) |
| `/contact` | Contact form + email + Philippine address placeholder |
| `/onboard` | Apply for an institution account (creates an `OnboardingRequest`) |
| `/login` | Role-aware login (redirects to the right dashboard after auth) |
| `/legal/terms`, `/legal/privacy` | Terms of Service and Privacy Policy (placeholder content the legal team can replace) |

### 4.3 Top Navigation (sticky)

Left: OKIT logo (image) + wordmark.  Center: Home · About · Features · Pricing · Security · Contact.  Right: secondary "Sign In" link + primary "Apply for an Account" button (`--okit-orange`). Mobile: hamburger menu.

### 4.4 Home Page Sections (in order)

1. **Hero band (white background, navy headline):**
   - H1: "School operations, simplified."
   - Sub: "OKIT is a multi-tenant platform that unifies enrollment, finance, academics, and student engagement for Philippine schools."
   - Two CTAs: primary "Apply for an Account" (orange) → `/onboard`, secondary "Sign In" (outlined teal) → `/login`.
   - Right side: a polished product mockup (a screenshot of the Admin dashboard with the brand palette applied — placeholder image until real screens exist).
2. **Trust strip:** small text "Built for Philippine schools • PHP-native • RA 10173-aware • Subdomain-isolated tenants" with three subtle icons.
3. **Six-role overview (`--okit-mist` background):** a 3×2 grid of cards, one per role (Super Admin, Institution Admin, Operator, Cashier, Instructor, Student). Each card: icon (Lucide-style), role name in navy, one-sentence description, "Learn more" link to the matching anchor on `/features`.
4. **How it works:** four numbered steps with thin teal connectors — *Apply* → *Get Approved* → *Configure* → *Operate*.
5. **Why OKIT (3-column band):** Multi-tenant by design • Locked-in audit trail • PHP-native finances. Each column has an icon, a short heading in navy, and 2–3 sentences in slate.
6. **Plan teaser:** the three pricing tiers as compact cards with "See full comparison →" linking to `/pricing`.
7. **Footer (navy background, white text):** four columns — Product (links), Company, Legal, Contact. Below: "© [year] OKIT. All rights reserved." centered, small.

### 4.5 Pricing Page (`/pricing`)

Header: "Choose the plan that fits your institution." Sub: "All plans include the full six-role workflow, multi-tenant isolation, and unlimited audit history. Pricing is monthly in PHP and billed via PayMongo."

Three plan cards side by side, the middle one elevated with a "Most Popular" ribbon in `--okit-orange`:

| Plan | Starter | Standard *(Most Popular)* | Enterprise |
|:---|:---|:---|:---|
| Monthly Price | **₱4,999 / mo** | **₱9,999 / mo** | **₱19,999 / mo** |
| Students included | up to 300 | up to 1,500 | up to 5,000 |
| Staff accounts | up to 20 | up to 100 | up to 500 |
| Departments / Programs | unlimited | unlimited | unlimited |
| Storage (content + uploads) | 20 GB | 100 GB | 500 GB |
| Custom branding | ✓ | ✓ | ✓ |
| Audit log retention | 1 year | 3 years | 7 years |
| Reports (CSV + PDF export) | ✓ | ✓ | ✓ |
| 2FA for Admin & Cashier | ✓ | ✓ | ✓ |
| Priority email support | — | ✓ | ✓ |
| Dedicated onboarding session | — | — | ✓ |
| Quarterly account review | — | — | ✓ |
| Annual billing discount | 1 month free | 1 month free | 2 months free |
| CTA | "Start with Starter" | "Get Standard" | "Talk to Sales" |

Below the cards:
- Full-width comparison table (same rows as above) for accessibility.
- FAQ accordion (5 items): *Can we change plans later?*, *What happens if we exceed our student cap?*, *How are refunds handled?*, *Is data exportable on cancellation?*, *Where is the data hosted?*
- Final CTA banner (orange background, white text): "Ready to modernize your campus? **Apply for an Account →**".

These plan rows must also be **seeded into the `SubscriptionPlan` table** so the Super Admin Dashboard's "Subscription Plans" page reflects them on first run; the Super Admin can then edit prices, caps, and features without redeploying.

### 4.6 Onboarding Page (`/onboard`)

Multi-step form (matches Section 3.1's `OnboardingRequest` entity):

1. **Institution info:** Institution name, type (College / High School / K-12 / Vocational), address, expected student count.
2. **Representative:** Full name, role/title, email, phone.
3. **Plan selection:** card-based selector (pulls from `SubscriptionPlan`).
4. **Review & submit:** preview, accept Terms, submit. On success: confirmation screen "Your application has been received. We'll email you within 2 business days." Creates an `OnboardingRequest` with status `PENDING_REVIEW`.

### 4.7 Login Page (`/login`)

Centered card, OKIT logo on top, formal copy "Sign in to your institution." Email + password fields, "Remember me", "Forgot password?". On submit, the system reads `User.Role` and `User.TenantId` and redirects to the appropriate dashboard URL. 2FA challenge appears here for Admin/Cashier when enabled.

---

## 5. Loophole Audit & Hardening

This section enumerates loopholes that existed in the earlier draft of the plan and the corrective requirements that close them. **All items below are mandatory**, not suggestions.

### 5.1 Hardcoded grading values

- **Loophole:** Default passing grade was `75` and bands were implied by code, not data. A school using a 1.00–5.00 scale or a 60–100 scale could not configure pass/fail correctly without code changes.
- **Fix:** Introduced `GradeScale` + `GradeScaleBand` entities (Section 1.2). The Admin manages all grading bases via the **Grading Setup → Grade Scales** sub-tab (Section 3.2). No business-logic file may contain the literal `75` (or any other cutoff) as a passing-grade constant. Defaults exist only as seed-data presets that the Admin can edit, duplicate, or delete.

### 5.2 Cross-tenant data leakage

- **Loophole:** Without enforcement, a developer could write a LINQ query that omits `TenantId` and accidentally return another institution's data.
- **Fix:** EF Core global query filter on every tenant-scoped entity. Add an integration test that logs in as Tenant A, attempts to fetch a known Tenant B record by `Id`, and asserts a 404 / null. Pen-test by attempting a forged `TenantId` claim — must be ignored in favor of the subdomain-resolved tenant.

### 5.3 Audit-log tampering

- **Loophole:** A privileged DB user (or a buggy migration) could rewrite audit entries.
- **Fix:** `AuditLog` is append-only at the application layer (`SaveChanges` interceptor refuses to track Modified/Deleted states for this entity) and at the DB layer via a SQL `INSTEAD OF UPDATE` and `INSTEAD OF DELETE` trigger that raises an error. Hash-chain each row by storing `PreviousRowHash` + `RowHash` (SHA-256 of canonical JSON of the row including PreviousRowHash) so any after-the-fact edit is detectable.

### 5.4 Race conditions on locking

- **Loophole:** Two staff members could simultaneously edit a Grading Formula and a student enrollment, ending up with a "locked" formula whose components changed mid-flight.
- **Fix:** Every lockable entity has a `RowVersion` (`byte[]`, `[Timestamp]`) column for optimistic concurrency. Save operations re-check the lock condition inside a serializable transaction; if the entity has become locked, the save fails with a friendly "This was just locked by enrollment activity — please refresh."

### 5.5 Money/decimal precision

- **Loophole:** Using `double` or `float` for tuition or PHP totals introduces rounding errors in installment math.
- **Fix:** All monetary fields use `decimal(18,2)`. All math uses `MidpointRounding.ToEven`. Installments are rounded individually and the **last** installment absorbs any 1-centavo remainder so the sum equals the assessed total exactly.

### 5.6 PDF / Receipt forgery

- **Loophole:** A reprinted Official Receipt is indistinguishable from a forged one.
- **Fix:** Every Assessment Slip and Official Receipt PDF includes a system-generated QR code that encodes a signed URL `https://{tenant}.okit.ph/verify/{or-number}?sig={hmac}` (HMAC-SHA256 with a per-tenant secret). The verification endpoint is public (no login) but tenant-scoped and shows "Valid Receipt" with amount/date or "Not Found / Tampered."

### 5.7 File-upload abuse

- **Loophole:** Instructors and Operators can upload files; a malicious file could host malware or be used as storage abuse.
- **Fix:** Whitelist MIME types and extensions per upload type (already specified). Validate magic bytes server-side, not just the extension. Cap total per-tenant storage by plan (Section 4.5). All uploads are stored outside the web root and served through an authorized streaming endpoint.

### 5.8 Brute-force and credential stuffing

- **Loophole:** Identity has weak defaults out of the box.
- **Fix:** Lock the account for 15 minutes after 5 failed sign-ins. Enforce password policy (≥ 10 chars, mixed). Require 2FA (TOTP) for Admin and Cashier; offer optional 2FA for Operator and Instructor. Force password change on first login for all seeded users.

### 5.9 CSRF, XSS, clickjacking

- **Fix:** Antiforgery tokens on every Blazor form. Strict Content-Security-Policy header (`default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com`). `X-Frame-Options: DENY`, `Referrer-Policy: same-origin`, `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`. All user-supplied content is HTML-encoded at render time.

### 5.10 Cashier voids / refunds abuse

- **Loophole:** A Cashier can void any payment unilaterally.
- **Fix:** Voids require a reason (already specified) **and** silently route to the Audit Log with the actor's name + timestamp. A daily "Voids over ₱X" report goes to the Admin's Pending Actions queue automatically — Admin must acknowledge each void. Refunds can only originate from system events (Admin-approved drops/withdrawals), never from a Cashier free-form action.

### 5.11 Time and timezone bugs

- **Loophole:** Mixing local and UTC times causes off-by-a-day in cutoffs.
- **Fix:** All persisted timestamps are UTC. The application's "today" for Cashier reconciliation, Pending Payments, and Final Exam deadlines uses **Asia/Manila** explicitly (`TimeZoneInfo.FindSystemTimeZoneById("Asia/Manila")` on Windows; `"Asia/Manila"` on Linux). Add a unit test that creates a payment at 23:30 UTC and asserts it counts toward the next Manila day, not yesterday.

### 5.12 Subscription & data-retention edge cases

- **Loophole:** When a tenant subscription expires, what happens to their data?
- **Fix:** Status transitions: `ACTIVE` → on subscription expiry → `READ_ONLY` (login allowed, no writes); after 30 days in `READ_ONLY` → `SUSPENDED` (login blocked, data preserved); after 90 days in `SUSPENDED` → tenant data is exported as ZIP, emailed to the representative, then `CANCELLED` (data wiped after a 14-day grace). The Super Admin can manually pause this state machine for any tenant.

### 5.13 Self-service data export on cancellation

- **Fix:** The Institution Admin's **Subscription** page has a "Request Data Export" button at any time, producing a ZIP of CSVs (students, enrollments, grades, payments) plus PDFs of every receipt and slip from the active term backwards.

### 5.14 Support Access misuse

- **Loophole:** Super Admin could enter a tenant covertly.
- **Fix:** Already required: 6-digit code + Admin approval + max 24h. Add: every page the Super Admin views inside a tenant under support access is logged to the tenant's Audit Log with a distinct "Support Access" actor type, visible to the Admin in real time.

---

## 6. Implementation Tasks (Build In This Order)

1. **Solution scaffolding:** create the 5 src projects + 3 test projects with the Clean Architecture references described in Section 0.
2. **Domain entities & enums:** implement Section 1 in `OKIT.Domain`, including `GradeScale` and `GradeScaleBand`.
3. **DbContext & migrations:** implement `ApplicationDbContext` in `OKIT.Infrastructure`, add a `TenantId` global query filter, create the initial migration, run `dotnet ef database update`. Add the `AuditLog` triggers and `RowVersion` columns described in Section 5.
4. **Identity + multi-tenancy:** integrate ASP.NET Core Identity with `AppUser`, add tenant-resolution middleware that maps `{subdomain}.okit.ph` → `TenantId`, add role policies, lockout settings, password policy, optional/required 2FA.
5. **Audit log infrastructure:** EF Core `SaveChangesAsync` interceptor that emits hash-chained `AuditLog` rows for every Create/Update/Delete on tenant-scoped entities.
6. **Brand system & shared layout:** add `wwwroot/css/okit-brand.css` with the palette tokens from Section 4.1, build the shared Blazor layout (top bar + sidebar + content), and the public landing-page layout (sticky nav + footer).
7. **Public landing pages:** Home, About, Features, Pricing, Security, Contact, Onboarding, Login, Legal — all per Section 4.
8. **Seed data:** seed the platform tenant, the three subscription plans from Section 4.5, one demo institution, one user per role with known passwords for development, the three Grade Scale presets.
9. **Build dashboards in this order, each fully functional before moving on:** Super Admin → Institution Admin (including the new **Grade Scales** sub-tab) → Operator → Cashier → Instructor → Student.
10. **PDFs:** Assessment Slip and Official Receipt with QR-code verification (Section 5.6), QuestPDF.
11. **Reports & exports:** all CSV/PDF exports indicated above, plus the data-export ZIP from Section 5.13.
12. **Notifications:** in-app bell + database persistence + optional email (toggleable on Admin Notifications page).
13. **Subscription state machine:** background job that runs daily and applies the transitions in Section 5.12.
14. **Tests:** xUnit unit tests for grading-formula computation (driven by Grade Scale data, no hardcoded cutoffs), refund-eligibility logic, locking rules, tenant isolation, audit-log immutability, money-rounding edge cases, Manila-time edge cases; bUnit tests for at least one page per dashboard plus the public landing page.
15. **Polish:** loading states, empty states, error pages, mobile-responsive layouts (the landing page must be fully responsive at 360 px and up).
16. **README:** include setup steps, connection-string config, default seeded credentials, how to run migrations, how to run the test suite.

---

## 7. Acceptance Criteria

- The solution opens cleanly in Visual Studio 2022 and builds with no errors.
- Public landing page renders the OKIT brand palette (orange / teal / navy on white) and is responsive from 360 px to 1920 px wide.
- `/pricing` shows the three plans seeded into `SubscriptionPlan`; editing a plan in the Super Admin dashboard immediately reflects on `/pricing`.
- All six dashboards are reachable and role-gated; logging in as the wrong role to a dashboard URL returns 403.
- **No hardcoded grading constant exists in the codebase.** A `grep` for the literal `75` in `*.cs` files (excluding seed data, migrations, tests, and CSS) returns zero matches in business logic. Pass/fail and grade band rendering are driven entirely by the Admin-managed `GradeScale` rows.
- Locking rules behave exactly as specified: edit a locked Grading Formula or Grade Scale → UI shows "Locked" with lock icon and Save is rejected server-side too.
- Tenant isolation: a SQL trace shows every tenant-scoped query carries a `WHERE TenantId = @p` clause via the global filter; the integration test in Section 5.2 passes.
- Audit log captures every write; attempting `UPDATE`/`DELETE` on `AuditLog` raises a SQL error; the hash chain validates end-to-end.
- Assessment Slip and Official Receipt PDFs render with the institution's logo, accent color, and a working QR-code verification URL.
- Final Exam is genuinely blocked for a student whose composite participation is below threshold (button disabled and server endpoint returns 403).
- All decimal money displays as `₱` with two decimals; installments sum to the assessed total exactly; all dates display in Asia/Manila.
- Subscription state machine moves a stale tenant `ACTIVE → READ_ONLY → SUSPENDED → CANCELLED` per the documented timeline in a fast-forwarded test.

---

## 8. Out of Scope (Do Not Build Yet)

- Online student-side payments (the spec explicitly says payments are physical at the Cashier).
- Mobile apps (the Web API project is scaffolded for future use but no mobile client is required).
- SMS notifications (toggle exists but the SMS gateway integration is a future task).
- AI-powered features (grade prediction, plagiarism detection, etc.).

---

**End of prompt.** Build the OKIT platform per the specifications above, exactly as written. When in doubt, prefer clarity, security, and tenant isolation over cleverness.
