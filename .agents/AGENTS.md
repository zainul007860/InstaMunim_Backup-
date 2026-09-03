# Project Rules, System Architecture & Memory Guidelines

## 1. Git Commit & Repository Rules
- **NEVER** use generic commit messages like `"update"`, `"fix"`, `"commit"`, or `"changes"`.
- **ALWAYS** write clear, descriptive, professional commit messages explaining the exact feature or fix (e.g. `git commit -m "Fix admin support WhatsApp number to 7838229178"`, `git commit -m "Add permanent top AdMob banner on Login page"`).
- **Dual Remotes Policy**:
  - `origin`: `https://github.com/zainul007860/InstaMunim_Backup-.git` (Main repo backup)
  - `production`: `https://github.com/zainul007860/InstaMunim.git` (Connected to live Vercel deployment `www.instamunim.com`)
  - **Rule**: Every change to `micro-saas-app` or `instamunim-admin` MUST be pushed to BOTH `origin` and `production` (`git push origin main; git push production main`).

---

## 📌 2. InstaMunim Complete Ecosystem Overview

### Core Applications
1. **Merchant Smart POS & Web App (`micro-saas-app`)**:
   - **Path**: `micro-saas-app/`
   - **Tech Stack**: Next.js (App Router), Capacitor Android (`com.zainul.instamunimpos`), Tailwind CSS, Supabase Cloud Backend.
   - **Features**: Live Fast Billing, Laser/Camera Barcode Scanner, Voice Cashier Soundbox (9 Indian languages), Udhaar Khata / Customer Ledger, WhatsApp Invoices, Rent & Expense Tracker, Multi-AI Menu Scanner, Bluetooth Thermal Printer integration.
   - **OTA Updates**: Web-based capacitor server mode (`https://www.instamunim.com`). Zero APK re-install required for UI/logic updates.

2. **InstaMunim Partner App (Field Sales & Onboarding)**:
   - **Path**: `micro-saas-app/src/app/partner/page.tsx`
   - **Live Web URL**: `https://www.instamunim.com/partner`
   - **Android Identity**: Standalone APK (`InstaMunim_Partner_v1.0.apk`), Package ID: `com.instamunim.partner`, App Name: `InstaMunim Partner`.
   - **Theme**: Crisp sunlight-readable **Light Theme** (`#f8fafc`, `#ffffff`, `#0f172a`, `#ea580c`).
   - **Features**:
     - **Auth**: Mobile Number + Password login with Eye show/hide toggle and Remember Me.
     - **Profile & Photo**: Dedicated Profile tab with Admin-assigned details + Camera/Photo upload. Top header displays real executive photo with live duty status dot.
     - **Duty Punch-In/Out**: Real-time OpenStreetMap reverse geocoded GPS location detection.
     - **Rapid Store Onboarding**: 30-second form with live camera shop front verification, ₹500 standard onboarding collection (Cash in Hand or Dynamic UPI QR `7838229178@ptaxis`).
     - **Auto-Credentials**: Generates 4-digit PIN password from last 4 digits of store owner mobile and provides 1-click WhatsApp Welcome Message with login link.
     - **Digital Pitch Kit**: High-converting selling points (WhatsApp Marketing, Smart CRM, Rent Tracker, Barcode Billing, Auto QR, Voice Soundbox, Cloud Records, Sales Export, Stock Alerts).
     - **Leads CRM**: Hot/Warm/Cold field lead capture with revisit calendar dates.
     - **Cash in Hand Ledger**: Tracks unsettled ₹500 collections per store until settled by Admin.

3. **Admin Command Center (`instamunim-admin`)**:
   - **Path**: `instamunim-admin/`
   - **Tech Stack**: Next.js 14 Web Portal, Inter typography, default crisp Light Theme.
   - **Features**:
     - **Global Metrics**: Active stores, daily/monthly revenue, transaction volume.
     - **Merchant Menus & Inventory Manager (`MerchantMenuSection.tsx`)**:
       - Multi-AI Vision Engine (Gemini 2.5 Flash / 1.5 Flash, GPT-4o / GPT-4o-mini, Claude 3.5 Sonnet) for instant photo-to-menu extraction.
       - CSV / Excel bulk upload with sample template download.
       - Zero-Leak custom API key switcher.
     - **Field Sales Force Section (`FieldSalesSection.tsx`)**:
       - Executive roster registration (Name, Mobile, Password, City, Daily Target).
       - 40+ Store Super-Incentive Policy Tracker (+₹100/store after 40 onboardings).
       - Live Onboarded Stores table with photo inspection and delete actions.
       - Cash Settlement Manager with 1-click settle and ledger purge.
       - ₹250 Monthly Subscription Renewal Desk with 1-click WhatsApp payment links and direct phone dialing.
       - Field Leads CRM table with delete/clean controls.
     - **Remote Config & Monetization Control**:
       - AdMob Banner & Interstitial toggles.
       - Maintenance Mode barrier switch.
       - Force Update version barrier.
       - Google Play 5-Star review booster toggle.

---

