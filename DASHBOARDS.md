# OKIT — Dashboard Specifications

## Complete UI Layout & Functions Per Role

Every dashboard follows the same structural pattern: a **top bar** (institution branding, user name, role badge, notifications bell, logout), a **left sidebar** (navigation links scoped to the role), and a **main content area** (the active page).

---

## 1. Super Admin Dashboard

> **URL:** `admin.okit.ph`
> **Purpose:** Platform-level oversight — subscriptions, revenue, onboarding. Zero access to any institution's internal data.

### Sidebar Navigation

| Menu Item | Icon | Description |
|:---|:---|:---|
| Dashboard Home | `LayoutDashboard` | Overview / summary cards |
| Onboarding Requests | `FileText` | Pending, approved, rejected institution requests |
| Institutions | `Building` | All active, suspended, and cancelled tenants |
| Enforcement Actions | `Gavel` | Manual suspend, re-enable, warn, purge |
| Subscription Plans | `CreditCard` | Manage plan tiers and pricing |
| Revenue | `TrendingUp` | Financial reports for SaaS income |
| Platform Audit Log | `ScrollText` | View-only log of all Super Admin actions |
| Support Access | `ShieldCheck` | Request time-limited access to an institution |
| My Account | `User` | Profile settings, change password, 2FA (mandatory) |

### Dashboard Home — Content Area

**Top Row: Summary Cards (4 cards)**

| Card | Data | Visual |
|:---|:---|:---|
| Total Institutions | Count of all `ACTIVE` institutions | Number + small trend arrow (vs. last month) |
| Pending Requests | Count of `PENDING_REVIEW` onboarding requests | Number, highlighted orange if > 0 |
| Monthly Revenue | Total PayMongo collections for the current month | Currency amount (PHP) + percentage change |
| Expiring Soon | Count of subscriptions renewing within 7 days | Number, highlighted red if any are overdue |

**Middle Row: Recent Activity Table**

| Column | Data |
|:---|:---|
| Date | Timestamp of event |
| Event | `New Request`, `Payment Received`, `Subscription Expired`, `Tenant Provisioned` |
| Institution | Institution name |
| Status | Badge: `Pending`, `Active`, `Suspended`, `Expired` |
| Action | Button: `View Details` |

Shows the last 20 platform-level events. Filterable by event type and date range.

**Bottom Row: Two Panels Side by Side**

| Left Panel: Subscription Status Breakdown | Right Panel: Revenue Chart |
|:---|:---|
| Donut chart: Active / Read-Only / Suspended / Cancelled | Bar chart: monthly revenue for the last 12 months |

### Onboarding Requests Page

**Table Columns:**

| Column | Content |
|:---|:---|
| Request Date | When the form was submitted |
| Institution Name | Name from the application form |
| Representative | Name + email + phone |
| Chosen Plan | Selected subscription tier |
| Status | `PENDING_REVIEW` / `PENDING_PAYMENT` / `ACTIVE` / `REJECTED` / `EXPIRED` |
| Actions | `Approve` button (generates payment link), `Reject` button (requires a reason text field) |

**Approve flow:** Click Approve → confirm dialog → system generates PayMongo link → status changes to `PENDING_PAYMENT` → email sent to representative.

**Reject flow:** Click Reject → modal with required reason text area → confirm → status changes to `REJECTED` → email sent with reason.

### Institutions Page

**Table Columns:**

| Column | Content |
|:---|:---|
| Institution Name | Clickable — opens detail view |
| Subdomain | e.g., `greenvalley.okit.ph` |
| Plan | Subscription tier name |
| Status | `ACTIVE` / `READ_ONLY` / `SUSPENDED` |
| Students (count) | Aggregated number only — no individual data |
| Staff (count) | Aggregated number only |
| Subscription Expires | Date |
| Actions | `View` (summary only, no internal data) |

**Detail view shows:** Subscription history (payments, renewals), plan changes, aggregated stats (total students, total staff). No names, grades, or financial details of students.

**Quick Actions on each institution row:**

| Button | Action |
|:---|:---|
| `Issue Warning` | Opens a modal: reason text area (required) → sends a formal warning email to the Admin. Logged. |
| `Force Read-Only` | Opens a confirmation modal: reason text area (required) → status changes to `READ_ONLY` immediately. Admin is emailed. |
| `Force Suspend` | Opens a confirmation modal: reason text area (required) → status changes to `SUSPENDED` immediately. Admin is emailed with reason and appeal instructions. 90-day retention countdown starts. |
| `Re-Enable` | Only visible for `READ_ONLY` or `SUSPENDED` institutions. Opens a modal: requires either PayMongo payment reference ID or a written override reason → status changes to `ACTIVE`. Logged. |
| `Extend Grace` | Opens a modal: number of extra days (numeric input) + reason → extends the automated grace deadline. |
| `Trigger Provisioning` | Only visible for `PENDING_PAYMENT` institutions. Super Admin clicks after manually confirming payment in PayMongo dashboard → provisions the tenant. |

