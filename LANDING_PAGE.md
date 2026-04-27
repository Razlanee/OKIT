# OKIT — Landing Page Design Specification

## Design Direction

**Tone:** Formal, institutional, trustworthy — not startup playful. Think university website meets enterprise SaaS. The page should communicate that OKIT is a serious platform used by serious educational institutions.

**Visual Language:**

| Attribute | Direction |
|:---|:---|
| Typography | Serif headings (e.g., Playfair Display or Lora) for institutional gravitas. Clean sans-serif body text (e.g., Inter or Source Sans Pro) for readability. |
| Color Palette | Derived directly from the OKIT logo — see Color System below. |
| Photography | Formal education imagery — not stock photos of people laughing at laptops. Think: graduation halls, hands writing on paper, orderly classrooms, institutional buildings. Desaturated or duotone filter for visual consistency. |
| Spacing | Generous whitespace. Let the content breathe. Nothing should feel cramped or rushed. |
| Shape Language | Subtle rounded corners (4–8px). No fully circular cards or playful blob shapes. Clean geometric lines. Thin dividers between sections. |
| Icons | Line-style icons (not filled). Thin stroke weight. Consistent 24px size. From a formal set like Lucide or Phosphor. |
| Animations | Minimal and dignified. Gentle fade-in on scroll. No bouncing, spinning, or confetti. Elements appear with a slight upward slide (translateY 20px → 0) at 0.4s ease. |

### Color System (From OKIT Logo)

The entire platform color palette is derived from the three colors in the OKIT logo:

| Role | Color | Hex | Usage |
|:---|:---|:---|:---|
| **Primary — Dark Navy** | The "Okit" wordmark color | `#1B3A4B` | Headings, navigation text, body text emphasis, dark section backgrounds, sidebar backgrounds in dashboards |
| **Secondary — Teal** | The circular swoosh in the logo | `#1A9E8F` | Primary CTA buttons, active states, links, success indicators, progress bars, section accent borders, tab underlines |
| **Accent — Orange** | The graduation cap | `#F5872C` | Secondary CTA buttons, notification badges, warning states, hover accents, highlight markers, pricing recommended badge |
| **Teal Dark** | Darker shade of the swoosh | `#157A6E` | CTA button hover state, active link state, dark accents |
| **Teal Light** | Light tint of the swoosh | `#E6F5F3` | Light section backgrounds (alternative to off-white), card hover backgrounds, tag backgrounds |
| **Orange Light** | Light tint of the cap | `#FEF0E5` | Warning backgrounds, notification backgrounds, soft highlight areas |
| **Orange Dark** | Darker shade of the cap | `#D4701F` | Orange button hover state |
| **Neutral — Off-white** | Page background | `#F8F6F2` | Main page background, alternating section backgrounds |
| **Neutral — Charcoal** | Body text | `#2D2D2D` | Paragraph text, descriptions, table content |
| **Neutral — Light Gray** | Borders and dividers | `#E5E1DB` | Card borders, section dividers, input field borders |
| **Neutral — Dark** | Footer background | `#1A1A1A` | Footer, dark UI elements |

**Color Pairing Rules:**
- **Teal on white/off-white** for primary buttons and links
- **Orange on white/off-white** for attention-grabbing secondary elements
- **Navy on white** for all headings and emphasized text
- **White on navy** for dark section text
- **White on teal** for primary CTA button text
- **Navy on orange** for secondary CTA button text (or white on orange for smaller elements)
- **Never** place teal text on orange background or vice versa — use navy or white as the text color on colored backgrounds

---

## Page Structure (Top to Bottom)

### Section 0: Announcement Bar (Optional)

A thin bar above the navigation, 36px tall:
- Background: Dark navy (`#1B3A4B`)
- Text: White, small font (13px): *"Now accepting institutional applications for Academic Year 2026–2027."*
- Dismissible with a small × button on the right

---

### Section 1: Navigation Bar

**Height:** 72px. **Background:** White with a subtle bottom border (`#E5E1DB`). Sticky on scroll.

**Layout (left to right):**

