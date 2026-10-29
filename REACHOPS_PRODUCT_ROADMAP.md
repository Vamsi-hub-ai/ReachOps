# ReachOps SaaS — Prioritized Product & Engineering Roadmap

**Document:** Engineering Remediation & Feature Delivery Roadmap  
**Target:** ReachOps (Cold Outreach & Lead Generation SaaS)  
**Based on:** `REACHOPS_TECHNICAL_AUDIT.md`  
**Execution Rule:** Strict sequential execution. No new features until P0 and P1 stability and security criteria are met.

---

## Priority Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│ P0: Security, Data Leakage, Secrets Exposure & Build Repair            │
├────────────────────────────────────────────────────────────────────────┤
│ P1: Core Auth, PostgreSQL Migration, Tenant Isolation & Real Campaigns │
├────────────────────────────────────────────────────────────────────────┤
│ P2: Reliable Dispatch Queue, Inbox Reply Engine, Unsubscribe & Sync   │
├────────────────────────────────────────────────────────────────────────┤
│ P3: Real DNS Deliverability, Analytics Correction & Suppression Table  │
├────────────────────────────────────────────────────────────────────────┤
│ P4: Microsoft 365, Stripe Billing, Multi-Seat RBAC & Webhooks         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Phase P0: Critical Security Vulnerabilities, Credential Exposure & Build Repair

> **Goal:** Eliminate security backdoors, stop credential exposure, close unauthenticated admin access, and fix compilation errors so the codebase successfully builds.

### Task P0-1: Remove Global Authentication Bypass in `auth.ts`
- **Description:** Remove the hardcoded fallback that automatically logs unauthenticated users in as `vamsipallela31@gmail.com` or the first user in the database.
- **Estimated Complexity:** **S** (Small)
- **Dependencies:** None
- **Affected Files:**
  - `netlify/lib/auth.ts`
- **Acceptance Criteria:**
  - `getAuthContext(event)` returns `null` for `user` and `userId` when no valid JWT session cookie is provided.
  - Calling any protected API endpoint (`/api/campaigns`, `/api/email-accounts`, etc.) without a session cookie returns `HTTP 401 Unauthorized` with `{ error: "Unauthorized" }`.

---

### Task P0-2: Remove Login Password Backdoors & Plaintext Logging
- **Description:** Remove all hardcoded password bypasses (`'vamsi'`, `'password123'`, `'Demo@123'`) from `auth-login.ts`. Remove plaintext console logging of user credentials. Enforce strict `bcrypt.compare` against `user.passwordHash`.
- **Estimated Complexity:** **S** (Small)
- **Dependencies:** None
- **Affected Files:**
  - `netlify/functions/auth-login.ts`
- **Acceptance Criteria:**
  - Entering `'vamsi'`, `'password123'`, or arbitrary strings for any account fails with `HTTP 401 Invalid credentials`.
  - Only the exact password hashed during signup or seeding succeeds.
  - Zero password or request body text is logged to Netlify function logs.

---

### Task P0-3: Revoke Exposed Google OAuth Secret & Rotate Secrets
- **Description:** Revoke the exposed Google Client Secret (`[REDACTED-GOOGLE-CLIENT-SECRET]`) in Google Cloud Console. Sanitize `.env.example`. Enforce runtime errors if `SESSION_SECRET` or `ENCRYPTION_KEY` are using fallback strings.
- **Estimated Complexity:** **S** (Small)
- **Dependencies:** Google Cloud Console access
- **Affected Files:**
  - `.env.example`
  - `netlify/lib/encryption.ts`
  - `netlify/lib/auth.ts`
- **Acceptance Criteria:**
  - `.env.example` contains only placeholder values (`YOUR_GOOGLE_CLIENT_SECRET`).
  - `encryption.ts` throws an explicit startup error if `ENCRYPTION_KEY` is not provided or is less than 32 bytes in production mode.

---