### Enforcement Actions Page

A dedicated page for managing enforcement across all institutions.

**Active Enforcement Table (institutions currently under action):**

| Column | Content |
|:---|:---|
| Institution | Institution name |
| Current Status | `READ_ONLY` / `SUSPENDED` |
| Action Taken By | Super Admin who took the action |
| Reason | The mandatory reason provided |
| Date Enforced | When the action was taken |
| Days in Current Status | Auto-calculated |
| Data Purge Date | For suspended institutions: date when the 90-day countdown expires |
| Actions | `Re-Enable`, `Force Purge` (only if suspended 30+ days), `Extend Grace` |

**Force Purge flow:** Click button → warning dialog ("This action is irreversible") → type institution name to confirm → system emails a final data export to the institution Admin → data is purged → status moves to `PURGED`.

**Warning History Table:**

| Column | Content |
|:---|:---|
| Date | When the warning was issued |
| Institution | — |
| Reason | Warning message |
| Issued By | Super Admin name |
| Followed By | `None` / `Suspension on [date]` / `Re-enabled on [date]` |

### Platform Audit Log Page

An immutable, view-only log of every action taken by the Super Admin. The Super Admin **cannot modify or delete** entries on this page.

| Column | Content |
|:---|:---|
| Timestamp | When the action occurred |
| Actor | Super Admin name |
| Action | `INSTITUTION_SUSPENDED`, `INSTITUTION_RE_ENABLED`, `WARNING_ISSUED`, `GRACE_EXTENDED`, `DATA_PURGED`, `SUPPORT_ACCESS_REQUESTED`, `ONBOARDING_APPROVED`, `ONBOARDING_REJECTED` |
| Target | Institution name |
| Reason | The provided reason |
| Details | Expandable: previous status → new status |

**Filters:** Date range, action type, institution. **Export:** CSV.

### Revenue Page

| Component | Function |
|:---|:---|
| Date range filter | Select start/end dates |
| Revenue table | Date, institution, amount, payment method, PayMongo reference ID |
| Export button | Download CSV of filtered results |
| Summary bar | Total revenue for selected period, average per institution |

### Support Access Page

| Component | Function |
|:---|:---|
| Institution search | Search by name or subdomain |
| Request Access button | Sends a 6-digit code to the institution Admin's dashboard |
| Active Sessions table | Shows any current support access sessions with countdown timer (max 24 hours) |
| History table | Past support access sessions with timestamps and duration |

---

## 2. Institution Admin Dashboard

> **URL:** `{institution}.okit.ph/admin`
> **Purpose:** Full institutional control — curriculum, staff, finances (structure only), reports, and overrides.

### Sidebar Navigation

| Menu Item | Icon | Description |
|:---|:---|:---|
| Dashboard Home | `LayoutDashboard` | Overview with key metrics |
| Branding | `Palette` | Logo, accent color |
| Academic Calendar | `Calendar` | Academic years, terms/semesters |
| Curriculum | `BookOpen` | Departments → Programs → Year Levels → Subjects |
| Grading Setup | `Calculator` | Formulas, passing grades, participation thresholds |
| Financial Setup | `Banknote` | Tuition rates, fees, payment schemes |
| Staff Management | `Users` | Create/manage Operator, Cashier, Instructor accounts |
| Student Records | `GraduationCap` | View all students (read-only academic overview) |
| Grade Management | `ClipboardCheck` | Review submitted grades, finalize, handle corrections |
| Reports | `BarChart` | Enrollment, financial summary, academic performance |
| Audit Log | `ScrollText` | View-only immutable log of all system actions |
| Notifications | `Bell` | Configure notification preferences (email/SMS toggles) |
| Support Access | `ShieldCheck` | Confirm/deny support access codes from Super Admin |
| Subscription | `CreditCard` | View plan details, request cancellation, data export |
| My Account | `User` | Profile, change password, enable 2FA |

### Dashboard Home — Content Area

**Top Row: Summary Cards (5 cards)**

| Card | Data |
|:---|:---|
| Total Students | Count of all `ENROLLED_ACTIVE` + `ENROLLED_RESTRICTED` students this term |
| New Enrollments | Students enrolled in the current month |
| Collection Rate | Percentage of total assessed tuition that has been collected |
| Pending Actions | Count of items needing Admin attention (grade corrections, withdrawal requests, lockout overrides) |
| Active Staff | Count of active Operator + Cashier + Instructor accounts |

**Middle Section: Pending Actions Queue**

A prioritized list of items requiring the Admin's action:

| Type | Details | Action Buttons |
|:---|:---|:---|
| Grade Correction Request | Instructor name, student, subject, old score → new score, reason | `Approve` / `Reject` |
| Withdrawal Request | Student name, program, reason | `Approve` / `Reject` |
| Exam Lockout Override Request | Student name, subject, current participation %, reason | `Grant Override` / `Deny` |
| Leave of Absence Request | Student name, program, requested duration | `Approve` / `Reject` |

