# OKIT — Learning & Training Management System (LTMS)

## Definitive System Architecture v2.0

---

## I. The Core Idea

OKIT is a **multi-tenant Software-as-a-Service (SaaS)** educational platform. It allows schools, universities, and training centers to rent a branded, fully isolated digital campus.

The system is built on a **"Zero-Trust, Zero-Shortcut"** foundation:

| Pillar | Principle |
|:---|:---|
| **Financial Integrity** | Students cannot access any learning materials until the Cashier clears their financial obligation (full or installment). |
| **Academic Integrity** | Students cannot take final exams or receive certificates unless they meet configurable attendance and participation thresholds. |
| **Operational Integrity** | No single staff member can both assess a fee and collect the cash, or set an exam and bypass the grading formula. |
| **Audit Integrity** | Every financially or academically significant action is written to an immutable, append-only audit log with the actor, timestamp, previous value, and new value. No record is ever truly deleted — only soft-deleted with a reason. |

---

## II. Tenant Isolation Model

Each paying institution receives:

- A **logically isolated database schema** (or dedicated database) so that no cross-tenant data leakage is possible.
- A **unique subdomain** (e.g., `greenvalley.okit.ph`) resolved at the application gateway.
- **Isolated file storage** (S3 prefix or equivalent) for uploaded content, receipts, and certificates.
- **Independent configuration** for branding, grading formulas, thresholds, fee structures, and academic calendars.

Tenant provisioning and teardown are fully automated via webhook-driven workflows.

---

## III. The Complete System Process

### Phase 1: Acquisition & Activation (Platform Level)

| Step | Action | System Behavior |
|:---|:---|:---|
| 1.1 | An institution representative visits the **OKIT Landing Page** and submits an onboarding request (institution name, representative name, email, phone, chosen plan). | Request is stored with status `PENDING_REVIEW`. Super Admin is notified. |
| 1.2 | The **Super Admin** reviews and approves (or rejects with a reason) the request. | On approval, the system generates a **PayMongo** payment link for the selected subscription plan and emails it to the representative. Status moves to `PENDING_PAYMENT`. |
| 1.3 | The representative pays via **GCash, Maya, or Card**. | A PayMongo webhook fires. The system verifies the webhook signature, records the transaction, provisions the tenant (database, storage, subdomain), creates the institution's **Admin account**, and emails login credentials. Status moves to `ACTIVE`. |
| 1.4 | If payment is not received within **7 days**, the system auto-expires the request. | Status moves to `EXPIRED`. The representative can re-apply. |

**Subscription Lifecycle (Automated):**

| Event | System Behavior |
|:---|:---|
| Renewal payment received | Subscription extended; no interruption. |
| Payment overdue (grace: 15 days) | Institution enters `READ_ONLY` mode — all users can view data but cannot create, update, or delete. Students retain access to downloaded materials only. |
| Payment overdue (hard cutoff: 30 days) | Institution enters `SUSPENDED` mode — all access blocked. Data is preserved for 90 days. |
| 90 days after suspension | Data is **permanently purged**. The institution is notified at 60 and 75 days. |
| Institution requests voluntary cancellation | Admin triggers cancellation from dashboard. System provides a full data export (ZIP) before entering the 90-day purge countdown. |

**Subscription Lifecycle (Super Admin Manual Enforcement):**

The Super Admin can override automated timelines when an institution fails to pay, disputes a charge, or violates platform terms of service:

| Action | What It Does | Safeguards |
|:---|:---|:---|
| **Force Read-Only** | Immediately sets the institution to `READ_ONLY` regardless of payment due dates. All users can view but not create/modify data. | Requires a mandatory reason. Logged in the platform audit trail. Institution Admin is emailed immediately. |
| **Force Suspend** | Immediately sets the institution to `SUSPENDED`. All access is blocked for all users. Data is preserved. | Requires a mandatory reason. Logged. Institution Admin is emailed with reason and appeal instructions. The 90-day data retention countdown starts. |
| **Re-Enable** | Restores a `READ_ONLY` or `SUSPENDED` institution back to `ACTIVE`. | Only possible after payment is confirmed in PayMongo records or the Super Admin provides a written override reason (e.g., "Payment confirmed via bank transfer"). Logged. |
| **Extend Grace Period** | Extends the automated grace period for a specific institution (e.g., +15 days). | Requires a reason. Logged. Does not affect other institutions. |
| **Force Purge** | Immediately triggers data purge for a `SUSPENDED` institution (skipping the 90-day wait). | Requires the institution to have been `SUSPENDED` for at least **30 days**. Requires typing the institution name as confirmation (like deleting a GitHub repo). A final data export is emailed to the institution Admin before purge. Logged. |
| **Issue Warning** | Sends a formal warning email to the institution Admin without changing status. | The warning is logged and visible on the institution's record. Multiple warnings can be referenced in a future suspension. |