### Task P0-4: Fix TypeScript Compilation Errors (`npm run build`)
- **Description:** Fix the 3 fatal compilation errors blocking `npm run build` (`tsc -b`) and the 1 fatal compilation error in Netlify functions. Include Netlify functions in root build verification.
- **Estimated Complexity:** **S** (Small)
- **Dependencies:** None
- **Affected Files:**
  - `src/pages/campaigns/CampaignAnalytics.tsx` (Line 458: type step parameter)
  - `src/pages/Settings.tsx` (Line 195: wrap `String(key)`)
  - `vite.config.ts` (Line 4: import `./src/vite-api-plugin.ts`)
  - `netlify/functions/activity-log.ts` (Line 24: null-check `msg.sentAt`)
  - `tsconfig.json` (Add reference to `tsconfig.netlify.json`)
- **Acceptance Criteria:**
  - `npm run build` completes cleanly with exit code 0.
  - `npx tsc -p tsconfig.netlify.json` completes cleanly with exit code 0.

---

## Phase P1: Broken Authentication, Database Migration & Core Campaign Execution

> **Goal:** Transition from local SQLite to production PostgreSQL, enforce strict multi-tenant isolation, implement frontend route guards, and replace mock campaign wizard saving with real database persistence.

### Task P1-1: Migrate to PostgreSQL & Generate Initial Migrations
- **Description:** Standardize `prisma/schema.prisma` on PostgreSQL (`provider = "postgresql"`). Add missing compound indexes and unique constraints. Initialize `prisma/migrations` using `prisma migrate dev`. Ensure compatibility with Neon / Supabase connection pooling.
- **Estimated Complexity:** **M** (Medium)
- **Dependencies:** Active PostgreSQL database credentials
- **Affected Files:**
  - `prisma/schema.prisma`
  - `prisma/schema.pg.prisma` (Retire / consolidate)
  - `netlify/lib/prisma.ts`
  - `.gitignore` (Add `*.db`, `*.db-journal`, `dev.db`)
- **Acceptance Criteria:**
  - `npx prisma migrate dev` creates clean migration files in `prisma/migrations`.
  - Database schema contains:
    - `EmailAccount`: `@@unique([workspaceId, email])`
    - `Prospect`: `@@unique([campaignId, email])`
    - `CampaignEnrollment`: `@@unique([campaignId, prospectId])`, `@@index([status, nextActionAt])`
    - `Message`: `@@index([campaignId, status])`, `@@index([sentAt])`
    - `Suppression`: `@@unique([workspaceId, email])`
  - Connection pooling functions correctly under serverless concurrency.

---

### Task P1-2: Frontend Protected Route Guards
- **Description:** Build a `ProtectedRoute` component in React that verifies user authentication status via `GET /api/auth/me`. Redirect unauthenticated users from `/dashboard`, `/campaigns`, `/inbox`, and `/settings` to `/login`.
- **Estimated Complexity:** **M** (Medium)
- **Dependencies:** Task P0-1
- **Affected Files:**
  - `src/components/ProtectedRoute.tsx` (New)
  - `src/App.tsx`
  - `src/layouts/DashboardLayout.tsx`
- **Acceptance Criteria:**
  - Direct URL access to `https://reachops.netlify.app/dashboard` or `/campaigns` without an active session automatically redirects to `/login`.
  - `DashboardLayout.tsx` displays the authenticated user's actual name and email, not a hardcoded "Demo User".

---

### Task P1-3: Enforce Multi-Tenant Isolation (Anti-IDOR) on All Endpoints
- **Description:** Update all Netlify functions (`campaigns.ts`, `templates.ts`, `campaigns-settings.ts`, `campaigns-sequence.ts`) to verify that the target resource belongs to the caller's authenticated `workspaceId` before performing updates or deletions.
- **Estimated Complexity:** **M** (Medium)
- **Dependencies:** Task P0-1, Task P1-1
- **Affected Files:**
  - `netlify/functions/campaigns.ts`
  - `netlify/functions/templates.ts`
  - `netlify/functions/campaigns-settings.ts`
  - `netlify/functions/campaigns-sequence.ts`