| Position | Element |
|:---|:---|
| Left | OKIT logo (the actual logo mark — teal/orange icon + "Okit" navy wordmark) + tagline beneath in 11px caps, charcoal: `LEARNING & TRAINING MANAGEMENT SYSTEM` |
| Center | Nav links (regular weight, 15px, charcoal): `Platform` · `Features` · `How It Works` · `Pricing` · `Contact`. Hover: text color transitions to teal (`#1A9E8F`). |
| Right | Two buttons: `Sign In` (text link, navy `#1B3A4B`) and `Request Access` (solid button, teal `#1A9E8F` background, white text, subtle shadow. Hover: `#157A6E`.) |

**Mobile:** Hamburger menu icon on the right. Logo on the left. `Request Access` button always visible.

**On scroll:** Navigation background gains a subtle shadow (`box-shadow: 0 2px 12px rgba(0,0,0,0.06)`).

---

### Section 2: Hero Section

**Height:** Full viewport minus nav bar (calc(100vh - 72px)). **Background:** Off-white (`#F8F6F2`) with a faint geometric pattern overlay (subtle intersecting lines at 10% opacity — evokes architectural precision).

**Layout: Two columns (60% text / 40% visual)**

**Left Column (text):**

- **Pre-headline** (12px, uppercase, orange `#F5872C`, letter-spacing 3px):
  `FOR SCHOOLS & TRAINING CENTERS`
- **Headline** (48px serif, navy `#1B3A4B`, line-height 1.2):
  `The Academic Infrastructure Your Institution Deserves`
- **Subheadline** (18px sans-serif, charcoal `#2D2D2D`, line-height 1.6, max-width 520px):
  `OKIT provides a secure, fully managed digital campus — from enrollment and financial clearance to course delivery, grading, and certification. Built with zero-trust integrity at every layer.`
- **CTA Row (two buttons, side by side, 16px gap):**
  - Primary: `Request Institutional Access` — teal `#1A9E8F` background, white text, 48px height, 24px horizontal padding, subtle shadow. Hover: `#157A6E`.
  - Secondary: `View Platform Overview` — transparent background, navy `#1B3A4B` border, navy text, same size. Hover: navy background, white text.
- **Trust line** (14px, muted gray, 24px below buttons):
  `Trusted by training centers and academic institutions across the Philippines.`

**Right Column (visual):**

A polished mockup of the OKIT dashboard on a laptop screen, angled slightly (3D perspective, 8° rotation). The mockup shows the Admin dashboard with blurred data — enough to convey a real product without exposing specific UI. The laptop sits on a subtle shadow. Below the laptop, a faint reflection on the surface (2% opacity gradient).

---

### Section 3: Trust Bar / Social Proof

**Height:** 100px. **Background:** White. **Border:** Top and bottom thin lines (`#E5E1DB`).

**Content:** A horizontally centered row of institution logos (grayscale, 40% opacity, 60px height). If no real logos yet, use placeholder text:

`Trusted by institutions committed to academic and financial integrity`

Set in 14px, uppercase, letter-spacing 2px, muted charcoal. Centered with a thin teal underline (`#1A9E8F`, 40px wide).

---

### Section 4: Platform Overview

**Background:** White. **Padding:** 100px vertical.

**Section Header (centered):**
- **Label** (12px, uppercase, orange `#F5872C`, letter-spacing 3px): `THE PLATFORM`
- **Title** (36px, serif, navy `#1B3A4B`): `One System. Complete Academic Control.`
- **Subtitle** (16px, sans-serif, charcoal, max-width 600px, centered): `OKIT replaces fragmented spreadsheets, paper receipts, and informal grading with a unified, auditable digital campus.`

**Content: Three-column card layout (equal width, 24px gap)**

| Card | Icon | Title | Description |
|:---|:---|:---|:---|
| 1 | `ShieldCheck` | Enrollment & Financial Gate | Students are assessed, cleared by the Cashier, and activated automatically. No manual status toggling. No access without payment. |
| 2 | `BookOpen` | Academic Delivery | Instructors upload content, record attendance, and build assessments. Student engagement is tracked automatically and feeds into a participation meter. |
| 3 | `Award` | Grading & Completion | Raw scores are entered by Instructors. Final grades are computed by the system using the institution's locked formula. No manual overrides. |

**Card styling:** White background, 1px border (`#E5E1DB`), 32px padding. Icon at top (32px, teal `#1A9E8F`). Title in 20px serif navy. Description in 15px sans-serif charcoal. Subtle hover: border-top gains a 3px teal (`#1A9E8F`) accent, card lifts 2px (translateY).