---

### Phase 2: World-Building (Institutional Level)

| Step | Action | System Behavior |
|:---|:---|:---|
| 2.1 | **Branding:** The Admin uploads a logo (max 2 MB, PNG/SVG) and selects a primary accent color (hex value). | The UI dynamically renders the institution's branding on all pages for all roles under that tenant. |
| 2.2 | **Academic Calendar:** The Admin defines **Academic Years → Semesters/Terms** with start and end dates. | All enrollment, grading, and reporting are scoped to the active term. Historical terms are read-only. |
| 2.3 | **Academic Hierarchy:** The Admin builds: **Departments → Programs → Year Levels → Subjects**. Each subject has a unit count and a designated term. | Subjects are immutable once students are enrolled against them in a given term. To change a subject, the Admin must create a new version effective next term. |
| 2.4 | **Grading Formula:** The Admin configures the grading formula **per Program or per Subject**. Components are flexible (e.g., Quizzes, Assignments, Lab Work, Midterm Exam, Final Exam) with Admin-defined weights that must total exactly 100%. | The formula is **locked for the term** once the first student is enrolled. Instructors and Students can view but never modify it. |
| 2.5 | **Participation Threshold:** The Admin sets the minimum participation percentage required to unlock the final exam, **per Program or per Subject** (default: 75%). | The threshold is locked for the term once the first student is enrolled. |
| 2.6 | **Financial Setup:** The Admin defines: base tuition rate per unit, miscellaneous fees (itemized: lab fee, ID fee, etc.), and available **payment schemes** (Full, Installment-2, Installment-3, etc.) with due dates relative to the term start. | Rates are locked for the term once the first Assessment Slip is generated. Rate changes apply only to future terms. |
| 2.7 | **Staff Accounts:** The Admin creates accounts for **Operators, Cashiers, and Instructors**. Instructors are assigned strictly to specific Subjects within specific Terms. | Each account is assigned exactly one role. To give one person two roles (e.g., a small institution where one person is both Operator and Cashier), the Admin creates two separate accounts with distinct login credentials. All actions are logged under the specific role account used. |

---

### Phase 3: Enrollment & The Financial Gate

| Step | Action | System Behavior |
|:---|:---|:---|
| 3.1 | A student visits the institution's portal or submits a paper form. The **Operator** creates the student record (name, contact, ID photo, guardian info). | Student record is created with status `APPLICANT`. |
| 3.2 | The **Operator** selects the student's Program, Year Level, and Term. | The system auto-populates the correct subject list and computes the total assessment (tuition + miscellaneous). The Operator cannot add subjects outside the curriculum or alter unit prices. |
| 3.3 | The **Operator** selects the student's chosen Payment Scheme (Full, 2-installment, 3-installment, etc.). | The system generates an **Assessment Slip** (printable PDF) with a unique slip code, itemized breakdown, installment schedule (if applicable), and due dates. Student status moves to `ASSESSED`. |
| 3.4 | The student presents the Assessment Slip (physical or digital) to the **Cashier**. | — |
| 3.5 | The **Cashier** enters the Assessment Slip code, verifies the amount tendered, and records the payment. | For **full payment**: the system clears the entire balance, issues a PDF **Official Receipt (OR)** with a unique OR number, and moves the student to `ENROLLED_ACTIVE`. |
| | | For **installment payment**: the system clears the current installment, issues an OR for that installment, and moves the student to `ENROLLED_ACTIVE` (even on first installment — access is granted). The remaining balance and next due date are tracked. |
| 3.6 | **Account Activation:** The moment the student's status moves to `ENROLLED_ACTIVE`, the system automatically generates the student's login credentials. | See **Student Account Creation** below for the full credential flow. The student receives their credentials via the printed Account Slip (handed by Operator/Cashier) and optionally by email/SMS. |
| 3.7 | **Installment tracking:** The system monitors upcoming due dates. | **7 days before due date:** Warning notification (in-app + email/SMS if configured). |
| | | **On due date + 0 days:** Status remains `ENROLLED_ACTIVE` but a flag `PAYMENT_DUE` is set. |
| | | **On due date + 15 days (configurable grace):** Status shifts to `ENROLLED_RESTRICTED` — the student can view previously accessed materials but cannot access new content, take exams, or download certificates. |
| | | **Only the Cashier** can restore `ENROLLED_ACTIVE` by recording the overdue payment. |

**Student Account Creation:**

Students do **not** self-register. Their accounts are created automatically by the system as part of the enrollment process. Here is the complete credential flow:

