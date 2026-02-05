<img width="1024" height="1024" alt="image" src="https://github.com/user-attachments/assets/28a2dc43-dd57-43c0-8842-8d846e6ecc42" />

# 🚀 TalentMatch Pro: Nexus Edition

### **The Professional PWA Marketplace for Elite Talent & Project Managers**

TalentMatch Pro is a high-performance, real-time Progressive Web App (PWA) that connects skilled Seekers with visionary Project Managers. Built with a "Mobile-First" philosophy and a "Zero-Latency" mindset, this project serves as a cornerstone for the **Project Nexus** portfolio.

## 💎 Project Nexus: Technical Excellence

To meet the rigorous standards of Project Nexus, this application goes beyond basic CRUD operations:

* **Full TypeScript Implementation:** End-to-end type safety ensures a maintainable, self-documenting codebase.
* **PWA Standalone Experience:** Fully installable on mobile with offline caching and custom splash screens.
* **Real-Time Engine:** Live messaging and notifications using Supabase Broadcast and Presence.
* **Advanced Security:** Row Level Security (RLS) policies protect every transaction at the database level.

## ✨ Features Breakdown

### 🔐 Authentication & Security

* **Role-Based Access Control (RBAC):** Users register as either a `SEEKER` or a `MANAGER`, unlocking tailored dashboard experiences.
* **Secure Auth Flow:** Integrated login, registration, and a functional **Forgot Password** recovery system.
* **Protected Routes:** Automatic redirection based on authentication state and user profile status.

### 🔍 The Seeker Experience (Discovery to Hire)

* **Project Discovery:** A high-speed marketplace to browse active projects with **Real-time Filters** (Budget, Category, Location).
* **Application Lifecycle:** One-click applications with status tracking (Pending, Accepted, Declined).
* **Saved Jobs:** A personalized watchlist for project tracking.
* **Connection System:** Mutual "Handshakes" that initiate secure, private communication channels.

### 💼 The Manager Experience (Talent Management)

* **Project Studio:** Comprehensive tools to create, edit, and manage professional job postings.
* **Applicant Slide-Over:** An intuitive UI to review candidate bios, skills, and portfolios without losing context.
* **Direct Invitations:** Search the global Seeker pool and send real-time project invites to top-tier talent.

### 💬 Professional Messaging Suite

* **Optimistic UI:** Local state updates ensure that messages and **Emoji Reactions** appear instantly.
* **Typing Indicators:** Real-time feedback showing when the other person is composing a message.
* **Notification System:** A global `NotificationBell` that tracks unread messages and new invitations across the entire app.

### 👤 Profile & Personalization

* **Cloud Storage Integration:** Profile picture uploads and avatar management using Supabase Storage buckets.
* **Dynamic Profiles:** Update bios, full names, and professional roles with instant synchronization across the platform.

---

## 🛠 Tech Stack & Tools

| Layer | Technology | Purpose |
| --- | --- | --- |
| **Frontend** | **React 18 + Vite** | High-performance UI and lightning-fast builds. |
| **Language** | **TypeScript** | Strict type-safety and reduced runtime errors. |
| **Styling** | **Tailwind CSS** | Modern, responsive, utility-first design. |
| **BaaS** | **Supabase** | Auth, PostgreSQL, Real-time sync, and S3 Storage. |
| **PWA** | **Vite-PWA** | Service workers, manifest management, and offline support. |

---

## 📈 Architecture & Best Practices

### **1. Real-time Synchronization**

The app uses a "Single Source of Truth" strategy. By subscribing to PostgreSQL changes, the UI updates automatically across all devices whenever a database record changes.

### **2. Component-Driven Design**

The UI is broken into modular, reusable components (Sidebar, MessageContainer, ProfileCard), ensuring the code is easy to test and scale.

### **3. Performance Optimization**

* **Stale-While-Revalidate:** API calls are cached for instant loading while updating in the background.
* **Lazy Loading:** Critical assets are prioritized for the PWA experience.

---

## 🚀 Installation & Deployment

1. **Clone the Repository:**
```bash
git clone https://github.com/YOUR_USERNAME/talentmatch.git

```
2. **Install Dependencies:**
```bash
npm install

```
3. **Environment Configuration:**
Create a `.env` file with your Supabase credentials:
```env
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key

```
4. **Deploy:**
Built for seamless deployment on **Vercel** or **Netlify**.

---

## 📝 Development Journey (Project Nexus)

> "Transitioning TalentMatch from a traditional architecture to a Real-time PWA was a journey in mastering asynchronous state. By leveraging TypeScript's strict interfaces and Supabase's real-time broadcasts, I built a system that prioritizes user speed and data integrity."