**Bottom Row: Two Charts**

| Left: Enrollment by Program | Right: Collection Summary |
|:---|:---|
| Horizontal bar chart showing student count per Program | Stacked bar: Collected vs. Outstanding per month |

### Branding Page

| Component | Function |
|:---|:---|
| Logo upload area | Drag-and-drop or click to upload (PNG/SVG, max 2 MB). Live preview on a mock header. |
| Accent color picker | Hex input or color wheel. Live preview on mock buttons and links. |
| Save button | Applies changes institution-wide immediately. |

### Academic Calendar Page

| Component | Function |
|:---|:---|
| Academic Year list | Expandable rows showing semesters/terms within each year |
| Add Academic Year | Button → modal: year name, start date, end date |
| Add Term/Semester | Button within an academic year → modal: term name, start date, end date |
| Status badges | `ACTIVE` (current term), `UPCOMING`, `COMPLETED` |
| Lock indicator | Shows a lock icon if students are enrolled in the term (dates become read-only) |

### Curriculum Page (Departments → Programs → Year Levels → Subjects)

**Layout:** Nested accordion/tree view.

| Level | Actions Available |
|:---|:---|
| Department | Add, rename, deactivate. Cannot delete if Programs exist underneath. |
| Program | Add, rename, deactivate. Set total required units for completion. |
| Year Level | Add (e.g., 1st Year, 2nd Year). Reorder. |
| Subject | Add: subject name, subject code, unit count, assigned term. Edit (only if no students enrolled in current term). Deactivate. |

Each subject row shows: subject code, name, units, assigned term, assigned Instructor (if any), and student count for the current term.

### Grading Setup Page

| Component | Function |
|:---|:---|
| Scope selector | Choose: apply formula to an entire Program, or to a specific Subject |
| Component builder | Add grading components (e.g., "Quizzes", "Assignments", "Final Exam") with weight percentages. Must total 100%. |
| Passing grade field | Numeric input (default 75%) |
| Participation threshold | Numeric input (default 75%) |
| Attendance / Engagement weight split | Two linked sliders (default 60/40) |
| Grade finalization deadline | Numeric input: days after Instructor submits grades (default 14). If the Admin does not finalize within this window, the system auto-finalizes. |
| Lock status indicator | Shows "Locked" with lock icon if students are enrolled. "Editable" if no enrollments yet for the term. |

### Financial Setup Page

| Component | Function |
|:---|:---|
| Tuition rate per unit | Numeric input (PHP) |
| Miscellaneous fees table | Itemized rows: fee name, amount. Add/remove/edit rows. |
| Payment schemes | Define available options: Full, 2-installment, 3-installment, etc. For each installment scheme: percentage per installment and due date offset (e.g., "2nd installment: 50% due 30 days after term start"). |
| Lock status indicator | Shows "Locked" if any Assessment Slip has been generated for the current term. |

### Staff Management Page

**Table Columns:**

| Column | Content |
|:---|:---|
| Name | Staff member's full name |
| Email | Login email |
| Role | `Operator` / `Cashier` / `Instructor` |
| Assigned Subjects | (Instructors only) List of assigned subject names for current term |
| Status | `Active` / `Deactivated` |
| Last Login | Timestamp |
| Actions | `Edit`, `Deactivate`, `Reset Password` |

**Add Staff button:** Modal form with fields: full name, email, role (dropdown), and (if Instructor) multi-select for subject assignments scoped to the active term.

### Student Records Page (Read-Only for Admin)

**Table Columns:**

| Column | Content |
|:---|:---|
| Student ID | System-generated |
| Name | Full name (clickable → detail view) |
| Program | Enrolled program |
| Year Level | Current year level |
| Status | `APPLICANT` / `ASSESSED` / `ENROLLED_ACTIVE` / `ENROLLED_RESTRICTED` / `WITHDRAWN` / `ON_LEAVE` |
| Balance | Outstanding financial balance (summary amount only) |
| Term | Current term |

**Filters:** Status, Program, Year Level, Term.

**Detail view:** Student profile, enrollment history across terms, subject list per term with status (`ONGOING` / `PASSED` / `FAILED` / `DROPPED`), and participation meter per subject. Admin cannot edit grades from here — grade management is a separate page.

### Grade Management Page

| Tab | Content |
|:---|:---|
| Pending Corrections | Table of Grade Correction Requests with Approve/Reject buttons |
| Submitted Grades | Subjects where the Instructor has clicked "Submit Grades." Admin reviews and clicks "Finalize" per subject. Shows subject name, Instructor, student count, submission date. |
| Finalized Grades | Read-only archive of finalized subjects. Searchable by term and program. |

### Reports Page

| Report | Content | Export |
|:---|:---|:---|
| Enrollment Report | Students per Program, per Year Level, per Term. Status breakdown. | CSV, PDF |
| Financial Summary | Total assessed, total collected, outstanding balance. By term, by program. | CSV, PDF |
| Academic Performance | Pass/fail rates per subject, per program. Average grades. | CSV, PDF |
| Attendance Summary | Average attendance rate per subject. Students below threshold. | CSV, PDF |
| Collection Report | Daily/weekly/monthly collections. Matches Cashier reports for reconciliation. | CSV, PDF |

