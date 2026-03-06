-- Create the access_control table
CREATE TABLE IF NOT EXISTS access_control (
  page text PRIMARY KEY,
  roles text[] NOT NULL DEFAULT '{}',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE access_control ENABLE ROW LEVEL SECURITY;

-- Create policies

-- 1. Select Policy: Everyone (authenticated users) can read the access_control table.
-- This is necessary because the frontend needs to know which pages the current user can access
-- to render the UI correctly (e.g., showing/hiding links in the Header).
CREATE POLICY "Allow authenticated users to read access_control"
  ON access_control
  FOR SELECT
  TO authenticated
  USING (true);

-- 2. Insert/Update/Delete Policy: Only 'creator' and 'admin' can modify access_control.
-- We check the admin_users table to verify the role of the current user.
CREATE POLICY "Allow admins and creators to modify access_control"
  ON access_control
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.username = (auth.jwt() ->> 'email')
      AND admin_users.role IN ('admin', 'creator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.username = (auth.jwt() ->> 'email')
      AND admin_users.role IN ('admin', 'creator')
    )
  );

-- Create a trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_access_control_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_access_control_updated_at_trigger ON access_control;
CREATE TRIGGER update_access_control_updated_at_trigger
BEFORE UPDATE ON access_control
FOR EACH ROW
EXECUTE FUNCTION update_access_control_updated_at();