| Step | What Happens |
|:---|:---|
| **1. Operator registers the student** | The Operator enters the student's personal information during enrollment (Step 3.1). At this stage, no login account exists yet — the student is just a record with status `APPLICANT` → `ASSESSED`. |
| **2. Cashier clears payment** | The student's status moves to `ENROLLED_ACTIVE` (Step 3.5). This triggers automatic account generation. |
| **3. System generates credentials** | The system creates the student's login account with the following: |
| | **Username:** Auto-generated from the student's information using the format `[YYYY]-[NNNNN]` where `YYYY` is the enrollment year and `NNNNN` is a zero-padded sequential number per institution. Example: `2026-00142`. This matches the student's **Student ID** — one identifier for everything. |
| | **Temporary Password:** A system-generated random 8-character password (mix of uppercase, lowercase, and digits — no special characters, to avoid confusion when handwritten). Example: `Kx7mPq2R`. |
| **4. Account Slip is generated** | The system generates a printable **Account Slip** (small PDF, receipt-sized) containing: institution name, student name, Student ID / Username, temporary password, the portal URL (`{institution}.okit.ph`), and the instruction: *"You must change your password on first login."* |
| **5. Credentials are delivered** | The Account Slip is printed by the **Operator or Cashier** and handed to the student along with their Official Receipt. If the student provided an email during registration, the credentials are also sent by email. If SMS is configured, a text message is sent with the username, temporary password, and portal URL. |
| **6. First login — forced password change** | When the student logs in for the first time, the system immediately redirects them to a **Change Password** screen. They must set a new password (minimum 8 characters). They cannot access any part of the dashboard until the password is changed. |
| **7. Account persists across terms** | The same account (same Student ID / username) is used for all future terms. When the Operator processes a re-enrollment, no new account is created — the existing account is simply linked to the new term's subjects. |

**Account Recovery:**

| Scenario | Process |
|:---|:---|
| Student forgets their password | The student visits the login page and clicks **"Forgot Password."** If they have an email on file, a password reset link is sent (valid for 1 hour, single-use). If no email is on file, the student must visit the Operator in person. |
| Operator resets password on behalf of student | The Operator looks up the student in the Student Directory, clicks **"Reset Password."** The system generates a new temporary password and prints a new Account Slip. The student must change this password on next login. The password reset is logged in the audit trail. |
| Student never received credentials | The Operator can reprint the Account Slip from the Student Directory at any time. If the original temporary password was already used (first login completed), the Operator must trigger a password reset instead. |

**Account Security Rules:**

| Rule | Detail |
|:---|:---|
| Username cannot be changed | It is the Student ID — permanent and unique. |
| Temporary passwords expire after 72 hours | If the student does not log in within 72 hours, the Operator must generate a new temporary password. |
| Passwords are never stored in plain text | Hashed with bcrypt. The temporary password is shown only once (on the Account Slip and in the email/SMS). It is not retrievable after generation. |
| Students cannot create their own accounts | There is no public registration form for students. Accounts are only created through the Operator → Cashier → System pipeline. This prevents unauthorized access. |
| One account per student, ever | Even across re-enrollments and multiple terms, the student keeps the same account. Duplicate detection is based on name + date of birth + contact number. |

---

**Enrollment Lifecycle Events:**

| Event | Who Initiates | System Behavior |
|:---|:---|:---|
| **Drop a Subject** | Student requests → Operator processes | Subject is marked `DROPPED` on the student's record with a timestamp. If before the Admin-configured refund deadline, a refund entry is created for the Cashier to process. Dropped subjects do not count toward the grading or participation calculation. |
| **Full Withdrawal** | Student requests → Operator processes → Admin approves | All subjects are marked `WITHDRAWN`. Refund is calculated per the institution's refund policy (configurable: 100% before classes, 75% within week 1, 50% within week 2, 0% after). A refund entry is created for the Cashier. Student status becomes `WITHDRAWN`. |
| **Re-Enrollment (Next Term)** | Operator selects existing student record → assigns new Term/Year Level | The system carries over the student profile. A new assessment is generated. Previous term records remain read-only in the archive. No duplicate student record is created. |
| **Advancement (Year Level Promotion)** | Operator advances student at start of new academic year | System validates all prior-term subjects are either `PASSED` or `CREDITED`. If any are `FAILED`, the system flags them for the Operator to handle (re-enroll in failed subjects or override with Admin approval). |
| **Leave of Absence** | Student requests → Admin approves | Student status becomes `ON_LEAVE`. No financial obligations accrue. Upon return, the Operator re-enrolls them into the appropriate term. |

---

### Phase 4: Academic Delivery & Enforcement Gates

