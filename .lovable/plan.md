
# FitNutt — Lean Bulking PWA

## Branding
- **Logo**: The uploaded FitNutt peanut mascot (embedded in the app)
- **Palette**: `#F5F5F5` (off-white), `#EA5C1F` (vibrant orange accent), `#D6D7D7` (light gray), `#4F5D75` (slate blue), `#212431` (dark navy)
- **Light Mode**: `#F5F5F5` bg, `#212431` text, `#D6D7D7` cards/inputs, `#EA5C1F` CTAs
- **Dark Mode**: `#212431` bg, `#F5F5F5` text, `#4F5D75` cards, `#EA5C1F` CTAs (aggressive pop)
- **Theme toggle** in top nav on all pages (styled with FitNutt logo)

## Auth
- Email/password signup & login via Supabase Auth
- Password reset flow with `/reset-password` page
- All data scoped to authenticated user

## Database (Supabase/Postgres)
- **foods** — name, serving_size, serving_unit, calories, protein, carbs, fats, user_id
- **daily_logs** — date, user_id, creatine_taken, whey_taken
- **meal_entries** — daily_log_id, meal_type (breakfast/lunch/dinner/snack), food_id, quantity
- **user_settings** — user_id, calorie_target, protein_target, carb_target, fat_target, notification_time, theme
- **user_roles** — standard roles table (per security requirements)
- RLS on all tables scoped to authenticated user

## Pages & Features

### Dashboard (`/`)
- Macro progress rings/bars: calories, protein, carbs, fats vs targets
- Two supplement toggles: Creatine (5g) & Whey Protein — toggle updates DB instantly
- Daily timeline showing today's logged meals by slot

### Daily Diary (`/log`)
- Meal slots: Breakfast, Lunch, Dinner, Snacks
- Tap slot → search custom food library → enter quantity → auto-calculate macros
- "Copy Yesterday's Meal" button + date picker to copy from any day

### Custom Food Library (`/foods`)
- CRUD interface for foods (name, serving size/unit, calories, protein, carbs, fats)
- Pre-seeded with staples: chicken breast, eggs, whey protein, soya chunks, paneer, dal, rice, roti

### The Playbook (`/schedule`)
- Mon–Sun day selector at top
- Renders the specific workout routine for the selected day (all program data hardcoded as provided)
- Display only — no logging of sets/reps

### Settings (`/profile`)
- Edit macro targets (calories, protein, carbs, fats)
- Notification time picker for supplement reminders
- Theme preference (persisted to DB)

## Supplement Nag System
- Supabase Edge Function triggered on a schedule (cron-like via pg_cron or external)
- Checks if creatine_taken/whey_taken is false for today at user's configured time
- Sends Web Push notification: "Take your Creatine" / "Take your Whey Protein"
- Tapping notification opens Dashboard to toggle

## PWA
- `vite-plugin-pwa` with service worker (disabled in dev/iframe, guarded against preview hosts)
- Web app manifest with FitNutt icon and `display: standalone`
- Offline caching for core app shell
- `navigateFallbackDenylist` for `/~oauth`

## Mobile-First Design
- All layouts optimized for mobile viewports first
- Clean, high-contrast athletic aesthetic
- Responsive scaling for tablet/desktop
