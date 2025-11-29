# Supabase Auth Setup Instructions

## Problem
The error "insert or update on table 'user_profiles' violates foreign key constraint 'user_profiles_id_fkey'" occurs because the `user_profiles.id` field has a foreign key constraint to `auth.users.id`. This means you cannot directly insert into `user_profiles` without first creating a user in Supabase Auth.

## Solution
We've implemented a proper authentication flow using Supabase Auth with an automatic profile creation trigger.

## Setup Steps

### 1. Run the SQL Trigger Script
Open your Supabase dashboard and run the SQL script:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file `supabase_auth_trigger.sql`
4. Copy and paste the entire SQL script
5. Click **Run** to execute it

This script will:
- Create a trigger function that automatically creates a user profile when someone signs up
- Set up proper Row Level Security (RLS) policies
- Allow the trigger to insert profiles automatically

### 2. How It Works Now

**Before (Incorrect):**
```
Signup → Insert directly into user_profiles → ERROR (no auth.users record)
```

**After (Correct):**
```
Signup → Create user in auth.users → Trigger automatically creates profile in user_profiles → Success!
```

### 3. Updated Code Flow

The signup process now:
1. Checks if user already exists
2. Creates user in `auth.users` using `supabase.auth.signUp()`
3. Passes user metadata (name, role, avatar) in the signup options
4. The database trigger automatically creates the profile in `user_profiles`
5. Adds user to team if specified

### 4. Testing

After running the SQL script, try signing up a new user:
1. Go to the signup page
2. Enter name, email, role, and team
3. Click "Create Account"
4. The user should be created successfully!

### 5. Verify in Supabase Dashboard

Check that everything worked:
1. Go to **Authentication** → **Users** to see the auth user
2. Go to **Table Editor** → **user_profiles** to see the profile
3. Go to **Table Editor** → **team_members** to see team assignment

## Important Notes

- **Password Generation**: The code generates a temporary password automatically. You may want to implement a proper password reset flow or allow users to set their own password.
- **Email Confirmation**: By default, Supabase may require email confirmation. You can disable this in **Authentication** → **Settings** → **Email Auth** if needed for development.
- **RLS Policies**: The trigger uses `SECURITY DEFINER` to bypass RLS when creating profiles automatically.

## Troubleshooting

### If signup still fails:
1. Check Supabase logs in the dashboard
2. Verify the trigger was created successfully
3. Check that RLS policies are set correctly
4. Ensure email confirmation is disabled for development

### If you see "Email not confirmed":
Go to **Authentication** → **Settings** → **Email Auth** and disable "Confirm email" for development.