- **Acceptance Criteria:**
  - Sending `DELETE /api/campaigns?id=xyz` or `PUT /api/campaigns/:id/sequence` where `xyz` belongs to a different workspace returns `HTTP 403 Forbidden` or `HTTP 404 Not Found`.

---

### Task P1-4: Connect Campaign Wizard to Real Backend Persistence
- **Description:** Overhaul `CampaignWizard.tsx` line 163 (`handleLaunch`). Replace the client-side `localStorage` mock simulation with real API calls:
  1. `POST /api/campaigns` (Creates campaign with schedule and limits).
  2. `PUT /api/campaigns/:id/sequence` (Creates steps and templates).
  3. `POST /api/campaigns/:id/sync-sheet` (Enrolls prospects from Google Sheet).
  4. `POST /api/campaigns/:id/start` (Activates the campaign).
- **Estimated Complexity:** **L** (Large)
- **Dependencies:** Task P1-1, Task P1-3
- **Affected Files:**
  - `src/pages/campaigns/CampaignWizard.tsx`
  - `netlify/functions/campaigns.ts`
  - `netlify/functions/campaigns-sync-sheet.ts`
- **Acceptance Criteria:**
  - Completing the Campaign Wizard creates real records in `Campaign`, `Sequence`, `SequenceStep`, `Prospect`, and `CampaignEnrollment` in PostgreSQL.
  - Navigating to `/campaigns` displays the newly created campaign loaded directly from the database across any browser or device.

---

### Task P1-5: Fix Campaign-Level Email Account Binding
- **Description:** Allow users to bind specific sender email accounts to a campaign. Add a `CampaignEmailAccount` relation model in Prisma so that only assigned mailboxes are used for rotating outreach.
- **Estimated Complexity:** **M** (Medium)
- **Dependencies:** Task P1-1
- **Affected Files:**
  - `prisma/schema.prisma`
  - `netlify/functions/campaigns.ts`
  - `src/pages/campaigns/tabs/CampaignAccounts.tsx`
  - `netlify/functions/cron-dispatcher.ts`
- **Acceptance Criteria:**
  - Toggling account assignment in `CampaignAccounts.tsx` saves to the database via API.
  - `cron-dispatcher.ts` selects ONLY email accounts assigned to that specific campaign.

---

## Phase P2: Reliable Sending Queues, Unified Inbox, Unsubscribe & Sync

> **Goal:** Ensure email dispatching is durable, prevent duplicate sends, implement real Unified Inbox sending, fix reply detection, and achieve CAN-SPAM / GDPR unsubscribe compliance.

### Task P2-1: Implement Safe Dispatch Locking & Sending Windows
- **Description:** Update `cron-dispatcher.ts` to:
  1. Check sending schedule windows (`sendingWindowStart`, `sendingWindowEnd`, `weekendSendingEnabled`, `timezone`) before dispatching.
  2. Implement an atomic state lock (`status: 'PROCESSING'`) to prevent race conditions and duplicate sends if cron functions run concurrently.
  3. Batch sends in safe chunk sizes (e.g., 10-15 per execution) to guarantee completion within Netlify's 10-second timeout.
- **Estimated Complexity:** **L** (Large)
- **Dependencies:** Task P1-1, Task P1-5
- **Affected Files:**
  - `netlify/functions/cron-dispatcher.ts`
- **Acceptance Criteria:**
  - Emails are never sent outside the configured timezone and time window.
  - Two simultaneous cron triggers never send duplicate emails to the same prospect.
  - No cron execution exceeds 8 seconds.

---