### Audit Log Page

| Column | Content |
|:---|:---|
| Timestamp | When the action occurred |
| Actor | Staff name + role badge |
| Action | Human-readable description (e.g., "Recorded payment for Student #1042") |
| Target | Affected entity (student name, subject, etc.) |
| Details | Expandable row showing previous value → new value JSON diff |

**Filters:** Date range, actor, action type, target type. **Export:** CSV.

The Admin can view and export but **cannot edit or delete** any entries.

---

## 3. Operator Dashboard

> **URL:** `{institution}.okit.ph/operator`
> **Purpose:** Student enrollment, assessment slip generation, and enrollment lifecycle management.

### Sidebar Navigation

| Menu Item | Icon | Description |
|:---|:---|:---|
| Dashboard Home | `LayoutDashboard` | Overview of enrollment activity |
| New Enrollment | `UserPlus` | Register a new student |
| Student Directory | `Users` | Search and manage existing students |
| Assessment Slips | `FileText` | View/reprint generated slips |
| Re-Enrollment | `RefreshCcw` | Process returning students for a new term |
| Year Advancement | `ArrowUpCircle` | Promote students to the next year level |
| My Account | `User` | Profile, change password |

### Dashboard Home — Content Area

**Top Row: Summary Cards (4 cards)**

| Card | Data |
|:---|:---|
| Enrolled This Term | Count of students with status `ENROLLED_ACTIVE` or `ENROLLED_RESTRICTED` |
| Pending Assessment | Count of students with status `APPLICANT` (registered but no slip yet) |
| Pending Payment | Count of students with status `ASSESSED` (slip generated, not yet paid) |
| Processed Today | Number of enrollments and assessment slips the Operator generated today |

**Main Section: Recent Activity Table**

| Column | Content |
|:---|:---|
| Time | Timestamp |
| Action | `Student Registered`, `Assessment Slip Generated`, `Subject Dropped`, `Re-Enrollment Processed` |
| Student | Name |
| Program / Year Level | Academic placement |
| Status | Current student status |

### New Enrollment Page

**Step-by-step wizard (3 steps):**

**Step 1 — Student Information**

| Field | Type | Notes |
|:---|:---|:---|
| First Name | Text | Required |
| Middle Name | Text | Optional |
| Last Name | Text | Required |
| Date of Birth | Date picker | Required |
| Gender | Dropdown | Required |
| Contact Number | Text | Required |
| Email | Text | Optional |
| Address | Text area | Required |
| Guardian Name | Text | Required (if minor) |
| Guardian Contact | Text | Required (if minor) |
| ID Photo | File upload | JPEG/PNG, max 1 MB |

**Step 2 — Academic Placement**

| Field | Type | Notes |
|:---|:---|:---|
| Department | Dropdown | Populated from Admin's curriculum |
| Program | Dropdown | Filtered by selected Department |
| Year Level | Dropdown | Filtered by selected Program |
| Term | Dropdown | Shows active and upcoming terms |

On selection, the system auto-populates a **Subject List table** (read-only) showing: subject code, subject name, units. The Operator cannot add, remove, or modify subjects.

**Step 3 — Payment Scheme & Assessment**

| Field | Type | Notes |
|:---|:---|:---|
| Payment Scheme | Dropdown | Full, 2-Installment, 3-Installment (as configured by Admin) |

Below the dropdown, a **Breakdown Preview** appears:

| Item | Amount |
|:---|:---|
| Tuition (X units × PHP Y) | PHP Z |
| Lab Fee | PHP A |
| ID Fee | PHP B |
| ... (all misc fees) | ... |
| **Total** | **PHP Total** |
| Installment 1 (due: date) | PHP X |
| Installment 2 (due: date) | PHP Y |

**Confirm & Generate button:** Creates the student record (status `ASSESSED`), generates the Assessment Slip PDF. A print dialog opens automatically.

### Student Directory Page

**Search bar:** Search by name, student ID, or contact number.

**Table Columns:**

| Column | Content |
|:---|:---|
| Student ID | System-generated |
| Name | Full name (clickable → detail view) |
| Program | Current program |
| Year Level | Current year level |
| Status | Badge with color coding |
| Actions | `View`, `Drop Subject` (opens modal), `Request Withdrawal` (sends to Admin for approval) |

**Detail view:** Student profile info, current term subjects with status, enrollment history. The Operator does **not** see grades, financial amounts, or participation scores.

**Drop Subject modal:** Dropdown of the student's current subjects → select subject → confirm. System checks if before refund deadline and shows a message ("Refund eligible" or "No refund — past deadline"). The drop is processed immediately; if refund-eligible, a refund entry is created for the Cashier.

**Request Withdrawal modal:** Reason text field (required) → Submit. Goes to Admin's pending actions queue.

