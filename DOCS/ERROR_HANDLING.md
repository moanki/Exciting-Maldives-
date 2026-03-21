# Error Handling Reference

This document outlines the common errors encountered in the application and how to resolve them.

## Configuration Errors

### `[Configuration Error]: VITE_SUPABASE_URL is missing`
- **Location**: `src/supabase.ts`
- **Cause**: The Supabase URL is not defined in the environment variables.
- **Resolution**: Ensure `VITE_SUPABASE_URL` is set in your `.env` file.

### `[Configuration Error]: VITE_SUPABASE_ANON_KEY is missing`
- **Location**: `src/supabase.ts`
- **Cause**: The Supabase Anonymous Key is not defined in the environment variables.
- **Resolution**: Ensure `VITE_SUPABASE_ANON_KEY` is set in your `.env` file.

## Database Errors

### `Supabase Error: relation "resorts" does not exist`
- **Location**: Any database query.
- **Cause**: The database tables have not been created in the Supabase project.
- **Resolution**: Run the SQL schema provided in the Admin Dashboard (System Overview) in your Supabase SQL Editor.

### `Supabase Error: new row violates row-level security policy`
- **Location**: Insert or Update operations.
- **Cause**: The user does not have permission to perform the requested action according to RLS policies.
- **Resolution**: Check the RLS policies in the Supabase dashboard for the target table.

## Processing Errors

### `Content processing error`
- **Location**: `src/services/content.ts`
- **Cause**: The processing engine failed to analyze the provided document or generate content.
- **Resolution**: Check the console for detailed error logs. Ensure the input data (e.g., base64 PDF) is valid.

## Security Alerts

### `Security Alert: Unauthorized inspection detected`
- **Location**: Browser Console.
- **Cause**: The anti-debugging loop detected that Developer Tools are open.
- **Resolution**: This is an intended security feature. Close Developer Tools to resume normal operation.
