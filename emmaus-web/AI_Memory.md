# AI Project Memory & Tracking

**Project:** Emmaüs Connect Web App
**Architecture:** React + Vite + Tailwind CSS + Supabase (Clean Architecture)
**Last Update:** 29 July 2026

## Current Status
- **Phase 1:** Project Setup & Core Layout — ✅ Complete.
- **Phase 2:** Database Architecture & Auth UI — ✅ Complete.
- **Phase 3:** Authentication, Protected Routes & Compagnons CRUD — ✅ Complete.
- **Phase 3b:** Compagnons UI Finalization (Form + Role integration) — ✅ Complete.
- **Phase 3c:** Detailed Companion Profile View & Schema Expansion — ✅ Complete.
- **Phase 4:** Sidebar Placeholder Pages & Routing Setup — ✅ Complete.
- **Phase 5:** Massive Consolidation Update — ✅ Complete.
- **Phase 5b:** Vacations RBAC Approval Workflow — ✅ Complete.
- **Phase 5c:** Companion Avatar (Supabase Storage) & Profession Integration — ✅ Complete.
- **Phase 6:** React Focus Fix, Date Pickers Standardization & Health (Santé) Module Initialization — ✅ Complete.
- **Phase 6b:** Health Module Interactive CRUD Controls (Medical Record & Consultations) — ✅ Complete.
- **Phase 7:** Rendez-vous (Appointments) Module Initialization & Interactive UI — ✅ Complete.
- **Phase 8:** User Vacation Enhancements & Settings Profile Separation — ✅ Complete.
- **Phase 13:** Dashboard Badge Removal & Global Responsiveness Audit — ✅ Complete.
- **Phase 14:** Dynamic Sidebar Notification Badges — ✅ Complete.
- **Phase 15:** Batch Improvements (Crash Fix, Sidebar, RBAC, Vacation Counter, Notifications, Join Date) — ✅ Complete.
- **Current Task:** _No active task — awaiting next instruction._

