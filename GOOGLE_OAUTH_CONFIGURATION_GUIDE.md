# REACHOPS — GOOGLE CLOUD CONSOLE & OAUTH 2.0 CONFIGURATION GUIDE
**Audience:** System Administrators, Outreach Engineers, and Platform Developers  
**Platform:** ReachOps (`https://reachops.netlify.app/`)  
**Scope:** Google Cloud Console, Google Workspace Admin Console, and Netlify Environment Configuration  

---

## 1. Overview
This guide provides exact step-by-step instructions to configure Google Cloud Platform (GCP) and Netlify for ReachOps Google OAuth 2.0 and Gmail API integration. Following these steps ensures seamless connection of multiple personal Gmail accounts and Google Workspace domain mailboxes without encountering authentication blocks, redirect mismatches, or unverified app errors.

---

## 2. Google Cloud Console Configuration (Step-by-Step)

### Step 2.1: Open Google Cloud Project
1. Navigate to [Google Cloud Console](https://console.cloud.google.com/).
2. Select your ReachOps project (or create a new project named `ReachOps Outreach Engine`).
3. Ensure the billing account is linked if required.

### Step 2.2: Enable the Gmail API
1. In the left navigation menu, go to **APIs & Services > Library**.
2. In the search box, type `Gmail API` and press Enter.
3. Click on **Gmail API** and click the blue **ENABLE** button.
   > **Note:** If the Gmail API is not enabled, Google will reject OAuth tokens with `accessNotConfigured (403)`.

### Step 2.3: Configure OAuth Consent Screen
1. Go to **APIs & Services > OAuth consent screen**.
2. Select the **User Type**:
   - **Internal (Recommended for Google Workspace):** If you are connecting mailboxes within your own Google Workspace domain, select **Internal**. Internal apps **do not require Google verification** and users will never see the "Google hasn't verified this app" warning.
   - **External:** If you are connecting personal `@gmail.com` accounts or mailboxes across different organizations, select **External**.
3. Fill in the App information:
   - **App name:** `ReachOps`
   - **User support email:** Select your developer or admin email (`vamsipallela31@gmail.com`).
   - **App logo:** (Optional) ReachOps icon.
   - **App domain:**
     - Application home page: `https://reachops.netlify.app/`
     - Application privacy policy: `https://reachops.netlify.app/`
     - Application terms of service: `https://reachops.netlify.app/`
   - **Authorized domains:** Add `netlify.app` (and your custom domain if applicable, e.g. `reachops.io`).
   - **Developer contact information:** `vamsipallela31@gmail.com`.
4. Click **SAVE AND CONTINUE**.

### Step 2.4: Add OAuth Scopes
1. On the **Scopes** page, click **ADD OR REMOVE SCOPES**.
2. Filter or search for the following scopes and check their boxes:
   - `.../auth/userinfo.email` (See your primary Google Account email address)
   - `.../auth/userinfo.profile` (See your personal info)
   - `openid` (Associate you with your personal info on Google)
   - `https://www.googleapis.com/auth/gmail.send` (Send email on your behalf)
   - `https://www.googleapis.com/auth/gmail.readonly` (View your email messages and settings)
3. Click **UPDATE**, then click **SAVE AND CONTINUE**.

### Step 2.5: Add Test Users (Resolves "Google hasn't verified this app")
If your app is in **Testing** mode (External):
1. On the **Test users** page, click **+ ADD USERS**.
2. Enter the email addresses that will connect mailboxes to ReachOps:
   - `vamsipallela31@gmail.com`
   - Any additional Gmail or Google Workspace test accounts.
3. Click **ADD** and then **SAVE AND CONTINUE**.
   > **Important:** While in testing mode, any account added as a Test User can authenticate immediately. When Google displays *"Google hasn't verified this app"*, test users click **"Advanced"** → **"Go to reachops.netlify.app (unsafe)"** to proceed safely.

### Step 2.6: Create OAuth 2.0 Web Client Credentials
1. Navigate to **APIs & Services > Credentials**.
2. Click **+ CREATE CREDENTIALS** at the top, and select **OAuth client ID**.
3. Select **Application type:** `Web application`.
4. **Name:** `ReachOps Web Client`.
5. **Authorized JavaScript origins:**
   Click **+ ADD URI** and enter:
   - `https://reachops.netlify.app`
   - `http://localhost:5173` (for local Vite dev)
   - `http://localhost:8888` (for local Netlify CLI dev)
6. **Authorized redirect URIs:**
   Click **+ ADD URI** and enter:
   - `https://reachops.netlify.app/api/auth/google/callback`
   - `https://reachops.netlify.app/api/auth-google-callback`
   - `http://localhost:5173/api/auth/google/callback`
   - `http://localhost:8888/api/auth/google/callback`
7. Click **CREATE**.
8. A modal will display your **Client ID** and **Client Secret**. Copy both values securely.

---

## 3. Google Workspace Domain Delegation (For Organization Inboxes)
For Google Workspace organizations that want to authorize ReachOps domain-wide:
1. Open the [Google Workspace Admin Console](https://admin.google.com/).
2. Go to **Security > Access and data control > API Controls**.
3. Under **Domain-wide delegation**, click **Manage Domain Wide Delegation**.
4. Click **Add new**.
5. In the **Client ID** field, paste:
   `670662356018-b553tq79s516rfj4ebt9m63ifvpkkav5.apps.googleusercontent.com`
6. In **OAuth scopes (comma-delimited)**, enter:
   `https://www.googleapis.com/auth/gmail.send, https://www.googleapis.com/auth/gmail.readonly, https://www.googleapis.com/auth/userinfo.email, https://www.googleapis.com/auth/userinfo.profile`
7. Click **Authorize**.

---

## 4. Netlify Environment Variables Configuration
To ensure Netlify serverless functions can exchange tokens and sign in mailboxes, configure these environment variables in your Netlify dashboard:

1. Open [Netlify Dashboard](https://app.netlify.com/).
2. Select your site: `reachops` (`https://reachops.netlify.app`).
3. Go to **Site configuration > Environment variables**.
4. Add or verify the following variables:

| Variable Name | Required Value | Purpose |
| :--- | :--- | :--- |
| `GOOGLE_CLIENT_ID` | `670662356018-b553tq79s516rfj4ebt9m63ifvpkkav5.apps.googleusercontent.com` | Google OAuth 2.0 Client ID |
| `GOOGLE_CLIENT_SECRET` | *(Your Google OAuth Client Secret from GCP)* | Used by backend for token exchange |
| `GOOGLE_REDIRECT_URI` | `https://reachops.netlify.app/api/auth/google/callback` | Strict callback URL |
| `APP_URL` | `https://reachops.netlify.app` | Base application URL for redirects |
| `ENCRYPTION_KEY` | *(32-character hex key for AES-256)* | Encrypts stored refresh & access tokens |
| `DATABASE_URL` | `file:/tmp/dev.db` | Prisma SQLite datasource protocol on Netlify |
| `SESSION_SECRET` | *(Secure JWT random secret string)* | Signs session cookies for user auth |

5. After saving variables, trigger a deploy or push a commit to apply the changes to all serverless lambdas.