---

### Section 5: Zero-Trust Architecture Highlight

**Background:** Dark navy (`#1B3A4B`). **Padding:** 100px vertical. **Text:** White and orange.

**Section Header (centered):**
- **Label** (12px, uppercase, orange `#F5872C`, letter-spacing 3px): `WHY OKIT`
- **Title** (36px, serif, white): `Zero-Trust by Design. Not by Policy.`
- **Subtitle** (16px, sans-serif, white at 80% opacity, max-width 600px, centered): `Every safeguard is enforced by the system — not by staff discipline. OKIT makes fraud structurally impossible, not just discouraged.`

**Content: Four-row horizontal layout (icon left, text right)**

Each row is a full-width block with a thin teal left border (`#1A9E8F`, 3px), 24px left padding:

| Icon | Title (18px, serif, white) | Description (15px, sans-serif, white at 80%) |
|:---|:---|:---|
| `Lock` | Financial Integrity | Students cannot access a single file or quiz until the Cashier clears their payment. The Operator cannot collect cash. The Cashier cannot enroll students. |
| `Scale` | Operational Integrity | No single staff member can both assess a fee and collect the payment. Duty separation is enforced at the system level, not by trust. |
| `ClipboardCheck` | Academic Integrity | Instructors input raw scores. The system computes final grades. The grading formula is locked by the Admin and cannot be changed mid-term. |
| `ScrollText` | Audit Integrity | Every action — payments, grades, corrections, overrides — is logged to an immutable audit trail with the actor, timestamp, and reason. |

---

### Section 6: How It Works (Step-by-Step)

**Background:** Off-white (`#F8F6F2`). **Padding:** 100px vertical.

**Section Header (centered):**
- **Label** (12px, uppercase, orange `#F5872C`, letter-spacing 3px): `HOW IT WORKS`
- **Title** (36px, serif, navy `#1B3A4B`): `From Application to Active Campus in Three Steps`

**Content: Vertical timeline layout (centered line, alternating left/right)**

A thin vertical teal line (`#1A9E8F`) runs down the center. Steps alternate left and right of the line. Each step has a teal circle (`#1A9E8F`, 24px diameter) on the line with the step number inside (white text).

| Step | Side | Title | Description |
|:---|:---|:---|:---|
| 1 | Left | Apply for Access | Submit your institution's details through the request form. Our team reviews and approves your application. |
| 2 | Right | Complete Payment | Receive a secure payment link via PayMongo. Pay via GCash, Maya, or card. Your campus is provisioned instantly upon confirmation. |
| 3 | Left | Configure & Launch | Log in as Admin. Upload your branding, build your curriculum, set tuition rates, create staff accounts, and begin enrolling students. |

**Below the timeline, centered:**
A single CTA button: `Begin Your Application` — teal `#1A9E8F` background, white text, 48px height. Hover: `#157A6E`.

---

### Section 7: Role-Based Access Preview

**Background:** White. **Padding:** 100px vertical.

**Section Header (centered):**
- **Label** (12px, uppercase, orange `#F5872C`, letter-spacing 3px): `BUILT FOR EVERY ROLE`
- **Title** (36px, serif, navy `#1B3A4B`): `Every User Sees Only What They Need`

**Content: Interactive tab component**

A horizontal row of 5 tabs (pill-style, navy text, teal `#1A9E8F` underline on active):

`Admin` · `Operator` · `Cashier` · `Instructor` · `Student`

Below the tabs, a two-column layout:

| Left (40%) | Right (60%) |
|:---|:---|
| Text block: role name (24px serif, navy), role description (15px, charcoal), bullet list of 4–5 key capabilities | Dashboard mockup screenshot (browser-frame styled, subtle shadow) |

**Tab Content:**

**Admin tab:**
> Configure your institution's curriculum, grading formulas, fee structures, and staff assignments. Review submitted grades, approve corrections, and access comprehensive reports — all from a single dashboard.
> - Build Departments → Programs → Year Levels → Subjects
> - Set grading weights that lock for the term
> - Manage Operator, Cashier, and Instructor accounts
> - Approve grade corrections and student withdrawals
> - View the immutable audit log

