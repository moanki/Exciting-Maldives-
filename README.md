# Exciting Maldives - Project Documentation

## Overview
Exciting Maldives is a bespoke Destination Management platform designed for B2B travel professionals. It provides a comprehensive suite of tools for managing resorts, bookings, and partner relationships in the Maldives.

## Architecture
The application is built using a modern full-stack architecture:
- **Frontend**: React 19 with Vite, Tailwind CSS, and Framer Motion.
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Real-time).
- **Security**: Advanced frontend deterrence measures to protect the codebase and intellectual property.

## Key Features
- **Resort Management**: Advanced resort database with smart document extraction.
- **Partner Portal**: Secure management of B2B partner requests and approvals.
- **Booking System**: Real-time tracking of booking requests.
- **Page Customization**: Dynamic control over site content and branding.

## Getting Started
1. **Environment Setup**:
   - Copy `.env.example` to `.env`.
   - Configure your Supabase URL and Anon Key.
2. **Installation**:
   ```bash
   npm install
   ```
3. **Development**:
   ```bash
   npm run dev
   ```
4. **Build**:
   ```bash
   npm run build
   ```

## Security
This project implements several security measures to protect the frontend:
- Disabled right-click and common DevTools shortcuts.
- Anti-debugging loops to deter inspection.
- Periodic console clearing.
- Obfuscation of sensitive strings.

## Documentation
For detailed information, please refer to:
- [Architecture Guide](./ARCHITECTURE.md)
- [Error Handling Reference](./DOCS/ERROR_HANDLING.md)