### Assessment Slips Page

**Table of all generated slips:**

| Column | Content |
|:---|:---|
| Slip Code | Unique code |
| Student Name | — |
| Program / Year Level | — |
| Total Amount | — |
| Payment Scheme | Full / Installment |
| Generated Date | — |
| Payment Status | `UNPAID` / `PARTIALLY_PAID` / `FULLY_PAID` |
| Actions | `Reprint` (PDF download) |

### Re-Enrollment Page

**Search for existing student → select → modal:**

| Field | Type |
|:---|:---|
| New Term | Dropdown (active/upcoming terms) |
| New Year Level | Dropdown (system suggests next level, Operator can override) |

On selection, the system auto-populates the subjects for the new term/year. The same assessment generation flow follows (payment scheme selection → breakdown → generate slip).

### Year Advancement Page

**Table of students eligible for advancement** (all current-term subjects are `PASSED` or `CREDITED`):

| Column | Content |
|:---|:---|
| Student Name | — |
| Current Program / Year Level | — |
| Subjects Passed | Count |
| Subjects Failed | Count (if any — highlighted red) |
| Eligible | Yes / No |
| Actions | `Advance` (if eligible) / `Flag for Admin` (if failed subjects exist) |

---

## 4. Cashier Dashboard

> **URL:** `{institution}.okit.ph/cashier`
> **Purpose:** Payment processing, receipt issuance, refunds, and daily reconciliation. Zero access to academic data.

### Sidebar Navigation

| Menu Item | Icon | Description |
|:---|:---|:---|
| Dashboard Home | `LayoutDashboard` | Today's collection summary |
| Accept Payment | `HandCoins` | Process a payment against an Assessment Slip |
| Payment History | `Receipt` | All recorded payments |
| Refunds | `ArrowLeftRight` | Process approved refund entries |
| Official Receipts | `FileCheck` | View/reprint issued ORs |
| Daily Reconciliation | `Scale` | End-of-day cash reconciliation |
| Collection Reports | `BarChart` | Daily, weekly, monthly summaries |
| My Account | `User` | Profile, change password, enable 2FA |

### Dashboard Home — Content Area

**Top Row: Summary Cards (4 cards)**

| Card | Data |
|:---|:---|
| Collected Today | Total PHP amount collected today |
| Transactions Today | Count of payments processed today |
| Pending Refunds | Count of approved refund entries awaiting processing |
| Outstanding Balances | Total unpaid balance across all students with installment plans |

**Main Section: Today's Transactions Table**

| Column | Content |
|:---|:---|
| Time | Timestamp of payment |
| OR Number | Official Receipt number |
| Student Name | — |
| Slip Code | Assessment Slip reference |
| Amount Paid | PHP amount |
| Payment Type | `Full` / `Installment 1` / `Installment 2` / etc. |
| Actions | `View OR`, `Reprint OR` |

### Accept Payment Page

**Step 1 — Look Up Slip**

| Component | Function |
|:---|:---|
| Slip Code input field | The Cashier types or scans the Assessment Slip code |
| Look Up button | Fetches the slip details |

**Step 2 — Slip Details (read-only display)**

| Field | Value |
|:---|:---|
| Student Name | From the slip |
| Program / Year Level | From the slip |
| Total Assessment | Total amount |
| Payment Scheme | Full / Installment |
| Amount Due Now | The current installment amount (or full amount) |
| Previous Payments | List of prior installment payments, if any |
| Remaining Balance | After this payment |

**Step 3 — Record Payment**

| Field | Type | Notes |
|:---|:---|:---|
| Amount Tendered | Numeric input | Must be ≥ Amount Due Now |
| Change | Auto-calculated | Amount Tendered − Amount Due |

**Confirm Payment button:** Records the payment, updates student status to `ENROLLED_ACTIVE` (or maintains it), generates the Official Receipt PDF. Print dialog opens.

The Cashier **cannot** modify any slip details — they can only confirm the payment amount against what the system shows.

### Payment History Page

**Table with filters (date range, student name, slip code):**

| Column | Content |
|:---|:---|
| Date | Payment date |
| OR Number | Unique receipt number |
| Student Name | — |
| Slip Code | — |
| Amount | PHP |
| Type | `Full` / `Installment 1` / `Installment 2` / etc. |
| Actions | `View OR`, `Void` (requires mandatory reason, creates a `VOID` entry — does not delete) |

### Refunds Page

**Table of system-generated refund entries (from Admin-approved drops/withdrawals):**

| Column | Content |
|:---|:---|
| Date Created | When the refund was approved |
| Student Name | — |
| Reason | `Subject Drop` / `Full Withdrawal` |
| Refund Amount | System-calculated based on refund policy |
| Status | `PENDING` / `PROCESSED` |
| Actions | `Process Refund` button (records cash disbursement, issues refund receipt, marks as `PROCESSED`) |

The Cashier **cannot** create refund entries — only process ones generated by the system after Admin approval.