**Operator tab:**
> Register students, assign them to programs, and generate assessment slips — without touching financial records or academic grades.
> - Create student records with ID photo upload
> - Auto-populate subjects based on curriculum selection
> - Generate printable Assessment Slips with unique codes
> - Process re-enrollments and year-level advancement
> - Handle subject drops with automated refund calculation

**Cashier tab:**
> Accept payments, issue official receipts, and reconcile cash — without access to academic records or enrollment controls.
> - Look up Assessment Slips by unique code
> - Record full or installment payments
> - Issue PDF Official Receipts with unique OR numbers
> - Process system-generated refund entries
> - Submit daily cash reconciliation reports

**Instructor tab:**
> Deliver courses, track attendance, and input scores — for your assigned subjects only. The system handles the rest.
> - Upload files, videos, and announcements
> - Record session-based attendance (Present, Late, Absent, Excused)
> - Build quizzes with auto-grading for objective questions
> - Input raw scores; the system computes final grades
> - Submit grades for Admin finalization

**Student tab:**
> Access your subjects, track your progress, and view your grades — once your payment is cleared.
> - View your Participation Meter per subject
> - Download course materials and watch video content
> - Take quizzes and submit assignments before deadlines
> - View component scores and computed final grades
> - See your subject status: Ongoing, Passed, or Failed

---

### Section 8: Pricing

**Background:** Off-white (`#F8F6F2`). **Padding:** 100px vertical.

**Section Header (centered):**
- **Label** (12px, uppercase, orange `#F5872C`, letter-spacing 3px): `PRICING`
- **Title** (36px, serif, navy `#1B3A4B`): `Simple, Transparent Institutional Plans`
- **Subtitle** (16px, sans-serif, charcoal, centered): `Every plan includes full platform access. No feature gates. No per-student fees. Scale freely.`

**Content: Three pricing cards (equal width, 24px gap)**

| | Starter | Professional | Enterprise |
|:---|:---|:---|:---|
| **Best for** | Small training centers (up to 200 students) | Mid-size schools (up to 1,000 students) | Large institutions (unlimited students) |
| **Price** | PHP 2,500/month | PHP 7,500/month | Custom pricing |
| **Staff accounts** | Up to 10 | Up to 50 | Unlimited |
| **Storage** | 20 GB | 100 GB | 500 GB+ |
| **Support** | Email (48-hour response) | Email + Chat (24-hour response) | Dedicated account manager |
| **Branding** | Logo + accent color | Logo + accent color + custom subdomain | Full white-label option |
| **CTA** | `Get Started` (teal button) | `Get Started` (highlighted — teal border, recommended badge) | `Contact Us` (orange button) |

**Card styling:** White background, 1px border (`#E5E1DB`), 40px padding. Professional plan has a teal top border (`#1A9E8F`, 3px) and a small badge: `RECOMMENDED` (orange `#F5872C` background, white text, 11px, uppercase).

**Below the cards, centered (14px, muted charcoal):**
`All plans include: SSL encryption, automated backups, PayMongo integration, and full audit logging.`
`Annual billing available with 2 months free.`

---

### Section 9: Frequently Asked Questions

**Background:** White. **Padding:** 100px vertical.

**Section Header (centered):**
- **Label** (12px, uppercase, orange `#F5872C`, letter-spacing 3px): `FAQ`
- **Title** (36px, serif, navy `#1B3A4B`): `Common Questions`

**Content: Accordion-style FAQ (max-width 720px, centered)**

Each question is a row with the question text on the left (16px, navy, semi-bold) and a `+` icon on the right. Clicking expands the answer below (15px, charcoal, line-height 1.7). The `+` rotates to `×`.