| Step | Action | System Behavior |
|:---|:---|:---|
| 4.1 | **Content Upload:** The Instructor uploads learning materials to their assigned Subjects: files (PDF, DOCX, PPTX — max 50 MB each), videos (MP4 — max 500 MB each, or external link), and announcements. | Content is only visible to `ENROLLED_ACTIVE` students assigned to that Subject. `ENROLLED_RESTRICTED` students see previously accessed content only. |
| 4.2 | **Physical Attendance:** The Instructor records per-session attendance (Present, Late, Absent, Excused) through the platform. | Each entry is timestamped and immutable once saved. Corrections require a new entry of type `CORRECTION` with a reason, preserving the original. |
| 4.3 | **Digital Engagement Tracking:** The system automatically records: file download timestamps, video watch duration (percentage of total length completed), and quiz attempts. | This data is read-only for all users. It is computed by the system and cannot be manually inflated. |
| 4.4 | **Participation Meter:** The system computes a composite participation score per student per subject using the formula: | `Participation = (Attendance Weight × Attendance%) + (Engagement Weight × Engagement%)` |
| | The Admin configures the Attendance vs. Engagement weight split (default: 60% Attendance / 40% Engagement). | The meter is visible to the Student (their own), the Instructor (all students in their subject), and the Admin (all students). |
| 4.5 | **The Engagement Gate (Exam Lockout):** When a student's Participation Meter is below the configured threshold, the "Take Final Exam" button is **disabled** with a clear message showing current score vs. required score. | The Instructor **cannot** override this gate. Only the **Admin** can grant a one-time override with a mandatory written reason, which is logged in the audit trail. |
| 4.6 | **Quizzes & Assessments:** The Instructor creates quizzes (multiple choice, true/false, short answer) with correct answers and point values. | Auto-graded question types are scored instantly. Short-answer types require Instructor manual grading. All scores feed into the gradebook. |
| 4.7 | **Assignment Submission:** Students upload assignment files before the deadline. The Instructor reviews and scores them. | Late submissions are flagged. The Instructor can accept with a penalty (configurable) or reject. |

---

### Phase 5: Grading & The Academic Gate

| Step | Action | System Behavior |
|:---|:---|:---|
| 5.1 | The **Instructor** inputs raw scores for each grading component (quizzes, assignments, exams) into the Gradebook throughout the term. | Each score entry is logged with a timestamp. |
| 5.2 | The system **auto-computes** the final grade using the locked formula configured by the Admin. | The Instructor sees the computed grade but **cannot** edit the final number directly — only the raw component scores. Changing a raw score automatically recomputes the final grade. |
| 5.3 | **Grade Correction Flow:** If the Instructor entered a wrong raw score, they submit a **Grade Correction Request** specifying the student, component, old score, new score, and reason. | The request goes to the **Admin** for approval. Upon approval, the old score is preserved in the audit log, the new score is applied, and the final grade is recomputed. The correction is visible on the student's record with a `CORRECTED` flag. |
| 5.4 | **Grade Finalization:** At the end of the grading period, the Instructor clicks "Submit Grades" for the subject. | Grades move to `SUBMITTED` status. The Admin reviews and clicks "Finalize." Once finalized, grades are **permanently locked** — no further corrections are possible without a formal academic appeal (handled outside the system, documented by the Admin as an override with reason). |
| 5.5 | The system determines pass/fail status based on the Admin-configured passing grade (default: 75%). | Students who pass all subjects in the term are flagged as eligible for advancement. |

---

### Phase 6: Certification & Graduation

| Step | Action | System Behavior |
|:---|:---|:---|
| 6.1 | The system checks all graduation requirements: all required subjects across all terms are `PASSED`, all financial obligations are `CLEARED` (zero balance), and the student's participation met the threshold in all subjects. | If any requirement is unmet, the student is **not** eligible. The system shows exactly which requirements are outstanding. |
| 6.2 | For eligible students, the system auto-generates a **branded PDF Certificate** containing: institution logo and name, student name and ID photo, program completed, date of completion, a unique **Certificate ID**, and a **QR code** linking to a public verification URL. | The certificate is available for download by the Student and can be re-downloaded at any time. |
| 6.3 | **Public Verification:** Any third party (employer, another school) can scan the QR code or visit `verify.okit.ph/{certificate-id}`. | The public page shows: student name, institution, program, completion date, and certificate validity status (`VALID`, `REVOKED`). No grades or financial data are exposed. |
| 6.4 | **Certificate Revocation:** If fraud is discovered after issuance, the **Admin** can revoke a certificate with a mandatory reason. | The verification page updates to show `REVOKED`. The revocation is logged in the audit trail. The student is notified. |

---

### Phase 7: Notifications & Communication

