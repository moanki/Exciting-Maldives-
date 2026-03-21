# Architecture Overview

## Frontend Architecture
The frontend is a Single Page Application (SPA) built with React.

### Directory Structure
- `/src/components`: Reusable UI components.
- `/src/pages`: Main page components and route handlers.
- `/src/services`: External API and database service integrations.
- `/src/utils`: Utility functions and security helpers.
- `/src/lib`: Third-party library configurations.

### State Management
The application uses React's built-in `useState` and `useEffect` hooks for local state management. For global data, it relies on real-time subscriptions provided by Supabase.

## Database Schema (Supabase)
The system uses a PostgreSQL database with the following core tables:

### 1. `resorts`
Stores detailed information about Maldives resorts.
- `id`: UUID (Primary Key)
- `name`: Text
- `atoll`: Text
- `category`: Text
- `transfer_type`: Text
- `description`: Text
- `images`: Text Array
- `highlights`: Text Array
- `meal_plans`: Text Array
- `room_types`: JSONB Array

### 2. `partner_requests`
Manages B2B partner applications.
- `id`: UUID (Primary Key)
- `email`: Text
- `full_name`: Text
- `company_name`: Text
- `status`: Enum ('pending', 'approved', 'rejected')

### 3. `booking_requests`
Tracks booking inquiries from partners.
- `id`: UUID (Primary Key)
- `resort_name`: Text
- `check_in`: Date
- `check_out`: Date
- `status`: Enum ('new', 'processing', 'confirmed', 'cancelled')

### 4. `site_settings`
Stores dynamic configuration for the frontend.
- `key`: Text (Primary Key)
- `value`: JSONB

## Security Implementation
The application implements a multi-layered security approach:
1. **Row Level Security (RLS)**: Enforced at the database level via Supabase to ensure users can only access data they are authorized to see.
2. **Frontend Deterrence**: Measures in `src/utils/security.ts` to prevent casual inspection of the source code.
3. **Environment Isolation**: Sensitive keys are managed via environment variables and never hardcoded.
