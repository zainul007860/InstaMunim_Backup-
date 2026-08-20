# Project Rules & Style Guidelines

## Git Commit Messages
- **NEVER** use generic commit messages like `"update"`, `"fix"`, `"commit"`, or `"changes"`.
- **ALWAYS** write clear, descriptive, professional commit messages explaining the exact feature or fix (e.g. `git commit -m "Fix admin support WhatsApp number to 7838229178"`, `git commit -m "Add permanent top AdMob banner on Login page"`).

---

## 📌 InstaMunim Project Overview & Architectural Memory

### 1. Core Ecosystem
- **Mobile POS & Merchant App (`micro-saas-app`)**: Next.js + Capacitor Android App with instant OTA updates, offline/online sync, Voice Cashier, Udhaar Khata, Buyback exchange tracker, WhatsApp invoicing, and Supabase backend.
- **Admin Command Center (`instamunim-admin`)**: Next.js 14 Web Portal for global network monitoring, remote feature toggles, merchant inspections, subscription tier activations, and merchant menu onboarding.
- **Cloud Database (Supabase)**:
  - `stores`: Stores all merchant profiles, `owner_mobile`, `password`, `subscription_expiry`, `monthly_rent`, and JSON config in `store_logo`.
  - `menu_items`: Products, dishes, portions, rates, and category tagged by `store_id`.
  - `sales` & `expenses`: Financial ledger and billing records.
  - `app_config`: Key-value store for global configs (`gemini_api_key`, dynamic support WhatsApp number, etc.).

### 2. Key Admin Capabilities & Latest Milestones
- **Merchant Menus & Inventory Manager (`MerchantMenuSection.tsx`)**:
  - **Multi-AI Vision Engine**: Supports **Google Gemini (2.5 Flash / 1.5 Flash)**, **OpenAI ChatGPT (GPT-4o / GPT-4o-mini)**, and **Anthropic Claude (3.5 Sonnet)** for instant photo-to-menu extraction.
  - **Zero-Leak Custom API Key Input**: Admin can input & switch API keys directly from the UI, stored securely in `localStorage` + `app_config`.
  - **CSV / Excel Bulk Importer**: Drag-and-drop CSV sheet upload with auto-delimiter parsing and downloadable sample template.
  - **Live Cloud Sync**: 0% APK update required; menu items immediately show in merchant's app upon save.
  - **Direct Store Actions**: Inspect profile, reset sales ledger, WhatsApp merchant, activate subscriptions.
- **Remote Config & AdMob / Web Ads Control**: Dynamic banner & interstitial control, maintenance mode switch, force update version barrier, and Google Play 5-star review booster.