## Completed Tasks
- [x] Initialized Vite + React project.
- [x] Installed dependencies (Tailwind, Supabase, React Router, Lucide React).
- [x] Fixed Tailwind v4 configuration (`@tailwindcss/postcss`, `@theme` block in CSS, `tailwind.config.js` custom colors).
- [x] Established Clean Architecture folder structure inside `src/`.
- [x] Cleaned up default `App.jsx` and removed Vite boilerplate assets (`App.css`).
- [x] Created `Sidebar.jsx` — fixed sidebar with logo, nav links (badges), account section, and profile footer.
- [x] Created `MainLayout.jsx` — flex layout with Sidebar + scrollable `<Outlet />` area.
- [x] Updated `App.jsx` — `BrowserRouter` with routes for all page modules.
- [x] Verified successful production build.
- [x] **Database Migration:** Created `supabase/migrations/20260728_create_roles_and_profiles.sql` — `roles` table (admin/user/read), `profiles` table (linked to `auth.users`), RLS policies.
- [x] **Pixel-Perfect Login Page:** Created `src/pages/Auth/Login.jsx` — full-screen split layout.
- [x] **Supabase Client:** Created `src/services/supabaseClient.js` — singleton client.
- [x] **Auth Service:** Created `src/services/authService.js` — signIn, signOut, getSession, fetchUserProfile, onAuthStateChange.
- [x] **AuthProvider:** Created `src/components/auth/AuthProvider.jsx` — React context providing `{ user, profile, loading }`.
- [x] **ProtectedRoute:** Created `src/components/auth/ProtectedRoute.jsx` — redirects unauthenticated users.
- [x] **Login Wired Up:** Updated `Login.jsx` — form calls Supabase `signIn`, shows loading/error states, redirects on success.
- [x] **Compagnons Migration (Updated):** `supabase/migrations/20260728_create_compagnons_table.sql` — includes `role_id` (FK → `roles`).
- [x] **Companion Profile Schema Expansion:** Created `supabase/migrations/20260728_update_compagnons_profile.sql` — added `gender`, `date_of_birth`, `city`, `join_date`, `referent_id`; created `medical_records` table.
- [x] **Consolidated Schema (Phase 5):** Created `supabase/migrations/20260729_consolidate_schema.sql` — added `address`, `postal_code` to `compagnons`; created `consultations` table (for Health page); created `vacations` table (for Congés module). Full CRUD RLS on both.
- [x] **Companion Service (Phase 5):** `src/services/companionService.js` — `createCompanion` and `updateCompanion` now handle nested `medical` data (blood_type, doctor_name, allergies, pathologies) by inserting/upserting `medical_records` simultaneously.
- [x] **CompanionForm (Phase 5):** `src/pages/Companions/CompanionForm.jsx` — expanded modal form organized into 3 sections: Personal Info (prénom, nom, genre, date de naissance, rôle), Contact (email, phone, city, address, postal code), Medical (blood type, doctor, allergies, pathologies). Scrollable within max-height modal.
- [x] **CompanionProfile (Phase 5):** `src/pages/Companions/CompanionProfile.jsx` — refined header to display full address (address + postal_code + city); updated Informations personnelles card with Address and Code postal rows.
- [x] **Health Service:** Created `src/services/healthService.js` — CRUD for `consultations` table + `fetchMedicalRecord`.
- [x] **HealthDashboard (Phase 5):** `src/pages/Health/HealthDashboard.jsx` — full page with companion selector dropdown, top stats (blood group, doctor, last consultation), medical info card (allergies/pathologies), and consultation history timeline backed by real Supabase data.
- [x] **Vacations Module (Phase 5):** Created `src/pages/Vacations/VacationsList.jsx` placeholder. Added `/conges` route in `App.jsx`. Added "Congés" (Palmtree icon) nav item in `Sidebar.jsx`.
- [x] **Vacations RBAC Migration (Phase 5b):** Created `supabase/migrations/20260729_vacations_rbac.sql` — added `requested_by` (UUID FK → profiles) to `vacations` table.
- [x] **Vacations Constraint Fix (Phase 5b):** Created `supabase/migrations/20260729_fix_vacations_compagnon_id.sql` — drops `NOT NULL` constraint on `compagnon_id` in `vacations` table so standard user vacation requests work without a companion ID.
- [x] **Vacation Service (Phase 5b):** Created `src/services/vacationService.js` — `createVacationRequest` (auto-injects `requested_by`, maps `compagnon_id` to `null` when omitted), `getUserVacations` (filters by current user), `getAllVacations` (admin, joins with profiles for requester name), `updateVacationStatus` (admin approve/reject).
- [x] **VacationsList RBAC UI (Phase 5b):** `src/pages/Vacations/VacationsList.jsx` — implemented Role-Based Approval Workflow: Admin view shows all requests with requester name, Accepter/Refuser buttons for 'En attente' rows; User view shows personal requests with creation form (start date, end date, reason). Status badges: amber (En attente), green (Approuvé), red (Refusé).
- [x] **Companion Avatar & Profession Migration (Phase 5c):** Created `supabase/migrations/20260729_add_avatar_profession.sql` — adds `avatar_url` (TEXT) and `profession` (VARCHAR) to `compagnons` table; defines RLS policies for `avatars` Supabase Storage bucket (public SELECT, authenticated INSERT/UPDATE/DELETE).
- [x] **Avatar Upload Service (Phase 5c):** Updated `src/services/companionService.js` with `uploadAvatar(file)` to upload files to `avatars` bucket and return public URLs; `createCompanion` and `updateCompanion` handle `avatar_url` and `profession`.
- [x] **CompanionForm Avatar & Profession UI (Phase 5c):** Updated `src/pages/Companions/CompanionForm.jsx` with a visual Photo de profil upload input & live preview at the top of Informations personnelles, plus a Profession input field. Integrates image upload before database save.
- [x] **CompanionsList & Profile UI (Phase 5c):** Updated `src/pages/Companions/CompanionsList.jsx` to render companion avatar images (`avatar_url`) with fallback to initials, and show `profession` under companion name. Updated `src/pages/Companions/CompanionProfile.jsx` to render avatar image in the top banner, profession in the meta row, and Profession in Informations personnelles card.
- [x] **React Focus Anti-Pattern Fix (Phase 6):** Moved `InputField` definition outside `CompanionForm.jsx` functional component so typing does not cause component remounting or focus loss.
- [x] **Standardize Date Pickers Globally (Phase 6):** Updated date inputs (`type="date"`) in `CompanionForm.jsx` and `VacationsList.jsx` to open the native browser calendar picker when clicked (`showPicker()`) and set calendar icons to `pointer-events-none`.
- [x] **Health Module Initialization (Phase 6):** Created `supabase/migrations/20260729_init_health_module.sql` (ensures `medical_records` and `consultations` tables have all columns including `health_summary`, `pathologies[]`, `allergies[]`, with RLS policies); updated `src/services/healthService.js` with `fetchCompanionHealthData` and array/string normalizer; implemented comprehensive `src/pages/Health/HealthDashboard.jsx` featuring Companion Selector dropdown, 4 top stats cards (Groupe sanguin, Médecin traitant, Dernière consultation, Prochain RDV), Pathologies chroniques (orange dots), Allergies connues (red dots), and Historique médical vertical timeline with graceful empty states.
- [x] **Health Module Interactive CRUD (Phase 6b):** Added `updateMedicalRecord(id, data)` (with `upsert` on conflict `compagnon_id`) to `src/services/healthService.js`. Created `src/pages/Health/MedicalRecordForm.jsx` modal (allows editing blood group, doctor, comma-separated pathologies/allergies parsing into arrays, and health summary) and `src/pages/Health/ConsultationForm.jsx` modal (interactive datepicker, status dropdown, specialty, doctor, and notes). Wired `"Modifier le dossier"` and `"Nouvelle consultation"` buttons in `HealthDashboard.jsx` with instant dynamic data re-fetching upon save.
- [x] **Rendez-vous Module Initialization & UI (Phase 7):** Created `supabase/migrations/20260729_init_appointments.sql` (`appointments` table with RLS policies); created `src/services/appointmentService.js` (getAllAppointments with companion details join, createAppointment, updateAppointment, deleteAppointment); implemented `src/pages/Appointments/AppointmentsList.jsx` featuring an interactive monthly calendar with status indicator dots and legend on the left, and upcoming appointment cards with urgent badges, locations, edit/delete actions, and scheduling modal on the right.
- [x] **User Vacation Enhancements & Settings Separation (Phase 8):** Enhanced `src/pages/Vacations/VacationsList.jsx` for standard users by ensuring "+ Nouvelle demande" is always accessible for submitting multiple future requests, and adding two personal summary statistic cards ("Prochain congé" and "Retour au travail prévu le"). Created `src/pages/Settings/Settings.jsx` ("Paramètres - Mon Compte") and updated `src/App.jsx` to route `/parametres`, enforcing separation of concerns between Staff/User account profiles and Compagnon records.
- [x] **Appointment Buttons & Modal Wiring Fix (Phase 8b):** Wired "+ Nouveau RDV" in `CompanionProfile.jsx` to open `AppointmentModal` directly for the active companion (`defaultCompanionId={c.id}`). Updated `AppointmentModal.jsx` with an auto-fetch fallback for companion selection when opened independently, and updated `appointmentService.js` to use `.maybeSingle()` on create/update to prevent RLS single-row errors.
- [x] **Profile Edit Button Fix & Final Modules (Phase 9):** Wired the "Modifier" button in `CompanionProfile.jsx` to open `CompanionForm` in edit mode and reload profile data immediately on save. Created SQL migration `20260729_init_final_modules.sql` (`formations`, `compagnon_formations`, `documents` with Supabase Storage bucket policies, and `achievements` tables with RLS). Implemented services (`trainingService.js`, `documentService.js`, `achievementService.js`) and comprehensive UI modules (`TrainingsList.jsx`, `DocumentsManager.jsx`, `AchievementsList.jsx`) matching the visual mockups.
- [x] **Documents Deletion Bug & RLS Fix:** Updated `documentService.js` deletion logic to remove files from the Supabase `'documents'` storage bucket before deleting db rows. Added optimistic UI state removal in `DocumentsManager.jsx` and created SQL snippet `20260729_fix_documents_delete_rls.sql` for authenticated delete permissions.
- [x] **WSOD / Refresh Crash Fix & TopHeader Integration:** Created `src/components/layout/TopHeader.jsx` with correct Lucide icon imports and safe optional chaining (`user?.email`, `user?.user_metadata?.name`, `profile?.first_name`) to prevent null-reference crashes on page refresh. Integrated `TopHeader` into `MainLayout.jsx`.
- [x] **Settings Module, Dark Mode & Admin User Management (Phase 10):** Refactored `src/pages/Settings/Settings.jsx` into a professional tabbed interface ("Mon Profil", "Apparence", "Gestion des utilisateurs" [Admin only], and "Général"). Added `darkMode: 'class'` to `tailwind.config.js`, implemented theme persistence in `localStorage` with root HTML class toggle, built a user management table and glassmorphic creation modal with safe Supabase client instantiation in `authService.js` (`registerNewUser`) to prevent admin session hijacking, and added password reset & notification preferences.
- [x] **Dark Mode Fix, Settings UI Restyling & Messaging/Compagnon Portal (Phase 11):** Configured `@custom-variant dark (&:where(.dark, .dark *));` in `src/index.css` for Tailwind CSS v4 class-based dark mode support with global navy/slate overrides (`#0f172a`). Restyled `Settings.jsx` with the signature dark-blue header banner and glassmorphic panels matching `CompanionProfile.jsx`. Created `20260729_init_messaging.sql` (`messages` table with RLS), `messageService.js`, and `SendMessageModal.jsx`. Wired Bell icon in `TopHeader.jsx` to an interactive unread messages dropdown, added a "+ Message" button in `CompanionProfile.jsx`, and implemented restricted "Compagnon Portal" role access in `AuthProvider.jsx` (`isCompagnon` helper) and `Sidebar.jsx` (hiding administrative tabs for companions).
- [x] **Formations CRUD Completion & Main Dashboard Implementation (Phase 12):** Added full Edit and Delete functionality to Formations (`src/pages/Trainings/TrainingsList.jsx`) with optimistic state updates and `updateFormation(id, data)` / `deleteFormation(id)` in `src/services/trainingService.js`. Implemented `src/services/dashboardService.js` to fetch aggregated KPIs (`totalCompanions`, `upcomingAppointments`, `activeFormations`, `unreadMessages`) and recent activities (`getRecentCompanions`, `getUpcomingAppointments`) with fallback demo data. Built high-fidelity `src/pages/Dashboard/Dashboard.jsx` featuring the signature dark-blue hero banner, 4 stat cards with trend indicators, visual CSS charts for consultation activity and status distribution, and side-by-side upcoming appointments and recent companion lists. Updated `src/App.jsx` to route `/tableau-de-bord` and redirect `/` to `/tableau-de-bord`.
- [x] **Dashboard Badge Removal & Global Responsiveness Audit (Phase 13):** Removed the "Plateforme Solidaire Emmaüs Connect" badge and unused Sparkles icon from `Dashboard.jsx` header banner. Implemented full mobile drawer support for `Sidebar.jsx` with responsive toggle in `TopHeader.jsx` (`Menu` and `X` icons) and auto-closing on navigation link clicks. Standardized responsive padding and grid gaps across `Dashboard.jsx`, and ensured calendar cells in `AppointmentsList.jsx` adjust cleanly on mobile screens (`h-10 sm:h-12`). Verified table `overflow-x-auto` in `DocumentsManager.jsx` and grid responsiveness in `TrainingsList.jsx`. Verified production build succeeds.
- [x] **Dynamic Sidebar Notification Badges (Phase 14):** Replaced hardcoded notification badge counts ("46", "3", "2") in `src/components/layout/Sidebar.jsx` with dynamic database counts fetched via `useEffect` from `companionService.js` (`fetchCompanions`), `appointmentService.js` (`getAllAppointments`, filtered for upcoming dates), and `documentService.js` (`getAllDocuments`). Added subtle `<Loader2 className="w-3 h-3 animate-spin" />` loading state while counts are being loaded.
- [x] **Supabase Connected:** `.env` configured with real project credentials. `.gitignore` secured.

## Work in Progress (Active Task)
- _No active task — awaiting next instruction._

## Next Steps
- Polish end-to-end responsiveness and accessibility across all modules.
- Add logout functionality to the Sidebar's "Déconnexion" link.

---
*Note to AI Agent: Always read this file before answering to understand the current context. Update the "Completed Tasks" and "Work in Progress" sections whenever a major feature is finished.*