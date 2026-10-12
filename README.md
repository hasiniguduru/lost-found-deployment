# Campus Lost & Found Application

A full-stack **Campus Lost & Found** web application featuring role-based access control (**Owner**, **Finder**, **Campus Security / Admin**), JWT authentication, item photo uploads, fixed campus collection desk management, ownership verification claims, and real-time pickup notifications.

---

## 1. Technology Stack

### Frontend
- **Framework**: React 19 + Vite
- **Routing**: React Router v7 (`react-router-dom`)
- **HTTP Client**: Axios (`axios`) with automated `Authorization: Bearer <JWT>` request interceptors
- **Styling**: Responsive CSS / Tailwind CSS v4 + Lucide Icons

### Backend
- **Framework**: Java 21 + Spring Boot 3.3.4 (Maven)
- **Security**: Spring Security 6 + Stateless JWT Authentication (`jjwt`)
- **Validation**: Jakarta Bean Validation (`@NotBlank`, `@Email`, `@Size`, `@Pattern`, `@NotNull`)
- **Database**: MySQL 8.0 (`spring-boot-starter-data-jpa`, `mysql-connector-j`)
- **Full-Stack Preview Server**: Express + TypeScript (`server.ts`) mirroring all `/api/v1/*` endpoints for instant local/cloud preview execution

---

## 2. Core Features & User Roles

1. **User Roles & JWT Authentication (`OWNER`, `FINDER`, `ADMIN_SECURITY`)**
   - **Owner (Student / Faculty)**: Report lost items with photos, search the campus registry, submit ownership verification claims, and receive Pickup Pass Codes (`PKP-...`).
   - **Finder (Campus Reporter)**: Report found items with photos, select a fixed Campus Security Collection Desk for drop-off, and receive a Submission Receipt Code (`SUB-...`).
   - **Admin / Campus Security**: Manage the 4 fixed Campus Collection Desks, log physical locker bin intake, verify or decline ownership claims, issue Pickup Pass Codes, and confirm physical item handovers.

2. **Reporting Lost & Found Items (with Image Upload)**
   - Upload item photos from your device (drag-and-drop or file browser) or choose from sample campus item photos.
   - Enforces field validation for item title, category, campus building/zone, specific location, date/time, description, and an ownership verification challenge question.

3. **Fixed Collection of Lost Items & Submission of Found Items**
   - Directory of 4 staffed Campus Security Collection Desks:
     - *Central Library Security Desk (Bldg A)*
     - *Student Union Custody Office (Bldg C)*
     - *Engineering Hall North Desk (Bldg E)*
     - *Athletics Complex Main Gate (West Quad)*
   - Tracks locker bin occupancy, duty officers, operating hours, and items currently stored at each desk.

4. **Search & Multi-Filter Registry**
   - Filter items by type (`Lost`, `Found`), category (`Electronics`, `Campus ID & Keys`, `Textbooks & Lab Gear`, `Apparel & Bags`, `Personal Accessories`), campus zone, collection desk, status, or keyword/tracking code.

5. **Ownership Verification & Notifications**
   - Claimants answer the item's verification question and provide supporting proof.
   - Security officers review answers against expected hints, approve claims to generate a **Pickup Pass Code**, and trigger instant notifications.

---

## 3. Project Structure

