# Business Requirements Document (BRD)
**Project Name:** Cloud POS System v2.0 (Mobile Optimization & Voice Integration)
**Date:** May 2026
**Role:** Senior Business Analyst

---

## 1. Executive Summary
This document outlines the business requirements, features, and technical enhancements for the **Cloud POS System v2.0**. The primary goal of this update is to optimize the mobile user experience, integrating an advanced continuous native voice recognition system, robust security controls, and intuitive gestures that mimic native application behavior while maintaining seamless cloud synchronization.

---

## 2. Feature Specifications

### 2.1. Authentication & Security Control
**Description:** The entry point of the application has been secured and optimized for mobile input.
*   **Mobile Registration & Login:** Users can authenticate using an owner's mobile number and a secure secret password.
*   **Password Visibility Toggle:** A highly requested usability feature allowing users to toggle password visibility (Eye/Eye-Off icon) to reduce login friction and typos on small mobile keyboards.
*   **Silent Background Sync:** The system handles authorization tokens intelligently, preventing redundant "Sync Error" popups during the login phase to ensure a smooth onboarding experience.

<div style="text-align: center;">
<img src="C:/Users/Admin/.gemini/antigravity/brain/5b8329fb-3d2d-4681-bc7f-a926b1bce822/brd_login_screen_1778140957091.png" alt="Login Screen" width="300" style="border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);" />
</div>

---

### 2.2. Interactive Dashboard & Pull-to-Refresh
**Description:** The centralized hub for all business analytics, sales data, and expense tracking.
*   **Context-Aware Pull-to-Refresh:** Users can synchronize their local state with the Supabase Cloud by performing a native "swipe down" gesture.
*   **Scope Restriction:** This gesture is strictly bounded to the "Dashboard" tab to prevent accidental data reloads while compiling a cart or modifying settings in other tabs.
*   **Visual Feedback:** A vibrant, spinning loader provides immediate feedback that synchronization is in progress.

<div style="text-align: center;">
<img src="C:/Users/Admin/.gemini/antigravity/brain/5b8329fb-3d2d-4681-bc7f-a926b1bce822/brd_pull_refresh_1778140999378.png" alt="Pull to Refresh" width="300" style="border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);" />
</div>

---

### 2.3. Continuous Native Voice Recognition (Smart Cashier)
**Description:** The flagship feature of v2.0, completely overriding standard web limitations to provide an uninterrupted, hands-free billing experience.
*   **Continuous Listening Mode:** Unlike standard mobile voice inputs that cut off after one phrase, this custom-built bridge auto-restarts instantly on natural pauses, allowing the cashier to dictate entire multi-item orders, names, and phone numbers sequentially.
*   **Native Hardware Integration:** Built directly into `MainActivity.java` to bypass WebView restrictions, eliminating "Microphone Not Allowed" permissions bugs typical of Web Speech APIs.
*   **Automatic Start-up Permissions:** Requests hardware-level microphone access instantly upon app installation/launch to ensure a zero-click setup for the cashier.

<div style="text-align: center;">
<img src="C:/Users/Admin/.gemini/antigravity/brain/5b8329fb-3d2d-4681-bc7f-a926b1bce822/brd_voice_pos_1778140971556.png" alt="Voice POS Module" width="300" style="border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);" />
</div>

---

### 2.4. Native Hardware Navigation & Exit Security
**Description:** Integrating the Android OS hardware buttons with the POS interface to prevent accidental data loss.
*   **Hardware Back Button Interception:** Overrides the Android native back button (`onBackPressed()`) to communicate directly with the React frontend state.
*   **Smart Routing:** If the user is inside a sub-menu (e.g., Settings, Cart), pressing the hardware back button returns them safely to the Dashboard.
*   **Custom Exit Dialog:** If the user is on the Dashboard and presses back, a beautiful, non-intrusive native dialog asks for final exit confirmation, avoiding accidental app closures during peak billing hours.

<div style="text-align: center;">
<img src="C:/Users/Admin/.gemini/antigravity/brain/5b8329fb-3d2d-4681-bc7f-a926b1bce822/brd_exit_dialog_1778141017891.png" alt="Exit Dialog" width="300" style="border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);" />
</div>

---

## 3. Technology Stack Summary
*   **Frontend Environment:** React, Next.js, Tailwind CSS.
*   **Mobile Wrapper:** Capacitor v8 (Android Native Java Bridge).
*   **Cloud Architecture:** Supabase (PostgreSQL).
*   **Key Native Implementations:** 
    *   `JavascriptInterface` injection for continuous SpeechRecognizer tracking.
    *   `ActivityCompat` for robust runtime hardware permissions.

## 4. Conclusion
The Cloud POS v2.0 implementation transitions the platform from a responsive web application to a truly native-feeling mobile experience. The bespoke continuous voice integration and hardware button intercepts ensure that operators experience zero friction, allowing for hyper-efficient order processing.