| Event | Channel | Recipients |
|:---|:---|:---|
| Enrollment confirmed | In-App, Email, SMS | Student |
| Payment received (OR issued) | In-App, Email | Student |
| Installment due in 7 days | In-App, Email, SMS | Student |
| Installment overdue — access restricted | In-App, Email, SMS | Student, Operator |
| New content uploaded | In-App | All active students in the subject |
| Participation below threshold warning (at 80% of threshold) | In-App, Email | Student, Instructor |
| Exam lockout triggered | In-App | Student |
| Grade correction submitted | In-App | Admin |
| Grade correction approved/rejected | In-App | Instructor, Student |
| Grades finalized | In-App, Email | Student |
| Certificate available | In-App, Email | Student |
| Subscription renewal due (30/15/7 days) | Email | Institution Admin |
| Subscription suspended | Email | Institution Admin |

Notification preferences (email/SMS opt-in) are configurable by the Admin at the institution level. In-app notifications are always on.

---

## IV. Complete Role Permission Matrix

### Super Admin (Platform Level)

| Can Do | Cannot Do |
|:---|:---|
| View and approve/reject institutional onboarding requests | Access any institution's internal data (students, grades, finances) |
| Monitor platform-wide SaaS revenue and subscription statuses | Create, modify, or delete student or staff accounts within institutions |
| Manage subscription plans and pricing tiers | Override any institution-level configuration (grading formulas, tuition rates, curriculum) |
| View aggregated platform analytics (total institutions, total students, revenue) | View individual student records, grades, or financial transactions |
| **Force Read-Only** an institution (with mandatory reason, logged) | Bypass the institution Admin's approval for support access |
| **Force Suspend** an institution (with mandatory reason, logged, Admin notified) | Enroll students, input grades, or process payments on behalf of an institution |
| **Re-Enable** a suspended/read-only institution (after payment confirmation or with override reason) | Access or export an institution's internal database directly |
| **Extend Grace Period** for a specific institution's subscription (with reason) | Force Purge an institution that has been suspended for fewer than 30 days |
| **Force Purge** a long-suspended institution (30+ days suspended, requires name-confirmation) | Modify or delete platform-level audit log entries |
| **Issue Formal Warnings** to institutions (logged, referenced in future enforcement) | — |
| Grant time-limited **Support Access** to an institution (requires institution Admin's approval via a confirmation code) | — |

### Institution Admin

| Can Do | Cannot Do |
|:---|:---|
| Configure branding (logo, accent color) | Collect or process cash payments |
| Build and manage the academic hierarchy (Departments → Programs → Year Levels → Subjects) | Enroll students or generate Assessment Slips |
| Configure grading formulas per Program/Subject | Input raw scores or grades |
| Configure participation thresholds and attendance/engagement weight splits | Alter the computed final grade directly |
| Set tuition rates, miscellaneous fees, and payment schemes | Issue Official Receipts |
| Create and manage staff accounts (Operator, Cashier, Instructor) | View payment transaction details beyond summary reports |
| Approve grade corrections and academic overrides | Delete audit log entries |
| Approve student withdrawals and leaves of absence | Access another institution's data |
| Finalize submitted grades | Override a system-computed participation score |
| Revoke certificates (with mandatory reason) | — |
| Override the exam lockout gate (with mandatory reason, logged) | — |
| Generate institutional reports (enrollment, financial summary, academic performance) | — |
| Request data export for voluntary cancellation | — |

### Operator

| Can Do | Cannot Do |
|:---|:---|
| Create new student records (personal info, ID photo) | Collect cash or record payments |
| Assign students to a Program, Year Level, and Term | Modify tuition rates or fee structures |
| Select payment schemes and generate Assessment Slips | Add subjects outside the defined curriculum |
| Process subject drops (before refund deadline) | Approve withdrawals (requires Admin) |
| Process re-enrollment for returning students | View or modify academic grades |
| Advance students to the next Year Level (system validates prerequisites) | Override system enrollment validations |
| View student enrollment status and contact info | View financial transaction details (OR amounts, payment history) |
| Flag students for administrative review | Delete student records (soft-delete only, requires Admin approval) |

### Cashier

| Can Do | Cannot Do |
|:---|:---|
| Look up Assessment Slips by slip code | Enroll students or modify student personal info |
| Record payments (full or installment) against an Assessment Slip | Modify tuition rates, fees, or payment schemes |
| Issue PDF Official Receipts with unique OR numbers | View academic records (grades, participation, attendance) |
| Process refunds (only against system-generated refund entries from approved drops/withdrawals) | Create arbitrary refund entries |
| View payment history and outstanding balances for students | Alter a student's enrollment status directly (status changes are triggered automatically by payment events) |
| Generate daily/weekly/monthly collection reports | Delete or modify issued Official Receipts |
| Reconcile cash on hand vs. system records at end of day | — |

### Instructor

| Can Do | Cannot Do |
|:---|:---|
| Upload and manage course content (files, videos, announcements) for assigned subjects only | View financial records or payment statuses |
| Record physical attendance per session (Present, Late, Absent, Excused) | Modify a student's enrollment status |
| Create and manage quizzes and assessments | Change the grading formula or its weights |
| Grade assignments and short-answer questions | Edit the computed final grade directly |
| Input raw scores for all grading components | Override the participation gate / exam lockout |
| Submit a Grade Correction Request (goes to Admin for approval) | Modify attendance records after save (must submit a correction entry) |
| View participation meters for students in their subjects | Access subjects they are not assigned to |
| Submit final grades for Admin review | Finalize grades (only Admin can finalize) |
| Post announcements to enrolled students | View students' grades in other instructors' subjects |

### Student

| Can Do | Cannot Do |
|:---|:---|
| View their own Assessment Slip and payment status | Access any content, quiz, or exam before the Cashier clears payment |
| Access course materials (files, videos) when status is `ENROLLED_ACTIVE` | View other students' grades, participation, or financial data |
| View their own Participation Meter per subject | Inflate participation metrics (system-computed, read-only) |
| Take quizzes and exams (when participation threshold is met and status is active) | Take the final exam if participation is below the threshold |
| Submit assignments before deadlines | Submit assignments after the deadline without Instructor acceptance |
| View their own gradebook (component scores and computed final grade) | Modify any score or grade |
| Download their certificate (when all graduation requirements are met) | Download a certificate if any financial balance is outstanding |
| Request subject drops or full withdrawal through the Operator | Self-enroll, self-drop, or self-withdraw without Operator/Admin processing |
| View announcements and notifications | Access subjects they are not enrolled in |

---

## V. The Audit Log

Every significant action generates an immutable audit entry:

| Field | Description |
|:---|:---|
| `id` | Unique audit entry ID (UUID) |
| `timestamp` | ISO 8601 timestamp (server time, UTC) |
| `tenant_id` | Institution identifier |
| `actor_id` | User who performed the action |
| `actor_role` | Role under which the action was performed |
| `action` | Machine-readable action code (e.g., `PAYMENT_RECORDED`, `GRADE_CORRECTED`, `EXAM_LOCKOUT_OVERRIDDEN`) |
| `target_type` | Entity type affected (e.g., `Student`, `Subject`, `Payment`) |
| `target_id` | ID of the affected entity |
| `previous_value` | JSON snapshot of the state before the change (null for creates) |
| `new_value` | JSON snapshot of the state after the change |
| `reason` | Mandatory for overrides, corrections, revocations; optional otherwise |
| `ip_address` | IP address of the actor |

**Audit rules:**
- Entries are **append-only**. No user, including the Admin, can modify or delete them.
- The Super Admin cannot view audit logs (they belong to the institution's isolated data).
- The Admin can view and export audit logs but cannot alter them.
- Audit logs are retained for the lifetime of the institution's data (including the 90-day post-cancellation window).

---

## VI. Security & Access Control Summary

| Control | Implementation |
|:---|:---|
| **Authentication** | Email + password with bcrypt hashing. **Mandatory** TOTP-based two-factor authentication (2FA) for Super Admin. Optional 2FA for Admin and Cashier roles. |
| **Session Management** | JWT access tokens (15-minute expiry) + HTTP-only secure refresh tokens (7-day expiry). Sessions are invalidated on password change. |
| **Role Enforcement** | Middleware-level RBAC (Role-Based Access Control). Every API endpoint checks the actor's role before executing. No client-side-only enforcement. |
| **Tenant Isolation** | Every database query is scoped by `tenant_id`. Cross-tenant queries are architecturally impossible at the ORM level. |
| **Rate Limiting** | Login attempts: 5 per minute per account. API calls: 100 per minute per user. File uploads: 10 per minute per user. |
| **Data Encryption** | TLS 1.3 in transit. AES-256 at rest for file storage. Database-level encryption for PII fields (student name, contact, guardian info). |
| **Password Policy** | Minimum 8 characters, at least one uppercase, one lowercase, one digit, one special character. Passwords expire every 90 days for staff roles. |
| **Support Access Protocol** | Super Admin requests access → System generates a 6-digit code → Institution Admin confirms the code in their dashboard → Super Admin gets read-only access for a maximum of 24 hours → Access is auto-revoked and logged. |
| **Single Active Session** | Each account is limited to one active session. A new login from a different device invalidates the previous session. Simultaneous logins from different IPs trigger a security alert to the Admin. |
| **File Upload Security** | All uploaded files are scanned server-side (ClamAV or equivalent) before storage. Only whitelisted file types (PDF, DOCX, PPTX, MP4, JPG, PNG) are accepted. Executables and scripts are rejected. |
| **Mass Action Alerts** | Mass deactivation of staff accounts (3+ within 1 hour) triggers an automatic security alert to the Super Admin and emails all affected staff. |
| **Grade Auto-Finalization** | If the Admin does not finalize submitted grades within the configured deadline (default: 14 days after Instructor submission), the system auto-finalizes them. This prevents students from being held in limbo. |
| **Webhook Reconciliation** | A scheduled job runs every 6 hours to reconcile `PENDING_PAYMENT` institutions against PayMongo's API. If a payment is found but the webhook was missed, the system auto-provisions the tenant. |

---

## VII. Loophole Closure Checklist

| Potential Loophole | How It Is Closed |
|:---|:---|
| Operator enrolls a student and also collects payment, pocketing the cash | Operator **cannot** record payments. Only the Cashier can. The student remains `ASSESSED` (no access) until the Cashier clears the slip. |
| Cashier fabricates a payment without a real Assessment Slip | Cashier can **only** record payments against system-generated Assessment Slip codes. No slip code = no payment entry possible. |
| Cashier records payment, issues OR, then deletes the OR to steal the cash | Official Receipts are **immutable and append-only**. Void requires a `VOID` entry (not deletion) with a mandatory reason, visible in the audit log. The daily reconciliation report compares total ORs to cash on hand. |
| Instructor inflates grades for a favored student | Instructor inputs **raw scores only**. The final grade is computed by the system using the Admin-locked formula. The Instructor cannot edit the final grade. |
| Instructor enters a fake correction to change a grade after finalization | Grade corrections require **Admin approval**. After finalization, corrections are impossible — only a formal academic appeal (documented by Admin as an override with reason) can alter a finalized grade. Both the old and new values are permanently logged. |
| Admin changes the grading formula mid-term to benefit specific students | The formula is **locked for the term** once the first student is enrolled. It cannot be changed until the next term. |
| Admin changes tuition mid-term after some students have already paid the old rate | Tuition rates are **locked for the term** once the first Assessment Slip is generated. Changes apply to future terms only. |
| Student accesses content or exams without paying | Content is gated behind the `ENROLLED_ACTIVE` status, which is **only** set by a successful Cashier payment recording. There is no manual status toggle. |
| Student bypasses the participation requirement for exams | The exam button is **disabled at the server level** (API rejects the request), not just hidden in the UI. The Instructor cannot override it. Only the Admin can, with a mandatory reason logged. |
| A single person acts as both Operator and Cashier without accountability | Dual roles require **two separate accounts** with distinct credentials. Every action is logged under the specific account. If the same person logs in as Operator and records an enrollment, then switches to their Cashier account to record payment, both actions are separately logged with different actor IDs. |
| Super Admin snoops on institutional data | Super Admin queries are **architecturally scoped** to platform-level tables only (subscriptions, onboarding requests, revenue). Institutional tables are in isolated schemas/databases that the Super Admin's role has no ORM access to. Support access requires the institution Admin's active confirmation. |
| Staff member accesses the system after being terminated | Admin deactivates the account. All active sessions (JWTs) are immediately invalidated via a token blacklist. The deactivated account cannot log in. |
| Deleted records hide evidence of fraud | Records are **never hard-deleted**. All deletions are soft-deletes with a `deleted_at` timestamp, `deleted_by` actor, and `deletion_reason`. Soft-deleted records remain in the audit trail and can be restored by the Admin. |
| Student downloads certificate despite outstanding balance | Certificate generation checks the student's financial balance in **real-time**. If `balance > 0`, the certificate endpoint returns an error listing the outstanding amount. |
| Forged certificates circulated externally | Every certificate has a unique **Certificate ID** and a **QR code** linking to `verify.okit.ph/{certificate-id}`. Third parties can verify authenticity instantly. Revoked certificates show as `REVOKED` on the public verification page. |
| Instructor accesses another instructor's subject data | API endpoints for content upload, attendance, and grading are scoped to the instructor's **assigned subjects only**. Attempting to access an unassigned subject returns `403 Forbidden`. |
| Student inflates their own participation metrics | Participation data (attendance, downloads, watch time) is **system-recorded and read-only**. There is no user-facing input that feeds into the participation meter. Attendance is recorded by the Instructor; digital engagement is tracked by the server. |
| Payment webhook is forged to activate a fake subscription | PayMongo webhooks are verified using **HMAC signature validation**. Only webhooks signed with OKIT's secret key are processed. Replayed webhooks are rejected via idempotency keys. |
| Expired institution continues to operate | The system enforces subscription status checks on **every authenticated request**. An expired/suspended tenant's users are blocked at the middleware level before any controller logic executes. |
| Institution doesn't pay but automated grace period hasn't triggered yet | The Super Admin can **manually Force Suspend** or **Force Read-Only** any institution at any time with a mandatory reason. The institution Admin is notified immediately. This overrides automated timelines. |
| Super Admin abuses manual suspension power to extort institutions | Every Super Admin enforcement action (suspend, re-enable, purge, warning) is written to a **platform-level audit log** that the Super Admin themselves cannot modify or delete. A secondary system owner or auditor can review these logs. All enforcement actions require a written reason. |
| Institution Admin creates a fake Instructor account and assigns themselves, then inputs inflated grades | Instructor accounts require a **unique email address** that cannot match the Admin's email. The Admin cannot input raw scores — only Instructors can. Even if the Admin creates a puppet Instructor, the grade formula is system-computed and the Admin still cannot alter the final grade. All account creation is logged with the Admin as actor. |
| Admin creates a ghost Cashier account and processes fake refunds | Refund entries can **only** be created by the system from Admin-approved drops/withdrawals that have a matching student record and enrollment history. The Cashier processes refunds against these entries. A ghost Cashier with no real refund entries has nothing to process. Daily reconciliation exposes any cash discrepancy. |
| Operator and Cashier collude — Operator generates a fake Assessment Slip, Cashier "pays" it, they split the cash | Assessment Slips are tied to **real student records** with validated Program/Year Level/Subject assignments. The Operator cannot generate a slip without creating a student first. Ghost students are visible in enrollment reports and headcount audits. The Admin's enrollment report cross-references student count vs. slips generated vs. payments received. |
| Admin never finalizes grades so students remain in limbo indefinitely | The system enforces a **grade finalization deadline** (configurable, default: 14 days after the Instructor submits grades). If the Admin does not finalize within the deadline, the system auto-finalizes the submitted grades and notifies the Admin. The Admin can still process corrections after auto-finalization through the formal override flow. |
| PayMongo payment succeeds but webhook fails — institution is stuck in PENDING_PAYMENT | A **scheduled reconciliation job** runs every 6 hours, querying PayMongo's API for payments matching `PENDING_PAYMENT` institutions. If a payment is found, the system provisions the tenant automatically. The Super Admin can also manually trigger provisioning from the Institutions page after verifying payment in the PayMongo dashboard. |
| Student shares login credentials with another person to inflate watch-time/engagement | Sessions are limited to **one active session per account**. A new login invalidates the previous session. Simultaneous logins from different IPs trigger a security alert visible to the Admin. This doesn't prevent credential sharing entirely but makes it impractical for parallel use. |
| Instructor uploads malicious files (malware) disguised as course content | All uploaded files pass through **server-side antivirus scanning** (ClamAV or equivalent) before being stored. Files that fail the scan are quarantined and the upload is rejected. File types are restricted to a whitelist (PDF, DOCX, PPTX, MP4, JPG, PNG). Executable files (.exe, .bat, .sh, .js, etc.) are rejected. |
| Super Admin account is compromised | Super Admin accounts require **mandatory 2FA** (TOTP). Password changes trigger an email notification to a secondary recovery email. Failed login attempts (5+) lock the account for 30 minutes. The Super Admin IP address is optionally whitelisted. |
| Institution Admin account is compromised and attacker deactivates all staff | Staff deactivation is logged and triggers an **email notification to all affected staff members** at their registered email. Mass deactivation (3+ accounts within 1 hour) triggers an additional security alert to the Super Admin. The Admin cannot delete their own account. |
| A student claims they paid but the Cashier says they didn't | The Assessment Slip has a **unique code** that maps to a single payment record. Either the payment exists in the system (with a matching OR) or it doesn't. The daily reconciliation report, the audit log, and the Cashier's collection report all provide independent cross-references. Disputes are resolved by checking these three sources. |

---

## VIII. Data Retention & Privacy

| Aspect | Policy |
|:---|:---|
| **Active institution data** | Retained indefinitely while subscription is active. |
| **Post-cancellation data** | Retained for 90 days after cancellation. Full export available to Admin before purge. |
| **Student personal data** | Subject to the institution's local data privacy regulations (e.g., Philippine Data Privacy Act of 2012). Students can request a data export of their own records through the Admin. |
| **Audit logs** | Retained for the same duration as the institution's data. Included in the data export. |
| **Certificate verification data** | Certificate ID, student name, institution, program, and completion date remain on the public verification endpoint for **5 years** after the institution's data is purged (to allow ongoing employer verification). |
| **Backups** | Automated daily backups with 30-day rolling retention. Point-in-time recovery available for the last 7 days. |
