
# TalentMatch

**TalentMatch** is a modern freelance and job marketplace connecting skilled candidates with time-constrained hiring managers. It leverages lightweight AI for smart matching, fast applications, and transparent workflows—without adding unnecessary complexity.
## Table of Contents
* [Features](#features)
* [Target Users](#target-users)
* [Tech Stack](#tech-stack)
* [Project Structure](#project-structure)
* [Getting Started](#getting-started)
* [API Endpoints](#api-endpoints)
* [Future Improvements](#future-improvements)

## Features

### For Candidates

* Quick registration & profile setup
* CV upload & one-click applications
* Browse jobs with filtering by budget, location, or remote
* AI-powered match scores to evaluate fit
* Track application status in real time
* Chatbot support for FAQs & application guidance

### For Hiring Managers

* Post jobs with skill tags & budgets
* AI-assisted applicant ranking
* One dashboard to review candidates with summaries
* Update candidate status & manage payments
* Contract and milestone management
* Messaging & notification system

## Target Users

**Growth-Focused Candidate**

* Tech/knowledge professionals seeking quality opportunities
* Needs clarity on salary, skills, and remote/onsite expectations

**Time-Constrained Hiring Manager**

* Founders, team leads, or department heads managing hiring
* Needs quick access to relevant applicants and clear payment setup


## Tech Stack

* **Frontend:** React, Vite, TypeScript, NativeWindCSS (or Tailwind)
* **Backend:** Django REST API (already built)
* **Authentication:** JWT
* **Database:** PostgreSQL
* **Cache & Async Tasks:** Redis + Celery
* **AI Matching:** RapidAPI integration
* **Deployment:** Docker / Render / Vercel for frontend

## Project Structure

```
TalentMatch/
├── frontend/               # React/Vite app
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/       # API calls
│       ├── hooks/
│       ├── context/
│       └── App.tsx
├── backend/                # Provided Django API
└── README.md
```

## Getting Started

1. **Clone Repo**

```bash
git clone https://github.com/your-username/TalentMatch.git
cd TalentMatch
```

2. **Frontend Setup**

```bash
cd frontend
npm install
npm run dev
```

3. **Backend API**

* Base URL (local): `http://localhost:8000/`

4. **Environment Variables**
   Create `.env` in `frontend` with:

```
VITE_API_BASE_URL=http://localhost:8000/api
```

---

## API Endpoints

# TalentMatch API Endpoints

## **Authentication (JWT)**

| Method | Endpoint                            | Description                         |
| ------ | ----------------------------------- | ----------------------------------- |
| POST   | `/api/auth/register/`               | Register a new user                 |
| POST   | `/api/auth/login/`                  | Login and get access/refresh tokens |
| POST   | `/api/auth/refresh/`                | Refresh JWT token                   |
| POST   | `/api/auth/logout/`                 | Logout user                         |
| POST   | `/api/auth/verify-email/`           | Verify email after registration     |
| POST   | `/api/auth/password-reset/`         | Request password reset              |
| POST   | `/api/auth/password-reset/confirm/` | Confirm new password                |


## **Users**

| Method | Endpoint                | Description                     |
| ------ | ----------------------- | ------------------------------- |
| GET    | `/api/users/me/`        | Get current user profile        |
| GET    | `/api/users/{id}/`      | Get any user by ID              |
| PATCH  | `/api/users/me/`        | Update current user profile     |
| POST   | `/api/users/me/avatar/` | Upload or update profile avatar |


## **Freelancers**

| Method | Endpoint                                   | Description               |
| ------ | ------------------------------------------ | ------------------------- |
| GET    | `/api/freelancers/`                        | List all freelancers      |
| GET    | `/api/freelancers/{id}/`                   | Get freelancer detail     |
| PATCH  | `/api/freelancers/{id}/`                   | Update freelancer profile |
| POST   | `/api/freelancers/{id}/skills/`            | Add skills                |
| DELETE | `/api/freelancers/{id}/skills/{skill_id}/` | Remove a skill            |
| CRUD   | `/api/freelancers/{id}/portfolio/`         | Manage portfolio items    |
| GET    | `/api/freelancers/{id}/reviews/`           | List freelancer reviews   |


## **Projects**

| Method | Endpoint                        | Description                                              |
| ------ | ------------------------------- | -------------------------------------------------------- |
| GET    | `/api/projects/`                | List all projects (supports filters, search, pagination) |
| POST   | `/api/projects/`                | Create a new project                                     |
| GET    | `/api/projects/{id}/`           | Get project details                                      |
| PATCH  | `/api/projects/{id}/`           | Update project                                           |
| DELETE | `/api/projects/{id}/`           | Delete project                                           |
| GET    | `/api/projects/{id}/proposals/` | List proposals for a project                             |
| POST   | `/api/projects/{id}/save/`      | Save a project                                           |
| POST   | `/api/projects/{id}/unsave/`    | Unsave a project                                         |


## **Proposals**

| Method | Endpoint                      | Description        |
| ------ | ----------------------------- | ------------------ |
| POST   | `/api/proposals/`             | Submit a proposal  |
| GET    | `/api/proposals/`             | List all proposals |
| GET    | `/api/proposals/{id}/`        | Proposal detail    |
| PATCH  | `/api/proposals/{id}/`        | Update proposal    |
| DELETE | `/api/proposals/{id}/`        | Delete proposal    |
| POST   | `/api/proposals/{id}/accept/` | Accept proposal    |
| POST   | `/api/proposals/{id}/reject/` | Reject proposal    |

## **Contracts**

| Method | Endpoint                               | Description            |
| ------ | -------------------------------------- | ---------------------- |
| GET    | `/api/contracts/`                      | List contracts         |
| GET    | `/api/contracts/{id}/`                 | Contract detail        |
| PATCH  | `/api/contracts/{id}/complete/`        | Mark contract complete |
| POST   | `/api/contracts/{id}/release-payment/` | Release payment        |
| POST   | `/api/contracts/{id}/dispute/`         | Dispute contract       |

## **Reviews**

| Method | Endpoint             | Description     |
| ------ | -------------------- | --------------- |
| POST   | `/api/reviews/`      | Submit a review |
| GET    | `/api/reviews/`      | List reviews    |
| GET    | `/api/reviews/{id}/` | Review detail   |


## **Messaging**

| Method | Endpoint                                                        | Description                   |
| ------ | --------------------------------------------------------------- | ----------------------------- |
| GET    | `/api/messaging/conversations/`                                 | List conversations            |
| GET    | `/api/messaging/conversations/{id}/messages/`                   | List messages in conversation |
| POST   | `/api/messaging/conversations/{id}/messages/`                   | Send message                  |
| PATCH  | `/api/messaging/conversations/{id}/messages/{message_id}/read/` | Mark as read                  |


## **Notifications**

| Method | Endpoint                            | Description                      |
| ------ | ----------------------------------- | -------------------------------- |
| GET    | `/api/notifications/`               | List notifications               |
| PATCH  | `/api/notifications/{id}/read/`     | Mark single notification as read |
| PATCH  | `/api/notifications/mark-all-read/` | Mark all notifications as read   |
| DELETE | `/api/notifications/{id}/`          | Delete notification              |


## **AI Matching**

| Method | Endpoint                                       | Description                         |
| ------ | ---------------------------------------------- | ----------------------------------- |
| GET    | `/api/ai-matching/freelancer-recommendations/` | Recommend freelancers for a project |
| GET    | `/api/ai-matching/project-recommendations/`    | Recommend projects for a freelancer |
| GET    | `/api/ai-matching/personalized/`               | Personalized AI recommendations     |

## Future Improvements

* Payments integration & milestone tracking
* Real-time chat for contracts
* Advanced AI matching with personalized recommendations
* Admin dashboard for platform analytics


