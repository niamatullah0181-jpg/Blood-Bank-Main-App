/*
# Organizations, profiles and volunteer memberships

Plain-English summary: builds the foundation of the multi-NGO blood bank. Every blood bank organization is a separate tenant. Every signed-in person has a profile. Volunteers join an organization and only become active once an organization admin approves them.

1. New Tables
- `organizations`: blood bank NGOs with name, district and thana. Four demo organizations are seeded.
- `profiles`: one row per signed-in person, keyed by their sign-in account id. Holds name, phone, blood group, district, thana and role (seeker, donor or volunteer).
- `organization_members`: links a person to an organization as `admin` or `volunteer`. `verified` controls whether the person is active. New volunteers start unverified.

2. Security
- Row level security is enabled on all three tables.
- `organizations`: readable by signed-in users only. This is the shared NGO directory used for filters.
- `profiles`: each person can read only their own profile. All writes go through server functions added in later migrations.
- `organization_members`: members see their own rows, and admins see the rows of organizations they administer. The app cannot write to this table directly.
- Helper functions `is_verified_member` and `is_org_admin` answer yes/no membership questions with elevated rights. They are not callable by anonymous visitors.

3. Important notes
- 1. The first organization admin must be created by a database operator by inserting a verified admin row. The app cannot promote itself.
- 2. Every statement is idempotent, so this migration is safe to re-run.
*/

CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 3 AND 120),
  district text NOT NULL,
  thana text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL CHECK (char_length(btrim(full_name)) BETWEEN 2 AND 80),
  phone text NOT NULL UNIQUE CHECK (phone ~ '^\+8801[3-9][0-9]{8}$'),
  blood_group text NOT NULL CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  district text NOT NULL,
  thana text NOT NULL,
  role text NOT NULL CHECK (role IN ('seeker', 'donor', 'volunteer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'volunteer')),
  verified boolean NOT NULL DEFAULT false,
  full_name text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS organization_members_user_idx ON organization_members (user_id);

INSERT INTO organizations (id, name, district, thana) VALUES
  ('6f1c2a10-0000-4000-8000-000000000001', 'Dhaka Community Blood Bank', 'Dhaka', 'Dhanmondi'),
  ('6f1c2a10-0000-4000-8000-000000000002', 'Chattogram Lifeline Society', 'Chattogram', 'Kotwali'),
  ('6f1c2a10-0000-4000-8000-000000000003', 'Sylhet Donor Network', 'Sylhet', 'Sylhet Sadar'),
  ('6f1c2a10-0000-4000-8000-000000000004', 'Khulna Red Drop Trust', 'Khulna', 'Sonadanga')
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION is_verified_member(p_org uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members m
    WHERE m.organization_id = p_org AND m.user_id = auth.uid() AND m.verified
  );
$$;

CREATE OR REPLACE FUNCTION is_org_admin(p_org uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members m
    WHERE m.organization_id = p_org AND m.user_id = auth.uid() AND m.role = 'admin' AND m.verified
  );
$$;

REVOKE EXECUTE ON FUNCTION is_verified_member(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION is_org_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION is_verified_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_org_admin(uuid) TO authenticated;

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON organizations TO authenticated;
GRANT SELECT ON profiles TO authenticated;
GRANT SELECT ON organization_members TO authenticated;

-- Shared NGO directory: intentionally readable by every signed-in user so they can filter by organization.
DROP POLICY IF EXISTS "organizations_select_signed_in" ON organizations;
CREATE POLICY "organizations_select_signed_in" ON organizations FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "organization_members_select_own_or_admin" ON organization_members;
CREATE POLICY "organization_members_select_own_or_admin" ON organization_members FOR SELECT
TO authenticated USING (user_id = auth.uid() OR is_org_admin(organization_id));