### Task P2-2: Real Email Dispatching in Unified Inbox
- **Description:** Wire the "Send Reply" action in `inbox.ts` to actually send the email via Gmail API (`sendSequenceEmail`) with RFC-compliant `In-Reply-To` and `References` headers for thread continuity.
- **Estimated Complexity:** **M** (Medium)
- **Dependencies:** Task P1-1
- **Affected Files:**
  - `netlify/functions/inbox.ts`
  - `netlify/lib/mailer.ts`
  - `src/pages/inbox/UnifiedInbox.tsx`
- **Acceptance Criteria:**
  - Clicking "Send" in the Unified Inbox dispatches a live email through the connected Google account.
  - The recipient receives the reply in the existing conversation thread.
  - The message appears in the sender's Gmail "Sent" folder.

---

### Task P2-3: Fix Google OAuth Scopes & Repair `cron-inbox-sync`
- **Description:**
  1. Add `https://www.googleapis.com/auth/gmail.modify` and `https://www.googleapis.com/auth/drive.readonly` to `auth-google-url.ts`.
  2. Add cryptographically secure CSRF nonce verification to `auth-google-url.ts` and `auth-google-callback.ts`.
  3. Fix invalid `Prospect.workspaceId` query in `cron-inbox-sync.ts` by querying prospects via campaign relation.
- **Estimated Complexity:** **M** (Medium)
- **Dependencies:** Task P0-3, Task P1-1
- **Affected Files:**
  - `netlify/functions/auth-google-url.ts`
  - `netlify/functions/auth-google-callback.ts`
  - `netlify/functions/cron-inbox-sync.ts`
- **Acceptance Criteria:**
  - Reconnecting a Google account grants `gmail.modify` permissions.
  - `cron-inbox-sync.ts` runs without runtime exceptions.
  - Inbound replies from active prospects automatically pause their campaign enrollment and record a `REPLIED` message event.

---

### Task P2-4: Implement Unsubscribe Engine & Suppression Enforcement
- **Description:**
  1. Create `/api/unsubscribe` endpoint (`netlify/functions/unsubscribe.ts`).
  2. Display a confirmation page to the recipient upon clicking the unsubscribe link.
  3. Set `Prospect.unsubscribe = true`, pause all active enrollments, and insert the email into the `Suppression` table.
  4. Update `cron-dispatcher.ts` to verify the recipient email and domain against the `Suppression` table before sending.
- **Estimated Complexity:** **M** (Medium)
- **Dependencies:** Task P1-1
- **Affected Files:**
  - `netlify/functions/unsubscribe.ts` (New)
  - `netlify/lib/mailer.ts`
  - `netlify/functions/cron-dispatcher.ts`
  - `src/pages/SuppressionList.tsx`
- **Acceptance Criteria:**
  - Clicking the `List-Unsubscribe` header or in-body link renders an "Unsubscribed Successfully" page.
  - The email is added to `Suppression` table.
  - The prospect never receives another email from ReachOps, even if enrolled in new campaigns.

---

## Phase P3: Real DNS Deliverability, Analytics Correction & Usability

> **Goal:** Replace simulated deliverability and metrics with real DNS lookups and accurate database aggregations.

### Task P3-1: Real DNS Diagnostics (SPF, DKIM, DMARC, MX)
- **Description:** Replace the hardcoded mock responses in `netlify/lib/deliverability.ts` (`getDomainHealth`) with real asynchronous DNS queries using Node.js `node:dns/promises`:
  - `resolveTxt` for SPF (`v=spf1`) and DMARC (`_dmarc.domain`).
  - `resolveMx` for MX records.
  - Selector-based query for DKIM.
  - Remove fictional "Warmup Network (150,000+ inboxes)" metrics.
- **Estimated Complexity:** **M** (Medium)
- **Dependencies:** None
- **Affected Files:**
  - `netlify/lib/deliverability.ts`
  - `netlify/functions/deliverability-diagnose.ts`
  - `src/components/DeliverabilityDiagnoseModal.tsx`
