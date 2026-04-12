# QuickBike Development Status & Roadmap

This document outlines the precise technical state of the QuickBike ride-hailing platform. It details all the features that have a strong, working foundation, alongside a roadmap of missing features, incomplete UI stubs, and pending backend loops.

---

## 🟢 Fully Working Features (The Strong Foundation)

### 1. Dynamic Matchmaking & Sockets
* **Geographic Sweeping:** The `$geoNear` MongoDB algorithm correctly locates active drivers in a radius.
* **Instant State Transitions:** Socket.io securely and flawlessly manages ride states (pending → accepted → arriving → ongoing → completed).
* **Robust Ghost Sweeping:** Wipes stale Socket IDs on server boot to prevent matchmaking crashes.

### 2. Pricing & Promotions
* **Dynamic Fare Calculator:** Pulls exact Google Distance Matrix metrics and computes base rates, per-km rates, and per-minute durations.
* **Smart Adjustments:** Automatically enforces 20% night surcharges (11 PM - 5 AM), demand surge multipliers, and precise promo code discounts.
* **Minimum Thresholds:** Fares are smartly checked against minimum vehicle limits and rounded to the easiest INR denomination (nearest ₹5).

### 3. Anti-Hack & Security Architecture
* **API Hardening:** 100-request rate limits, strict Socket-spam blocking, `helmet` security headers, and JWT-authenticated cookies.
* **Brute-Force Lockouts:** Automatic 30-minute account bans after 5 failed password attempts.

### 4. Admin Management Foundation
* **Captain Verification:** Administrative ability to review KYC documents, manually approve/reject them, and securely admit fresh drivers immediately onto the streets.
* **Paginated Ride History Dashboard:** Fully active frontend paginations logic sorting historical logs.

---

## 🔴 Missing, Broken, or Pending Features (To-Do Gaps)

### 1. Captain's Ride History UI (`/captain-rides`)
* **Status:** The backend fully supports paginated trip history and stats for captains. However, the frontend route for the driver to actually view their past jobs is completely missing from `App.jsx`. They only have a stubbed dashboard right now.

### 2. Ride Dispatch Retry Loop & Auto-Cancel
* **Status:** If a user books a ride and all nearby captains ignore the notification, the system does *not* auto-fail, expand the radius, or try again. The rider sits on the "Looking for captains" screen indefinitely. Needs a background retry/auto-cancel job implementation.

### 3. Payment Methods & Wallet UIs
* **Status:** On the `UserAccount` screen, the "Payment Methods (Cash / UPI / Cards)" button is a dead UI stub with no `onClick` handler. Razorpay checkout flows are entirely missing for capturing card/UPI logic.

### 4. Captain Payout & Settlement System
* **Status:** The system flawlessly tracks how much money the captain earns daily/weekly, but there is no feature for the captain to click "Withdraw to Bank" and clear their balance securely via bank transfer APIs.

### 5. Help & Support Screens
* **Status:** Dead button stub on profile pages. Needs fully functional frontend and admin ticket queues to resolve lost-items, app bugs, and fare disputes.

### 6. Captain Reviews Viewer
* **Status:** Riders securely submit 1-5 star ratings directly onto the Captain's database record at the end of rides. But the Captain has no frontend widget or sub-menu to actually read those raw feedback comments.

### 7. Forgot Password / Magic Link Recovery
* **Status:** There are no SMS OTP or email recovery flows deployed for traditional logins. If a user or captain forgets their password, they are entirely locked out.

### 8. Push Notifications (Offline Drivers)
* **Status:** Sockets handle "active app" background logic, but we need Firebase Cloud Messaging (FCM) properly woven in to forcefully wake up offline captains when a new trip falls in their zone.
