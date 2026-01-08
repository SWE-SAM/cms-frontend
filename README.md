## Setup Guide (Setup & Run)

This project is a **Complaint Management System** built with **Remix, React, Firebase Authentication, and Firestore**.

### Prerequisites

Make sure you have the following installed:

* **Node.js** (v18 or later recommended)
[https://nodejs.org/](https://nodejs.org/) v18 recommended
* **npm** (comes with Node)
* A **Firebase account**
[https://console.firebase.google.com/](https://console.firebase.google.com/)

Verify installation:

```bash
node -v
npm -v

```

---

## Installation

1. **Clone the repository**

```bash
git clone https://github.com/SWE-SAM/cms-frontend
cd your-repo-name

```

2. **Install dependencies**

```bash
npm install

```

---

## Firebase Setup

### 1. Create a Firebase project

* Go to **Firebase Console**
* Create a new project
* Enable:
* **Authentication -> Email/Password**
* **Cloud Firestore**



---

### 2. Create a Web App in Firebase

* Project Settings -> General -> Add app -> Web
* Copy the Firebase config values

---

### 3. Environment Variables

Create a `.env` file in the project root:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

```

> Warning: Do **not** commit `.env` to GitHub.

---

### 4. Firestore Data Structure

Create the following collections:

#### users

```json
{
  "email": "user@email.com",
  "role": "admin | manager | companyManager | employee | user",
  "companyId": "string (e.g., natwest)",
  "createdAt": "timestamp"
}

```

#### complaints

```json
{
  "subject": "Complaint title",
  "description": "Complaint description",
  "status": "OPEN | IN_PROGRESS | RESOLVED",
  "companyId": "string (tenant identifier)",
  "createdByUid": "user_uid",
  "createdByEmail": "user@email.com",
  "assignedToUid": "employee_uid (optional)",
  "employeeComment": "string",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}

```

---

### 5. Firestore Security Rules

Deploy the following rules to ensure multi-tenant isolation:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function signedIn() {
      return request.auth != null;
    }

    function userDoc() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }

    function role() {
      return signedIn() ? userDoc().role : null;
    }

    function userCompany() {
      return signedIn() ? userDoc().companyId : null;
    }

    function isAdminOrManager() {
      return role() == "admin" || role() == "manager";
    }

    match /users/{uid} {
      allow read: if signedIn() && (request.auth.uid == uid || isAdminOrManager());
      allow create, update: if signedIn()
        && request.auth.uid == uid
        && !("role" in request.resource.data);
    }

    match /complaints/{complaintId} {
      allow create: if signedIn()
        && request.resource.data.createdByUid == request.auth.uid;

      allow read: if isAdminOrManager()
        || (role() == "companyManager" && resource.data.companyId == userCompany())
        || resource.data.createdByUid == request.auth.uid
        || resource.data.assignedToUid == request.auth.uid;

      allow update: if isAdminOrManager()
        || (role() == "companyManager" && resource.data.companyId == userCompany())
        || resource.data.createdByUid == request.auth.uid
        || (
          resource.data.assignedToUid == request.auth.uid
          && request.resource.data.diff(resource.data).changedKeys()
            .hasOnly(["status", "employeeComment", "updatedAt"])
        );

      allow delete: if isAdminOrManager()
        || (role() == "companyManager" && resource.data.companyId == userCompany())
        || resource.data.createdByUid == request.auth.uid;
    }
  }
}

```

---

## Running the Application

Start the development server:

```bash
npm run dev

```

The app will be available at:

```
http://localhost:3000

```

---

## Default Roles & Access

| Role | Permissions |
| --- | --- |
| User | Create & view own complaints |
| Employee | View assigned complaints, update status/comments |
| Company Manager | Manage all complaints within their specific companyId |
| Manager | View all, assign, edit, delete complaints globally |
| Admin | Full system access (including Firebase) |

> Roles are stored in `users/{uid}.role`

---

## Test Users

Admin: firstuser@user.org.uk

Password: firstuser

User: izi@ko.com

Password: iziko1

Employee: rytis@lol.org.uk

Password: rytis1

companyManager : qwertmus@Moo.com

Password: qwertmus1
---

## Tech Stack

* Remix
* React
* Material UI
* Firebase Authentication
* Cloud Firestore

Sam Tran

-
