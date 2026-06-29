# Enderass Auction Management System — Client Status Report

**Prepared for:** Enderass National PLC  
**Date:** June 2026  
**Purpose:** A simple overview of what the system can do today, what is still in progress, and what is planned next.

---

## What this system is

The Enderass Auction Management System is a **web-based platform** that helps Enderass run auctions online — from the moment someone registers, through checking their identity, listing assets, running the auction, collecting payments, and choosing a winner.

It is designed for:

- **Bidders** — people and organizations who want to take part in auctions  
- **Asset owners** — people who want to sell property, vehicles, land, machinery, and similar items through Enderass  
- **Enderass staff** — administrators, auction managers, evaluation officers, finance staff, and customer service staff  

The system is available in **English and Amharic**.

---

## How an auction works in the system (step by step)

Here is the full journey the system supports:

### Step 1 — Join the platform
A new user creates an account with a mobile number and password, then confirms their number with a one-time code (OTP).

### Step 2 — Identity verification (KYC)
The user uploads identification documents (for individuals or organizations). Enderass staff review the documents and either **approve** or **reject** the account. Only approved users can fully participate in auctions.

### Step 3 — Submit an asset for auction
An asset owner describes what they want to sell and uploads ownership documents and photos. Staff review the submission and approve or reject it. When approved, the system can automatically prepare an auction for that asset.

### Step 4 — Physical evaluation
An evaluation officer can schedule an inspection, record a valuation, upload photos, and recommend whether the asset is ready for auction.

### Step 5 — Run the auction
Auction managers create and manage auctions — set dates, reserve price, document fees, and publish them so bidders can see them. Auctions can be suspended, reactivated, or closed. **Auctions also close automatically** when the end date and time are reached.

### Step 6 — Bidder participation
Before bidding, a bidder must:

1. Pay the auction document fee (upload proof of payment for staff to verify)  
2. Upload a Certificate of Participation (CPO) and get staff approval  
3. Place their bid before the auction closes  

Each bidder can place **one bid per auction**, and bids cannot be changed after submission.

### Step 7 — Choose the winner
When the auction closes, the system identifies the **highest valid bid** (and respects the reserve price). Staff can confirm the winner, handle a decline, or select the next bidder if needed. The winner is recorded and notified inside the system.

---

## What has been completed

The following major parts of the system are **built and working** on the web application:

### For everyone
- User registration and login  
- Mobile number verification (OTP)  
- Profile and account status tracking  
- English and Amharic interface  

### For bidders and asset owners
- Submit and track KYC documents  
- Submit auction requests (assets) with photos and documents  
- Browse published auctions  
- Pay document fees (manual payment with receipt upload)  
- Submit and track CPO documents  
- Place bids on auctions  
- View own bids and payments  
- Receive **in-app notifications** (inside the website)  

### For Enderass staff
- **KYC management** — review, approve, reject, and mark applications under review  
- **Asset request management** — approve or reject owner submissions  
- **Evaluation management** — schedule, complete, approve, or reject evaluations  
- **Auction management** — create, publish, suspend, close, and auto-close auctions  
- **Payment verification** — finance staff approve or reject uploaded receipts  
- **CPO review** — approve or reject participation certificates  
- **Bid oversight** — staff can view bids placed on auctions  
- **Winner management** — select, confirm, decline, or replace winners  
- **User management** — manage external users (bidders and asset owners)  
- **Staff management** — create staff accounts, assign roles, activate or deactivate staff  
- **Role permissions** — super administrators can control what each staff role is allowed to do (view, create, update, approve, etc.) per area of the system  
- **Dashboards and reports** — summary numbers for different staff roles; reports can be exported to spreadsheet (CSV)  
- **Audit trail** — important actions are logged for accountability  
- **System settings** — basic configuration (languages, currency, fees, etc.)  

### Security and control
- Passwords are stored securely (not as plain text)  
- Each staff role only sees and does what they are permitted to do  
- Staff must be active and verified before using the system  
- Only KYC-approved users can bid and take part in auctions  
- Payments and CPO must be approved before bidding is allowed  

---

## What is partly done

These features exist but are **not yet complete** to the full original specification:

| Area | What works today | What is still missing |
|------|------------------|----------------------|
| **Payments** | Staff can verify manually uploaded receipts | Online payment through **Addis Pay** is not connected yet |
| **Notifications** | Users see alerts inside the website | **SMS** and **email** notifications are not connected yet |
| **OTP codes** | Verification works in the system | Codes are not yet sent by real SMS in production |
| **Auction documents** | Documents can be attached to auctions | A dedicated “documents” section and download tracking are not finished |
| **Reports** | Dashboards and CSV export | Export to **PDF** and **Excel** is not available yet |
| **Settings screen** | Language settings can be managed | Not all system settings have a user-friendly screen yet |
| **Role management page** | Permissions can be edited from staff profiles | A separate full “roles” admin page is not built yet (audit history is shown there instead) |

---

## What has not been started

These items were in the original requirements but are **not built yet**:

1. **Android mobile app**  
2. **iPhone (iOS) mobile app**  
3. **Addis Pay** — automatic online payments  
4. **SMS gateway** — send OTP and alerts by text message  
5. **Email notifications**  
6. **Password reset** — “forgot password” flow using OTP  

---

## Who uses the system and what they can do

| User type | Main responsibilities in the system |
|-----------|-------------------------------------|
| **Super Administrator** | Full access; manages staff, roles, and permissions |
| **Auction Manager** | Creates and runs auctions, manages bids and winners |
| **Evaluation Officer** | Inspects and values assets before auction |
| **Finance Officer** | Verifies document fee payments |
| **Customer Service Officer** | Handles users, KYC, and asset requests |
| **Bidder** | Registers, gets verified, pays fees, submits CPO, places bids |
| **Asset Owner** | Submits assets for auction through the platform |

Staff members are given a **role**, and that role controls which menus and actions they see. When permissions are updated, affected staff should refresh the page or sign in again so their screen matches their new access.

---

## Business rules the system follows

The system enforces the main auction rules agreed in the requirements:

- Only **approved (KYC-cleared)** users can participate  
- **Document payment** must be verified before document access  
- **CPO** must be approved before bidding  
- Bids are **not accepted after** the auction closes  
- The **highest valid bid** wins, if it meets the **reserve price**  
- If two bids are equal, the **earlier submission** wins  
- If the winner declines, staff can select the **next highest bidder**  

---

## Overall progress (simple summary)

| Category | Progress |
|----------|----------|
| **Web application — core auction process** | Largely complete |
| **Staff tools and access control** | Largely complete |
| **Online payments (Addis Pay)** | Not started |
| **SMS and email** | Not started |
| **Mobile apps** | Not started |
| **Advanced reporting (PDF/Excel)** | Not started |

**In plain terms:** The **main web-based auction workflow** — from registration to winner selection — is in place and usable. What remains for a full “production-ready” launch aligned with the original specification is mainly **mobile apps**, **Addis Pay**, and **SMS/email communication**.

---

## Recommended next steps

### Priority 1 — Ready for real users on the web
- Connect **SMS** for OTP and important alerts  
- Add **password reset**  
- Connect **Addis Pay** for online document fee payments  
- Final testing of the full auction journey with real staff roles  

### Priority 2 — Complete the specification
- Finish the **auction documents** area and download tracking  
- Add **PDF/Excel** report export  
- Improve the **settings** and **roles** admin screens  

### Priority 3 — Mobile
- Build **Android** and **iOS** apps using the same backend  

---

## How to try the system today

Test accounts can be provided for demonstration. Typical test access:

- **Administrator:** mobile `0912345678`, password `pass1`  
- **Bidder:** mobile `0987654321`, password `pass2`  

The website runs in a browser during development. Staff and bidders use the same platform but see different menus based on their role.

---

## Closing note

Enderass now has a **working digital foundation** for managing auctions online: user onboarding, compliance checks, asset intake, evaluation, auction operations, payments and CPO verification, bidding, and winner selection — all with staff oversight and permission controls.

The next phase of work focuses on **connecting external services** (payments and messaging), **polishing** document and reporting features, and **extending** access to mobile devices — so the experience matches the full vision in the original requirements document.

---

*For technical details, see `IMPLEMENTATION-AND-SRS-COMPARISON-REPORT.md` in the same folder.*