## 🗄️ 3. Database Architecture (Supabase)
- **Supabase Project URL**: `https://xkdzshwsbhtebwrtxlua.supabase.co`
- **Publishable Key**: `sb_publishable_3EY3aMcvka2MVU3fRFmoCA_jd6J6UcD`
- **Tables & Schemas**:
  - `stores`: Stores merchant profiles (`id`, `store_name`, `owner_mobile`, `password`, `subscription_expiry`, `monthly_rent`, `store_logo`).
    - Special Row `owner_mobile: 'admin_fse_config'`: Holds compressed JSON in `store_logo` (`JSON_CFG:{"agents":[], "leads":[], "attendance":[], "settlements":[]}`).
  - `menu_items`: Products, dishes, portions, rates, and categories tagged by `store_id`.
  - `sales`: Ledger of all billing receipts, payment modes (Cash, UPI, Card), and item breakdowns.
  - `expenses`: Ledger of shop expenses and rent entries.
  - `app_config`: Global remote configs (`gemini_api_key`, dynamic support WhatsApp `7838229178`, etc.).
- **Ultra-Lightweight Storage**:
  - Entire database is optimized to consume < 10 MB even for 50,000+ stores.
  - Shop photos are compressed client-side (~30 KB) before cloud storage.
  - Zero database bloat or unindexed heavy blobs.

---

## 🔔 4. Discord Live Webhook Notification Policy
- **Webhook Endpoint**: `https://discord.com/api/webhooks/1519273765802872852/OC4rCgfmPqr2JK_9w17xaR2MHEnX4l2JOmgP11ae4weG5KDWsm4o0dzkPnoNHiWosmII`
- **Helper**: `micro-saas-app/src/lib/discord.ts` (`sendDiscordAlert`)
- **Active Notifications Filter (Strictly 4 Categories)**:
  1. 🔑 **Login**: Merchant Login (`dashboard/page.tsx`) & Field Executive Login (`partner/page.tsx`).
  2. 🚪 **Logout**: Field Executive Logout / Duty End (`partner/page.tsx`).
  3. 🛍️ **New Store**: Field Executive Rapid Store Onboarding & Self-Serve Merchant Registration.
  4. 💰 **Store Sales**: Live billing receipt generated by any merchant POS.
  - *(Note: Field Leads alerts are explicitly disabled to prevent spamming).*

---

## 📱 5. Android APKs & Build Artifacts
- **Merchant POS APK**: `InstaMunim_v1.9_Production.apk` (Package: `com.zainul.instamunimpos`)
- **Partner Field Sales APK**: `InstaMunim_Partner_v1.0.apk` (Package: `com.instamunim.partner`, 24.3 MB)
- **Root Backups**:
  - Full Backup Folder: `backups/Full_Backup_2026-08-25_Partner_Complete/`
  - Compressed ZIP: `InstaMunim_FULL_BACKUP_25_AUG_2026_WIN.zip` (2.05 GB)

---

## 🍽️ 6. Smart QR Table Ordering System (Restaurant/Cafe Only)
- **Customer Public Menu & Ordering Page (`micro-saas-app/src/app/order/page.tsx`)**:
  - **Live URL**: `https://www.instamunim.com/order?store=<owner_mobile>&table=<table_no>`
  - **Design**: Swiggy / Zomato inspired modern mobile UI with Veg/Non-veg badges, live search filter, category scroller, and sticky floating cart.
  - **Payment Flow**: Direct UPI intent deep links (`upi://pay?pa=...`) + Dynamic UPI QR generator.
  - **Database Integration**: On order confirmation, automatically inserts into `sales` table (`type: "Table QR UPI"`, tagged with `[TABLE:<num>]`), updating store daily gross revenue immediately.
- **Merchant POS Integration (`micro-saas-app/src/app/dashboard/page.tsx`)**:
  - **Supabase Realtime Listener**: Listens to `sales` table inserts on the merchant's `store_id`.
  - **Soundbox Voice Announcer**: Speaks loud voice alert: *"नया टेबल आर्डर! टेबल नंबर X से ₹Y प्राप्त हुए!"*.
  - **Incoming Order Popup**: Fullscreen bold green modal with customer name, phone, item breakdown, and 1-Click "ACCEPT & PRINT KOT 🖨️" button.
  - **Table QR Generator Desk**: Accessible under Settings > Store Profile for `businessType === "Restaurant/Cafe"`. Allows generating and printing A4 sheet standees for tables (1..N).

---

## 📌 7. Session Continuity & Memory Rule (CRITICAL)
- **Mandatory Memory Update**:
  - Whenever user discusses anything, tests a feature, reports an issue, or ends a session, the assistant **MUST IMMEDIATELY** record the exact state, exact topic discussed, user remarks, and next pending tasks in **Section 8 (Live Conversation Log)** below.
- **New Window Resume Protocol**:
  - Whenever user asks to "load last conversation" or opens a new session, the assistant MUST read Section 8 first and instantly summarize:
    1. Last discussed topic & user's exact thoughts/testing remarks.
    2. Exact state of code/database.
    3. Pending next action items without needing the user to repeat anything.

---

## 📝 8. Live Conversation & Session Log

### 🗓️ Session: 03-SEP-2026
- **Last Active Topic**: Smart QR Table Ordering System (`/order` page + Dashboard Soundbox & KOT alert modal).
- **User's Remarks & Context**:
  - User stated that they would test the Table QR ordering section at home in a real restaurant scenario.
  - User requested a persistent memory system so whenever a new window/chat opens, the assistant resumes exactly where things were left off.
- **Current Technical State**:
  - Table QR flow fully coded in `micro-saas-app/src/app/order/page.tsx` & `micro-saas-app/src/app/dashboard/page.tsx`.
  - Google Play Developer Signing & Package verification verified & green-checked for `com.zainul.instamunimpos` and `com.sahidawa.app`.
- **Pending / Next Action**:
  - Review testing results/feedback of Table QR ordering.
  - Any UI/UX refinements or new feature requests from the user.


