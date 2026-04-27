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
- **GradingFormula** — `Id`, `Scope` (`Program` | `Subject`), `ScopeRefId`, `PassingGrade`, `ParticipationThreshold`, `AttendanceWeight`, `EngagementWeight`, `IsLocked`.
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
  - Financial Setup → locked when ≥ 1 Assessment Slip has been generated for the term.
  - Subject edit → locked when ≥ 1 student is enrolled in it for the current term.
  - Term dates → locked when ≥ 1 student is enrolled in the term.
  - Once a student is `ASSESSED`, the slip's amounts are immutable.
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

**Grading Setup Page:** scope selector (Program | Subject), component builder (must total 100%), passing grade (default 75), participation threshold (default 75), Attendance/Engagement weight split (linked sliders, default 60/40), lock indicator.

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

**My Grades Page:** term selector (default current). Table: Subject Code | Subject Name | Instructor | Component Scores (expandable per component with weights) | Computed Final Grade (read-only) | Status. Status remains `ONGOING` until Admin finalizes; then `PASSED` or `FAILED`.

**Payments Page (informational only):** Current Term Assessment (itemized), Payment Scheme (with schedule), Payment History (Date, OR Number, Amount, Installment #), Outstanding Balance, Next Due Date (red if overdue), Download Assessment Slip PDF, Download OR PDF (one per payment). The student **cannot** make online payments here.

**Notifications Page:** chronological list (Date | Type icon | Message | Read/Unread). Click to mark as read and navigate to relevant page.

**My Account Page:** Name (no), Student ID (no), Program (no), Year Level (no), Email (no), Contact Number (no), ID Photo (no), Password (yes — current + new + confirm). All non-password edits go through the Operator.

---

## 4. Implementation Tasks (Build In This Order)

1. **Solution scaffolding:** create the 5 src projects + 3 test projects with the Clean Architecture references described in Section 0.
2. **Domain entities & enums:** implement Section 1 in `OKIT.Domain`.
3. **DbContext & migrations:** implement `ApplicationDbContext` in `OKIT.Infrastructure`, add a `TenantId` global query filter, create the initial migration, run `dotnet ef database update`.
4. **Identity + multi-tenancy:** integrate ASP.NET Core Identity with `AppUser`, add tenant-resolution middleware that maps `{subdomain}.okit.ph` → `TenantId`, add role policies.
5. **Audit log infrastructure:** EF Core `SaveChangesAsync` interceptor that emits `AuditLog` rows for every Create/Update/Delete on tenant-scoped entities.
6. **Seed data:** seed the platform tenant, one demo institution, one user per role with known passwords for development.
7. **Shared Blazor layout:** top bar + sidebar + content area component, theming hooks for institution branding (logo + accent color).
8. **Build dashboards in this order, each fully functional before moving on:** Super Admin → Institution Admin → Operator → Cashier → Instructor → Student.
9. **PDFs:** Assessment Slip (Operator generation, Student/Cashier/Operator reprint) and Official Receipt (Cashier generation, Student/Cashier reprint) using QuestPDF.
10. **Reports & exports:** all CSV/PDF exports indicated above.
11. **Notifications:** in-app bell + database persistence + optional email (toggleable on Admin Notifications page).
12. **Tests:** xUnit unit tests for grading-formula computation, refund-eligibility logic, locking rules, and tenant isolation; bUnit tests for at least one page per dashboard.
13. **Polish:** loading states, empty states, error pages, mobile-responsive layouts, dark-mode support optional.
14. **README:** include setup steps, connection-string config, default seeded credentials, and how to run migrations.

---

## 5. Acceptance Criteria

- The solution opens cleanly in Visual Studio 2022 and builds with zero warnings as errors disabled but no errors.
- All six dashboards are reachable and role-gated; logging in as the wrong role to a dashboard URL returns 403.
- Locking rules behave exactly as specified: try to edit a locked Grading Formula → UI shows "Locked" with lock icon and Save is disabled server-side too.
- Tenant isolation: a SQL trace shows every tenant-scoped query carries a `WHERE TenantId = @p` clause via the global filter.
- Audit log captures every write; exporting the log returns CSV with full JSON diffs.
- Assessment Slip and Official Receipt PDFs render with the institution's logo and accent color.
- Final Exam is genuinely blocked for a student whose composite participation is below threshold (button disabled and server endpoint returns 403).
- All decimal money displays as `₱` with two decimals; all dates display in Asia/Manila.

---

## 6. Out of Scope (Do Not Build Yet)

- Online student-side payments (the spec explicitly says payments are physical at the Cashier).
- Mobile apps (the Web API project is scaffolded for future use but no mobile client is required).
- SMS notifications (toggle exists but the SMS gateway integration is a future task).
- AI-powered features (grade prediction, plagiarism detection, etc.).

---

**End of prompt.** Build the OKIT platform per the specifications above, exactly as written. When in doubt, prefer clarity, security, and tenant isolation over cleverness.
