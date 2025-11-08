/*
# Create User Settings Table
This migration creates a `user_settings` table to store individual user preferences, such as their last selected asset and analysis parameters. It links directly to the `auth.users` table and includes Row Level Security (RLS) policies to ensure users can only access their own data.

## Query Description:
- **Table Creation**: Creates `public.user_settings` with columns for `id` (user's UUID), `selected_asset`, `indicator_params` (as JSONB), and timestamps. The `id` is a foreign key to `auth.users`, ensuring data integrity. If a user is deleted, their settings are also deleted (`ON DELETE CASCADE`).
- **Default Values**: Sets sensible defaults for new users ('BTC-USD' and standard indicator parameters).
- **Auto-Update Timestamp**: A trigger function is used to automatically update the `updated_at` column whenever a row is modified.
- **Row Level Security**: RLS is enabled on the table. Policies are added to restrict `INSERT`, `SELECT`, and `UPDATE` operations, ensuring that a user can only interact with the row that matches their own `auth.uid()`. This is a critical security measure.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (The table can be dropped)

## Structure Details:
- **Table Affected**: `public.user_settings` (New)
- **Columns**: `id`, `selected_asset`, `indicator_params`, `created_at`, `updated_at`
- **Constraints**: PRIMARY KEY, FOREIGN KEY to `auth.users(id)`
- **Triggers**: A trigger is added to automatically update the `updated_at` timestamp on row changes.

## Security Implications:
- **RLS Status**: Enabled. This is the primary security mechanism.
- **Policy Changes**: Yes. New policies are created to enforce data privacy.
- **Auth Requirements**: All operations require an authenticated user session.

## Performance Impact:
- **Indexes**: A primary key index is automatically created on the `id` column.
- **Triggers**: One trigger is added, which has a negligible performance impact on `UPDATE` operations.
- **Estimated Impact**: Low. The table is expected to have one row per user, and queries will be highly efficient due to the primary key index.
*/

-- 1. Create the user_settings table
CREATE TABLE public.user_settings (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    selected_asset TEXT NOT NULL DEFAULT 'BTC-USD',
    indicator_params JSONB NOT NULL DEFAULT '{
        "adxPeriod": 14,
        "adxThreshold": 20,
        "slopeWindow": 14,
        "slopeSmooth": 5,
        "gogSpan": 5,
        "swingLeft": 3,
        "swingRight": 3,
        "fiboRetrLow": 0.382,
        "fiboRetrHigh": 0.618
    }',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Add comments to the table and columns for clarity
COMMENT ON TABLE public.user_settings IS 'Stores user-specific application settings.';
COMMENT ON COLUMN public.user_settings.id IS 'Links to the authenticated user.';
COMMENT ON COLUMN public.user_settings.selected_asset IS 'The last cryptocurrency asset selected by the user.';
COMMENT ON COLUMN public.user_settings.indicator_params IS 'The user''s custom parameters for technical analysis.';

-- 3. Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_user_settings_updated
BEFORE UPDATE ON public.user_settings
FOR EACH ROW
EXECUTE PROCEDURE public.handle_updated_at();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies
CREATE POLICY "Allow individual insert access"
ON public.user_settings
FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow individual select access"
ON public.user_settings
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Allow individual update access"
ON public.user_settings
FOR UPDATE
USING (auth.uid() = id);