```text
├── index.html                  # HTML entry point
├── package.json                # Frontend & full-stack dependencies and scripts
├── vite.config.ts              # Vite bundler configuration
├── tsconfig.json               # TypeScript configuration
├── server.ts                   # Live REST API server (/api/v1/*)
├── src/
│   ├── main.tsx                # React DOM root
│   ├── App.tsx                 # React Router configuration & protected routes
│   ├── index.css               # Global responsive CSS & typography rules
│   ├── context/
│   │   └── AuthContext.tsx     # JWT session state, role switching & notifications
│   ├── services/
│   │   └── api.ts              # Axios client & typed API endpoints
│   ├── components/
│   │   ├── WorkspaceLayout.tsx # Sidebar, header & navigation layout
│   │   ├── ClaimSubmissionModal.tsx
│   │   └── ResilientImage.tsx  # Image component with fallback protection
│   └── pages/
│       ├── AuthPage.tsx        # Login & Sign-Up page
│       ├── DashboardPage.tsx   # Overview, metrics & recent items
│       ├── ItemRegistryPage.tsx# Search & multi-filter item directory
│       ├── ReportItemPage.tsx  # Report Lost / Found item with photo upload
│       ├── CollectionHubsPage.tsx # Fixed Campus Collection Desks & checkout
│       ├── ClaimsVerificationPage.tsx # Ownership claim review console
│       └── NotificationsPage.tsx # Alerts & pickup pass notifications
└── spring-boot-backend/        # Java 21 Spring Boot 3 + Maven + MySQL Backend
    ├── pom.xml
    └── src/main/
        ├── java/edu/campus/lostfound/
        │   ├── controller/ItemReportController.java
        │   ├── dto/ItemReportRequest.java
        │   └── security/SecurityConfig.java
        └── resources/
            ├── application.properties
            └── schema.sql
```

---

## 4. How to Run the Application

### Option A: Run Full-Stack Project (Frontend + Built-in API Server)
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server on `http://localhost:3000`:
   ```bash
   npm run dev
   ```

### Option B: Run Java Spring Boot + MySQL Backend (`spring-boot-backend/`)
1. Ensure **Java 21**, **Maven 3.9+**, and **MySQL 8.0** are installed.
2. Initialize the MySQL database using the included schema script:
   ```bash
   mysql -u root -p < spring-boot-backend/src/main/resources/schema.sql
   ```
3. Update your MySQL username and password in `spring-boot-backend/src/main/resources/application.properties`:
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/campus_lost_found_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
   spring.datasource.username=root
   spring.datasource.password=your_mysql_password
   ```
4. Build and run with Maven:
   ```bash
   cd spring-boot-backend
   mvn clean spring-boot:run
   ```

---

## 5. REST API Endpoints (`/api/v1`)

| Method | Endpoint | Roles Allowed | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Public | Authenticate user and return signed JWT token |
| `POST` | `/api/v1/auth/register` | Public | Register a new campus account with Bean Validation |
| `GET` | `/api/v1/auth/me` | Authenticated | Retrieve current logged-in user profile |
| `GET` | `/api/v1/dashboard` | Authenticated | Fetch summary metrics, recent items, and hub counts |
| `GET` | `/api/v1/items` | Authenticated | Search and filter lost/found items |
| `POST` | `/api/v1/items` | `OWNER`, `FINDER`, `ADMIN_SECURITY` | Create a lost or found item report (with photo & receipt) |
| `PATCH` | `/api/v1/items/:id/custody-intake` | `FINDER`, `ADMIN_SECURITY` | Log physical item drop-off into a Collection Desk locker |
| `GET` | `/api/v1/claims` | Authenticated | List ownership verification claims |
| `POST` | `/api/v1/claims` | `OWNER`, `FINDER`, `ADMIN_SECURITY` | Submit an ownership verification claim |
| `PATCH` | `/api/v1/claims/:id/verify` | `ADMIN_SECURITY`, `FINDER` | Approve or decline claim & issue Pickup Pass (`PKP-...`) |
| `PATCH` | `/api/v1/claims/:id/handover` | `ADMIN_SECURITY` | Confirm physical collection handover at desk |
| `GET` | `/api/v1/hubs` | Authenticated | List all 4 fixed Campus Security Collection Desks |
| `GET` | `/api/v1/notifications` | Authenticated | List user notifications and pickup alerts |

---

## 6. Default Demo Accounts

You can use the **One-Click Role Buttons** on the Login Page (`Owner`, `Finder`, `Security`) or sign in manually:

| Role | Name | Email | Password | Campus ID |
| :--- | :--- | :--- | :--- | :--- |
| **Owner** | Maya Lin | `maya.lin@campus.edu` | `Campus2026!` | `STU-2026-4819` |
| **Finder** | Liam Vance | `liam.vance@campus.edu` | `Campus2026!` | `STU-2026-9104` |
| **Campus Security** | Sgt. Marcus Thorne | `sec.thorne@campus.edu` | `Security2026!` | `SEC-0104` |