- **Acceptance Criteria:**
  - Entering a custom domain performs live DNS resolution and accurately reports existing or missing SPF, DKIM, DMARC, and MX records.
  - No simulated or fabricated warmup network statistics are presented to the user.

---

### Task P3-2: Fix Metric Aggregations & Step Funnel Calculation
- **Description:** Fix `campaigns-analytics.ts` and `analytics-dashboard.ts`:
  1. Calculate `totalSent` using all messages with `sentAt != null` (do not exclude messages that were opened or replied to).
  2. Remove hardcoded fallback mock data for `tga-sales`.
  3. In `Dashboard.tsx`, replace static mock SVG chart points with a real 30-day daily send aggregation query.
- **Estimated Complexity:** **M** (Medium)
- **Dependencies:** Task P1-1
- **Affected Files:**
  - `netlify/functions/campaigns-analytics.ts`
  - `netlify/functions/analytics-dashboard.ts`
  - `src/pages/Dashboard.tsx`
  - `src/pages/campaigns/CampaignAnalytics.tsx`
- **Acceptance Criteria:**
  - Open rate and reply rate formulas divide by the true total number of sent emails.
  - Opening an email does not decrement the "Emails Sent" count.
  - Dashboard sparkline reflects actual daily volume from the database.

---

### Task P3-3: Connect Global Prospects and Suppression Management
- **Description:** Create backend API endpoints for global prospects (`/api/prospects`) and suppression rules (`/api/suppression`). Wire `ProspectList.tsx` and `SuppressionList.tsx` to these endpoints with search, CSV import, and deletion capabilities.
- **Estimated Complexity:** **M** (Medium)
- **Dependencies:** Task P1-1, Task P2-4
- **Affected Files:**
  - `netlify/functions/prospects.ts` (New)
  - `netlify/functions/suppression.ts` (New)
  - `src/pages/prospects/ProspectList.tsx`
  - `src/pages/SuppressionList.tsx`
- **Acceptance Criteria:**
  - Prospects and suppression rules can be added, searched, imported via CSV, and deleted, with full backend database persistence.

---

## Phase P4: Integrations, Billing, Multi-Seat RBAC & Webhooks

> **Goal:** Commercial readiness, payment processing, user limits, team invitations, and Microsoft 365 support.

### Task P4-1: Microsoft 365 / Outlook OAuth Integration
- **Description:** Implement full Microsoft OAuth 2.0 and Microsoft Graph API sending:
  1. `GET /api/auth/microsoft-url` (Generates Microsoft login consent URL).
  2. `GET /api/auth/microsoft-callback` (Exchanges auth code for tokens, encrypts tokens, saves to `EmailAccount`).
  3. Microsoft Graph mail sender client in `mailer.ts` (`https://graph.microsoft.com/v1.0/me/sendMail`).
- **Estimated Complexity:** **L** (Large)
- **Dependencies:** Microsoft Entra ID App Registration
- **Affected Files:**
  - `netlify/functions/auth-microsoft-url.ts` (New)
  - `netlify/functions/auth-microsoft-callback.ts` (New)
  - `netlify/lib/microsoft-client.ts` (New)
  - `netlify/lib/mailer.ts`
  - `src/pages/EmailAccounts.tsx`
- **Acceptance Criteria:**
  - Users can connect Microsoft 365 / Outlook mailboxes via OAuth.
  - `cron-dispatcher.ts` successfully sends emails through Microsoft Graph API.

---

### Task P4-2: Stripe Subscription Billing & Usage Limits
- **Description:**
  1. Add `Subscription` and `Plan` models to Prisma.
  2. Integrate Stripe Checkout for Starter (\$29), Pro (\$99), and Enterprise (\$249) plans.
  3. Implement Stripe webhook handler (`netlify/functions/stripe-webhook.ts`) for `checkout.session.completed` and `customer.subscription.updated`.
  4. Enforce plan limits in `campaigns-sync-sheet.ts` (monthly email limit) and `email-accounts.ts` (max connected mailboxes).