### Daily Reconciliation Page

| Component | Function |
|:---|:---|
| Date selector | Defaults to today |
| System Total | Sum of all ORs issued on the selected date (auto-calculated) |
| Voided Total | Sum of voided ORs (auto-calculated) |
| Refunds Total | Sum of processed refunds (auto-calculated) |
| Net Collection | System Total − Voided − Refunds (auto-calculated) |
| Cash on Hand input | Cashier enters the physical cash count |
| Discrepancy | Cash on Hand − Net Collection (auto-calculated, highlighted red if ≠ 0) |
| Notes field | Text area for the Cashier to explain any discrepancy |
| Submit Reconciliation button | Saves the reconciliation record. Visible to Admin in reports. |

### Collection Reports Page

| Report | Content |
|:---|:---|
| Daily Report | All transactions for a selected date |
| Weekly Report | Aggregated by day for a selected week |
| Monthly Report | Aggregated by week for a selected month |
| Custom Range | User-defined start/end dates |

All reports show: total collected, total voided, total refunded, net collection. Exportable as CSV and PDF.

---

## 5. Instructor Dashboard

> **URL:** `{institution}.okit.ph/instructor`
> **Purpose:** Course delivery, attendance, grading. Scoped strictly to assigned subjects only. Zero access to financial data.

### Sidebar Navigation

| Menu Item | Icon | Description |
|:---|:---|:---|
| Dashboard Home | `LayoutDashboard` | Overview of assigned subjects |
| My Subjects | `BookOpen` | List of assigned subjects for the current term |
| Gradebook | `ClipboardList` | Input and view scores |
| Attendance | `UserCheck` | Record and view attendance |
| Content Manager | `Upload` | Upload files, videos, post announcements |
| Quizzes & Exams | `PenTool` | Create and manage assessments |
| Grade Corrections | `AlertCircle` | Submit and track correction requests |
| My Account | `User` | Profile, change password |

### Dashboard Home — Content Area

**Top Row: Summary Cards (4 cards)**

| Card | Data |
|:---|:---|
| Assigned Subjects | Count of subjects assigned this term |
| Total Students | Sum of enrolled students across all assigned subjects |
| Pending Grading | Count of submitted assignments/quizzes awaiting manual grading |
| Upcoming Deadlines | Count of assignments/quizzes with deadlines in the next 7 days |

**Main Section: Subject Cards (one card per assigned subject)**

Each card shows:

| Field | Value |
|:---|:---|
| Subject Code + Name | e.g., "CS101 — Introduction to Programming" |
| Program / Year Level | e.g., "BSIT — 1st Year" |
| Enrolled Students | Count |
| Content Items | Count of uploaded files/videos |
| Average Participation | Percentage across all students |
| Average Grade (so far) | Computed from current scores |
| Quick Actions | `View Students`, `Upload Content`, `Record Attendance`, `Open Gradebook` |

### My Subjects Page

Expanded view of all assigned subjects with tabs per subject. Each tab contains:

**Student Roster Table:**

| Column | Content |
|:---|:---|
| Student ID | — |
| Name | — |
| Participation | Percentage with color indicator (green ≥ threshold, yellow ≥ 80% of threshold, red < 80% of threshold) |
| Attendance Rate | Percentage |
| Current Grade | Computed from available scores so far |
| Exam Eligible | Yes (green check) / No (red X with "Participation: X%, Required: Y%") |

### Gradebook Page

**Subject selector dropdown** at the top (only assigned subjects appear).

**Gradebook Table (spreadsheet-style):**

| Row | Columns |
|:---|:---|
| Student Name (rows) | One column per grading component: Quiz 1, Quiz 2, Assignment 1, Midterm Exam, Final Exam, etc. Then a **Computed Final Grade** column. |

- Each cell is an input field where the Instructor enters the raw score (e.g., 85 out of 100).
- The **Computed Final Grade** column is read-only and auto-calculates based on the Admin's locked formula.
- A header row shows the weight of each component (e.g., "Quizzes — 20%").
- The Instructor can save scores incrementally (does not need to fill everything at once).
- A **Submit Grades** button at the bottom: submits all grades for this subject to the Admin for finalization. The Instructor is shown a confirmation dialog listing any students with missing scores.

### Attendance Page

**Subject selector dropdown** at the top.

**Session-Based View:**

| Component | Function |
|:---|:---|
| Date picker | Select the class session date |
| Session type dropdown | `Lecture`, `Lab`, `Tutorial` |
| Student list | Each student has a radio group: `Present` / `Late` / `Absent` / `Excused` |
| Save Attendance button | Saves the session. Entries become immutable. |

**Correction Flow:** Below the saved session, a `Submit Correction` button per student opens a modal: new status (dropdown), reason (required text). This creates a `CORRECTION` entry linked to the original, preserving both.

**Attendance Summary Tab:**

