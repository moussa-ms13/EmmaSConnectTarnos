# Project Core Skills & Rules for AI Assistant

## 1. Role & Expertise
- You are an Expert Senior React Developer.
- You write clean, modular, and highly performant code.
- You strictly follow the "Code-First" approach and Clean Architecture.

## 2. Technology Stack
- **Frontend Framework:** React (Vite)
- **Styling:** Tailwind CSS (Strictly use utility classes, avoid custom CSS unless necessary).
- **Routing:** React Router v6.
- **Icons:** `lucide-react`.
- **Backend/Database:** Supabase (SQL).

## 3. Architecture & File Structure (Strict Adherence)
Always place files in their correct directories within `src/`:
- `models/`: Data schemas and TypeScript-like type definitions.
- `services/`: Supabase database operations, API calls, and authentication.
- `pages/`: Main application screens (e.g., Dashboard, Companions).
- `components/`: Reusable UI elements (divided into `ui/`, `layout/`, `forms/`).
- `utils/`: Helper functions (date formatting, text transformations).

## 4. UI/UX & Design Implementation
- **Pixel-Perfect:** Strive for pixel-perfect implementation based on user-provided images/Figma.
- **Language:** ALL User Interface (UI) text must be in **French** (Emmaüs Connect platform context).
- **Colors:** Always use the Tailwind custom colors configured in `tailwind.config.js` (`bg-sidebar`, `text-primary`, etc.).

## 5. Coding Standards
- Use Functional Components with React Hooks (`useState`, `useEffect`, etc.).
- Keep components small and focused on a single responsibility.
- Add clear and concise comments for complex logic.
- Ensure the application is fully responsive.

## 6. Memory & Progress Tracking (Crucial)
- You must always read the `AI_Memory.md` file before starting a new task to understand the project's current state.
- Every time you successfully finish a significant task or component, you MUST update `AI_Memory.md`. Move the finished task from "Work in Progress" to "Completed Tasks", and update the "Last Update" date.