- **Estimated Complexity:** **L** (Large)
- **Dependencies:** Stripe account and API keys
- **Affected Files:**
  - `prisma/schema.prisma`
  - `netlify/functions/stripe-checkout.ts` (New)
  - `netlify/functions/stripe-webhook.ts` (New)
  - `netlify/functions/email-accounts.ts`
  - `netlify/functions/campaigns-sync-sheet.ts`
  - `src/pages/Settings.tsx`
- **Acceptance Criteria:**
  - Upgrading a plan redirects to Stripe Checkout and updates the workspace subscription upon payment.
  - Free/Starter accounts cannot add more than 2 mailboxes or send more than 2,500 emails/month.

---

### Task P4-3: Multi-Seat Team Invitations & RBAC
- **Description:** Replace the `localStorage` team simulation in `Settings.tsx` with a real invitation flow:
  1. `POST /api/team/invite` (Creates `WorkspaceMember` record with status `INVITED`, generates token, sends invite email).
  2. Invite acceptance page (`/accept-invite?token=...`).
  3. Role-based permission enforcement (OWNER, ADMIN, MEMBER).
- **Estimated Complexity:** **M** (Medium)
- **Dependencies:** Task P1-1, Task P2-1
- **Affected Files:**
  - `netlify/functions/team.ts` (New)
  - `src/pages/Settings.tsx`
  - `prisma/schema.prisma`
- **Acceptance Criteria:**
  - Workspace owners can invite team members by email.
  - Invited users can join the workspace and access shared campaigns with appropriate role permissions.

---

## Summary Matrix of Roadmap Tasks

| Phase | Task ID | Title | Complexity | Priority | Blocks Production? |
|---|---|---|---|---|---|
| **P0** | P0-1 | Remove Auth Bypass in `auth.ts` | **S** | Critical | **YES** |
| **P0** | P0-2 | Remove Password Backdoors & Plaintext Logs | **S** | Critical | **YES** |
| **P0** | P0-3 | Revoke Exposed Google Secret | **S** | Critical | **YES** |
| **P0** | P0-4 | Fix TypeScript Build Compilation Errors | **S** | Critical | **YES** |
| **P1** | P1-1 | Migrate to PostgreSQL & Generate Migrations | **M** | High | **YES** |
| **P1** | P1-2 | Frontend Protected Route Guards | **M** | High | **YES** |
| **P1** | P1-3 | Multi-Tenant Isolation (Anti-IDOR) | **M** | High | **YES** |
| **P1** | P1-4 | Real Campaign Wizard Backend Persistence | **L** | High | **YES** |
| **P1** | P1-5 | Campaign Email Account Binding | **M** | High | **YES** |
| **P2** | P2-1 | Safe Dispatch Locking & Schedule Windows | **L** | High | **YES** |
| **P2** | P2-2 | Real Email Dispatching in Unified Inbox | **M** | High | **YES** |
| **P2** | P2-3 | Fix Google Scopes & Repair `cron-inbox-sync` | **M** | High | **YES** |
| **P2** | P2-4 | Unsubscribe Engine & Suppression Check | **M** | High | **YES** |
| **P3** | P3-1 | Real DNS Deliverability Diagnostics | **M** | Medium | No |
| **P3** | P3-2 | Fix Metric Aggregations & Sparkline Chart | **M** | Medium | No |
| **P3** | P3-3 | Global Prospects & Suppression APIs | **M** | Medium | No |
| **P4** | P4-1 | Microsoft 365 OAuth & Graph Mailer | **L** | Medium | No |
| **P4** | P4-2 | Stripe Subscription Billing & Quota Limits | **L** | Low | No |
| **P4** | P4-3 | Multi-Seat Team Invitations & RBAC | **M** | Low | No |