| Column | Content |
|:---|:---|
| Student Name | — |
| Total Sessions | Count of sessions recorded |
| Present | Count |
| Late | Count |
| Absent | Count |
| Excused | Count |
| Attendance Rate | Percentage (Present + Late + Excused count as attended, with Late weighted at 0.5) |

### Content Manager Page

**Subject selector dropdown** at the top.

**Content List Table:**

| Column | Content |
|:---|:---|
| Type | `File` / `Video` / `Announcement` icon |
| Title | Content title |
| Uploaded Date | — |
| File Size | For files/videos |
| Downloads/Views | Count of student interactions |
| Actions | `Edit Title`, `Replace File`, `Delete` (soft-delete) |

**Upload Button → Modal:**

| Field | Type | Notes |
|:---|:---|:---|
| Content Type | Radio: File / Video / Announcement | — |
| Title | Text | Required |
| Description | Text area | Optional |
| File | File upload | PDF/DOCX/PPTX (max 50 MB) for files; MP4 (max 500 MB) or external URL for video |
| Publish Immediately | Toggle | If off, saved as draft (not visible to students) |

### Quizzes & Exams Page

**Subject selector dropdown** at the top.

**Assessment List Table:**

| Column | Content |
|:---|:---|
| Title | Quiz/Exam name |
| Type | `Quiz` / `Midterm Exam` / `Final Exam` |
| Questions | Count |
| Total Points | Sum of all question points |
| Status | `Draft` / `Published` / `Closed` |
| Deadline | Date and time |
| Submissions | Count of students who completed it |
| Actions | `Edit` (if Draft), `Publish`, `Close`, `View Results` |

**Create Assessment → Builder Page:**

| Component | Function |
|:---|:---|
| Title field | Assessment name |
| Type dropdown | Quiz / Midterm Exam / Final Exam |
| Deadline picker | Date and time |
| Time Limit | Minutes (optional — 0 means unlimited) |
| Question builder | Add questions: Multiple Choice (4 options, mark correct), True/False, Short Answer (manual grading). Each question has a point value. |
| Preview button | Shows the assessment as a student would see it |
| Save as Draft / Publish | Draft is not visible to students; Publish makes it live |

**Note:** The "Final Exam" type respects the participation gate. Students below the threshold cannot open it even if it is published.

### Grade Corrections Page

**Table of submitted correction requests:**

| Column | Content |
|:---|:---|
| Date Submitted | — |
| Student Name | — |
| Subject | — |
| Component | Which grading component (e.g., "Quiz 2") |
| Old Score | — |
| New Score | — |
| Reason | Instructor's explanation |
| Status | `PENDING` / `APPROVED` / `REJECTED` |

**Submit Correction button → Modal:**

| Field | Type |
|:---|:---|
| Subject | Dropdown (assigned subjects only) |
| Student | Dropdown (students in selected subject) |
| Component | Dropdown (grading components) |
| Current Score | Auto-populated (read-only) |
| Corrected Score | Numeric input |
| Reason | Text area (required) |

---

## 6. Student Dashboard

> **URL:** `{institution}.okit.ph/student`
> **Purpose:** View academic status, access course content, take assessments, track progress. Zero ability to modify any data.

### Sidebar Navigation

| Menu Item | Icon | Description |
|:---|:---|:---|
| Dashboard Home | `LayoutDashboard` | Overview of current term |
| My Subjects | `BookOpen` | List of enrolled subjects |
| My Grades | `Award` | View grades per subject |
| My Schedule | `Calendar` | Class schedule (if configured) |
| Payments | `Receipt` | View assessment and payment status |
| Notifications | `Bell` | All notifications |
| My Account | `User` | Profile (read-only except password) |

### Dashboard Home — Content Area

**Top Bar: Status Banner**

A full-width banner at the top of the dashboard showing the student's current status:

| Status | Banner Color | Message |
|:---|:---|:---|
| `APPLICANT` | Gray | "Your application is being processed. Please visit the Operator's office." |
| `ASSESSED` | Yellow | "Your Assessment Slip has been generated. Please proceed to the Cashier for payment." |
| `ENROLLED_ACTIVE` | Green | "You are enrolled and active for [Term Name]." |
| `ENROLLED_RESTRICTED` | Red | "Your access is restricted due to an overdue payment. Please visit the Cashier." |
| `WITHDRAWN` | Gray | "You have withdrawn from the current term." |
| `ON_LEAVE` | Blue | "You are on an approved leave of absence." |

**Summary Cards (4 cards) — visible only when `ENROLLED_ACTIVE` or `ENROLLED_RESTRICTED`:**

| Card | Data |
|:---|:---|
| Subjects This Term | Count of enrolled subjects |
| Overall Participation | Average participation percentage across all subjects |
| Assignments Due | Count of upcoming assignment deadlines in the next 7 days |
| Outstanding Balance | Remaining financial balance (PHP amount or "Fully Paid") |

**Main Section: Subject Overview Cards (one per enrolled subject)**

Each card shows:

| Field | Value |
|:---|:---|
| Subject Code + Name | e.g., "CS101 — Introduction to Programming" |
| Instructor | Instructor's name |
| Participation Meter | Visual progress bar with percentage (color-coded: green/yellow/red) |
| Current Grade | Computed grade so far (or "No scores yet") |
| Subject Status | `ONGOING` / `PASSED` / `FAILED` |
| New Content | Badge showing count of unviewed files/videos |
| Quick Actions | `Open Subject` (goes to subject detail page) |

### My Subjects Page → Subject Detail Page

When the student clicks on a subject, they see a tabbed view:

**Tab 1: Content**

| Column | Content |
|:---|:---|
| Type | `File` / `Video` / `Announcement` icon |
| Title | Content title |
| Posted Date | — |
| Status | `New` (badge) if not yet accessed / `Viewed` / `Downloaded` |
| Actions | `Download` (files), `Watch` (videos — opens embedded player with progress tracking), `Read` (announcements) |

Content is **disabled** (grayed out with a lock icon and message) if the student's status is not `ENROLLED_ACTIVE`.

**Tab 2: Quizzes & Exams**

| Column | Content |
|:---|:---|
| Title | Assessment name |
| Type | `Quiz` / `Midterm Exam` / `Final Exam` |
| Deadline | Date and time |
| Status | `Not Started` / `In Progress` / `Completed` / `Locked` |
| Score | Points earned / total points (visible after completion and grading) |
| Actions | `Take Quiz` button (disabled if `Locked` or status is not `ENROLLED_ACTIVE`) |

For **Final Exams**, if participation is below threshold, the button shows: "Locked — Participation: 62%, Required: 75%".

**Tab 3: Assignments**

| Column | Content |
|:---|:---|
| Title | Assignment name |
| Deadline | Date and time |
| Status | `Not Submitted` / `Submitted` / `Late` / `Graded` |
| Score | Points (visible after grading) |
| Actions | `Upload Submission` button (file upload, disabled after deadline unless Instructor allows late), `View Feedback` (if graded) |

**Tab 4: Attendance**

| Column | Content |
|:---|:---|
| Date | Session date |
| Session Type | Lecture / Lab / Tutorial |
| Status | `Present` / `Late` / `Absent` / `Excused` |

Summary at the top: total sessions, attendance rate percentage.

**Tab 5: Participation Meter (Detail View)**

| Component | Value |
|:---|:---|
| Attendance Score | X% (weight: 60%) — breakdown of present/late/absent |
| Engagement Score | Y% (weight: 40%) — breakdown of files downloaded, videos watched, quizzes attempted |
| **Composite Participation** | **Z%** — visual meter with threshold line marked |
| Threshold | "Required: 75% to unlock Final Exam" |
| Status | "On Track" (green) / "At Risk" (yellow, within 10% of threshold) / "Below Threshold" (red) |

### My Grades Page

**Term selector dropdown** at the top (defaults to current term, can view past terms).

**Grades Table:**

| Column | Content |
|:---|:---|
| Subject Code | — |
| Subject Name | — |
| Instructor | — |
| Component Scores | Expandable row showing each component (Quiz 1: 85, Assignment 1: 90, etc.) with weights |
| Computed Final Grade | System-calculated (read-only) |
| Status | `ONGOING` / `PASSED` / `FAILED` |

**Note:** Grades show as `ONGOING` until the Admin finalizes them. Once finalized, the status changes to `PASSED` or `FAILED` based on the passing grade threshold.

For past terms, all subjects show their final status. The student can see their complete academic history across all terms.

### Payments Page

| Component | Content |
|:---|:---|
| Current Term Assessment | Itemized breakdown (same as Assessment Slip): tuition, fees, total |
| Payment Scheme | Full / Installment (showing the schedule) |
| Payment History table | Date, OR Number, Amount Paid, Installment # |
| Outstanding Balance | Remaining amount due |
| Next Due Date | For installment plans (highlighted red if overdue) |
| Download links | `Download Assessment Slip` (PDF), `Download Official Receipt` (PDF, one per payment) |

The student **cannot** make online payments through this page (payments are processed physically through the Cashier). This page is purely informational.

### Notifications Page

**Chronological list of all notifications:**

| Column | Content |
|:---|:---|
| Date | Timestamp |
| Type | Icon: `Payment`, `Academic`, `Content`, `System` |
| Message | Notification text |
| Read/Unread | Visual indicator |

Clicking a notification marks it as read and navigates to the relevant page (e.g., clicking a "New content uploaded" notification goes to that subject's content tab).

### My Account Page

| Field | Editable? | Notes |
|:---|:---|:---|
| Name | No | Set by Operator during enrollment |
| Student ID | No | System-generated |
| Program | No | Set by Operator |
| Year Level | No | Set by Operator |
| Email | No | Set by Operator (student can request change through Operator) |
| Contact Number | No | Set by Operator |
| ID Photo | No | Set by Operator |
| Password | Yes | Change password form (current password + new password + confirm) |

The student cannot edit their own profile information — all changes go through the Operator. This prevents students from altering their records.