| Question | Answer |
|:---|:---|
| What types of institutions can use OKIT? | OKIT is designed for schools, colleges, universities, training centers, review centers, and any institution that enrolls students into structured programs with tuition-based enrollment. |
| How long does setup take? | Once your payment is confirmed, your digital campus is provisioned instantly. Most institutions complete their curriculum and financial setup within one working day. |
| Can students pay online through the system? | OKIT is designed for institutions that collect payments physically through a Cashier. The system tracks assessments, records cash payments, and issues digital Official Receipts. Online student payments may be supported in a future release. |
| What happens if we cancel our subscription? | You can export all your data (students, grades, financial records, audit logs) as a ZIP file. Your data is retained for 90 days after cancellation, then permanently purged. |
| Is our data safe? | Every institution gets an isolated database. Data is encrypted at rest (AES-256) and in transit (TLS 1.3). We perform automated daily backups with 30-day retention. |
| Can one person hold multiple roles? | For accountability, each role requires a separate account with distinct credentials. If one staff member performs two roles (e.g., Operator and Cashier in a small institution), they log in with the appropriate account for each task. All actions are logged under the specific role used. |
| Can the Super Admin see our institution's data? | No. The Super Admin manages platform-level operations (subscriptions, onboarding) only. They cannot view your students, grades, or financial records. If support is needed, a time-limited, read-only access can be granted — but only after your Admin confirms a verification code. |

---

### Section 10: Call to Action (Final CTA)

**Background:** Dark navy (`#1B3A4B`). **Padding:** 80px vertical.

**Content (centered):**
- **Title** (32px, serif, white): `Ready to Give Your Institution the Infrastructure It Deserves?`
- **Subtitle** (16px, sans-serif, white at 80%, max-width 540px, centered): `Submit your application today. Our team will review it and send you a secure payment link to activate your digital campus.`
- **CTA Button** (centered, 48px height): `Request Institutional Access` — orange `#F5872C` background, white text, large, subtle shadow. Hover: `#D4701F`.
- **Below button** (13px, white at 60%): `Applications are typically reviewed within 1–2 business days.`

---

### Section 11: Footer

**Background:** Charcoal (`#1A1A1A`). **Padding:** 60px top, 24px bottom. **Text:** White at 60% opacity.

**Layout: Four columns**

| Column 1: Brand | Column 2: Platform | Column 3: Legal | Column 4: Contact |
|:---|:---|:---|:---|
| OKIT wordmark (white, serif) | Features | Terms of Service | Email: contact@okit.ph |
| `Learning & Training Management System` (11px, uppercase, white at 40%) | Pricing | Privacy Policy | Phone: +63 XXX XXX XXXX |
| | How It Works | Data Processing Agreement | Location: Philippines |
| | FAQ | | |

**Bottom bar** (separated by thin line at 10% white opacity):
- Left: `© 2026 OKIT. All rights reserved.`
- Right: (no social media icons — keeps the formal tone)

---

## Request Access Form (Modal or Dedicated Page)

Triggered by any `Request Access` / `Request Institutional Access` button.

**Form styling:** White modal (max-width 560px) with a navy (`#1B3A4B`) header bar containing the OKIT logo and the text `Institutional Access Request` in white. If on a dedicated page, same styling but full-page centered.

**Form Fields:**

| Field | Type | Required | Notes |
|:---|:---|:---|:---|
| Institution Name | Text | Yes | Official registered name |
| Type of Institution | Dropdown | Yes | Options: `University`, `College`, `Training Center`, `Review Center`, `Vocational School`, `Other` |
| Representative Full Name | Text | Yes | The person submitting the request |
| Position/Title | Text | Yes | e.g., "Registrar", "School Director", "Owner" |
| Email Address | Email | Yes | Used for all communication and Admin account creation |
| Phone Number | Tel | Yes | With +63 country code prefix |
| Estimated Number of Students | Dropdown | Yes | Options: `1–50`, `51–200`, `201–500`, `501–1,000`, `1,000+` |
| Preferred Plan | Radio buttons | Yes | `Starter`, `Professional`, `Enterprise` |
| How did you hear about OKIT? | Dropdown | No | Options: `Search Engine`, `Referral`, `Social Media`, `Event`, `Other` |
| Additional Notes | Text area | No | Max 500 characters |

**Submit button:** `Submit Application` — teal `#1A9E8F` background, white text, full width. Hover: `#157A6E`.

**After submission:** The modal/page transitions to a confirmation view:
- Green check icon (teal `#1A9E8F`)
- Title: `Application Received`
- Message: `Thank you, [Representative Name]. We will review your application and respond to [email] within 1–2 business days.`
- `Return to Homepage` link

**Validation:** Real-time inline validation. Red border on invalid fields with a small error message below (e.g., "Please enter a valid email address"). Submit button is disabled until all required fields pass validation.
