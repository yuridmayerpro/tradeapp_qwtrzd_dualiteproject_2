/*
# [Create Push Subscriptions Table]
This migration creates a new table `push_subscriptions` to store web push notification subscription data for users. It also enables Row Level Security (RLS) and defines policies to ensure users can only access and manage their own subscriptions.

## Query Description: [This operation creates a new table `push_subscriptions` for storing web push notification credentials. It is a non-destructive operation and does not affect existing data. It includes security policies to ensure users can only manage their own notification settings.]

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Table: `public.push_subscriptions`
  - Columns: `id` (uuid, pk), `user_id` (uuid, fk to auth.users), `subscription` (jsonb), `created_at` (timestamptz)
- Policies:
  - `Enable read access for users on their own subscriptions`
  - `Enable insert for users on their own subscriptions`
  - `Enable delete for users on their own subscriptions`

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes, new policies are created for the `push_subscriptions` table.
- Auth Requirements: Users must be authenticated to interact with this table.

## Performance Impact:
- Indexes: A foreign key index on `user_id` is created, which is beneficial for performance when querying subscriptions for a specific user.
- Triggers: None
- Estimated Impact: Low. This is a standard table creation with appropriate indexing.
*/

-- Create the table to store push subscriptions
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subscription jsonb not null,
  created_at timestamptz not null default now()
);

-- Add a comment to the table
comment on table public.push_subscriptions is 'Stores web push notification subscription details for each user and device.';

-- Enable Row Level Security
alter table public.push_subscriptions enable row level security;

-- Create policies for RLS
create policy "Enable read access for users on their own subscriptions"
on public.push_subscriptions for select
using (auth.uid() = user_id);

create policy "Enable insert for users on their own subscriptions"
on public.push_subscriptions for insert
with check (auth.uid() = user_id);

create policy "Enable delete for users on their own subscriptions"
on public.push_subscriptions for delete
using (auth.uid() = user_id);
