/*
# Donors, blood requests, contact permissions and account functions

Plain-English summary: adds the donor register, the emergency blood request board, and the contact-permission flow. It also adds the server functions that create accounts, register donors, search donors with privacy rules, and approve volunteers. Donor phone numbers never leave the server unless the viewer is allowed to see them.

1. New Tables
- `donors`: a person who has registered as a donor, optionally linked to one organization. Holds availability, last donation date and donation count.
- `blood_requests`: emergency and normal blood requests. Optionally assigned to one organization. When no organization is chosen, the request is open to every NGO in that district.
- `permission_requests`: a seeker asks to contact a donor. Approved by verified members of the donor's organization.

2. New Functions
- `complete_profile`: creates the profile and, depending on role, the donor record or a pending volunteer membership in one step.
- `register_as_donor`: lets an existing seeker register as a donor.
- `search_donors`: returns donors filtered by blood group, organization, district, thana and availability. The phone number is only included when the viewer is allowed to see it.
- `approve_volunteer`: lets a verified admin activate a pending volunteer.
- Helper functions `can_handle_request` and `donor_organization` answer membership questions without recursive policy checks.

3. Security
- Row level security enabled on all new tables.
- `donors`: each person can read, register and update only their own donor record (availability and organization). Donors are listed through `search_donors`, never by direct table reads, so phone numbers stay private.
- `blood_requests`: visible to signed-in users as the emergency board. Anyone can post a request as themselves. Only the requester or a verified responder for that area can change the status.
- `permission_requests`: visible to the requester and to verified members of the donor's organization. Requesters can create requests only for donors that belong to an organization. Only verified members can approve or decline.
- All server functions are revoked from anonymous visitors. Functions that handle personal data are granted only to signed-in users.

4. Important notes
- 1. Phone numbers are only returned by `search_donors` to the donor, to an approved requester, or to a verified member of the donor's organization.
- 2. Every statement is idempotent, so this migration is safe to re-run.
*/

CREATE TABLE IF NOT EXISTS donors (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  full_name text NOT NULL CHECK (char_length(btrim(full_name)) BETWEEN 2 AND 80),
  blood_group text NOT NULL CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  district text NOT NULL,
  thana text NOT NULL,
  available boolean NOT NULL DEFAULT true,
  last_donated_at timestamptz,
  donations_count integer NOT NULL DEFAULT 0 CHECK (donations_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS donors_location_idx ON donors (district, thana);
CREATE INDEX IF NOT EXISTS donors_organization_idx ON donors (organization_id);

CREATE TABLE IF NOT EXISTS blood_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  patient_name text NOT NULL CHECK (char_length(btrim(patient_name)) BETWEEN 2 AND 80),
  blood_group text NOT NULL CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  units_needed integer NOT NULL CHECK (units_needed BETWEEN 1 AND 10),
  district text NOT NULL,
  thana text NOT NULL,
  hospital text NOT NULL CHECK (char_length(btrim(hospital)) BETWEEN 3 AND 150),
  urgency text NOT NULL CHECK (urgency IN ('critical', 'urgent', 'normal')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'fulfilled')),
  contact_phone text NOT NULL CHECK (contact_phone ~ '^\+?[0-9]{11,14}$'),
  notes text NOT NULL DEFAULT '' CHECK (char_length(notes) <= 500),
  deadline timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS blood_requests_status_idx ON blood_requests (status, urgency);
CREATE INDEX IF NOT EXISTS blood_requests_location_idx ON blood_requests (district, thana);
CREATE INDEX IF NOT EXISTS blood_requests_organization_idx ON blood_requests (organization_id);

CREATE TABLE IF NOT EXISTS permission_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_user_id uuid NOT NULL REFERENCES donors(user_id) ON DELETE CASCADE,
  requester_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  requester_name text NOT NULL CHECK (char_length(btrim(requester_name)) BETWEEN 2 AND 80),
  donor_name text NOT NULL,
  reason text NOT NULL CHECK (char_length(btrim(reason)) BETWEEN 15 AND 600),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  UNIQUE (donor_user_id, requester_id),
  CHECK (donor_user_id <> requester_id)
);

CREATE INDEX IF NOT EXISTS permission_requests_requester_idx ON permission_requests (requester_id);

CREATE OR REPLACE FUNCTION donor_organization(p_donor uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT d.organization_id FROM donors d WHERE d.user_id = p_donor;
$$;

CREATE OR REPLACE FUNCTION can_handle_request(p_org uuid, p_district text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_org IS NOT NULL THEN is_verified_member(p_org)
    ELSE EXISTS (
      SELECT 1
      FROM organization_members m
      JOIN organizations o ON o.id = m.organization_id
      WHERE m.user_id = auth.uid() AND m.verified AND o.district = p_district
    )
  END;
$$;

CREATE OR REPLACE FUNCTION complete_profile(
  p_full_name text,
  p_blood_group text,
  p_district text,
  p_thana text,
  p_role text,
  p_organization_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_phone text;
  v_org_exists boolean;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Your session has expired. Please sign in again.';
  END IF;
  IF EXISTS (SELECT 1 FROM profiles WHERE id = v_uid) THEN
    RAISE EXCEPTION 'Your profile is already set up.';
  END IF;
  IF p_role NOT IN ('seeker', 'donor', 'volunteer') THEN
    RAISE EXCEPTION 'Choose a valid role.';
  END IF;
  IF p_role = 'volunteer' AND p_organization_id IS NULL THEN
    RAISE EXCEPTION 'Volunteers must choose an organization.';
  END IF;
  IF p_role = 'seeker' AND p_organization_id IS NOT NULL THEN
    RAISE EXCEPTION 'Only donors and volunteers can join an organization.';
  END IF;
  IF p_organization_id IS NOT NULL THEN
    SELECT EXISTS (SELECT 1 FROM organizations WHERE id = p_organization_id) INTO v_org_exists;
    IF NOT v_org_exists THEN
      RAISE EXCEPTION 'The selected organization could not be found.';
    END IF;
  END IF;

  SELECT '+' || regexp_replace(coalesce(u.phone, ''), '\D', '', 'g') INTO v_phone
  FROM auth.users u WHERE u.id = v_uid;

  INSERT INTO profiles (id, full_name, phone, blood_group, district, thana, role)
  VALUES (v_uid, btrim(p_full_name), v_phone, p_blood_group, p_district, p_thana, p_role);

  IF p_role = 'donor' THEN
    INSERT INTO donors (user_id, organization_id, full_name, blood_group, district, thana)
    VALUES (v_uid, p_organization_id, btrim(p_full_name), p_blood_group, p_district, p_thana);
  END IF;

  IF p_role = 'volunteer' THEN
    INSERT INTO organization_members (organization_id, user_id, role, verified, full_name, phone)
    VALUES (p_organization_id, v_uid, 'volunteer', false, btrim(p_full_name), v_phone);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION register_as_donor(p_organization_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_profile profiles%ROWTYPE;
  v_org_exists boolean;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Your session has expired. Please sign in again.';
  END IF;
  SELECT * INTO v_profile FROM profiles WHERE id = v_uid;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Complete your profile before registering as a donor.';
  END IF;
  IF EXISTS (SELECT 1 FROM donors WHERE user_id = v_uid) THEN
    RAISE EXCEPTION 'You are already registered as a donor.';
  END IF;
  IF p_organization_id IS NOT NULL THEN
    SELECT EXISTS (SELECT 1 FROM organizations WHERE id = p_organization_id) INTO v_org_exists;
    IF NOT v_org_exists THEN
      RAISE EXCEPTION 'The selected organization could not be found.';
    END IF;
  END IF;

  INSERT INTO donors (user_id, organization_id, full_name, blood_group, district, thana)
  VALUES (v_uid, p_organization_id, v_profile.full_name, v_profile.blood_group, v_profile.district, v_profile.thana);

  IF v_profile.role = 'seeker' THEN
    UPDATE profiles SET role = 'donor', updated_at = now() WHERE id = v_uid;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION approve_volunteer(p_membership_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org uuid;
BEGIN
  SELECT organization_id INTO v_org FROM organization_members WHERE id = p_membership_id;
  IF v_org IS NULL THEN
    RAISE EXCEPTION 'That volunteer request could not be found.';
  END IF;
  IF NOT is_org_admin(v_org) THEN
    RAISE EXCEPTION 'Only organization admins can approve volunteers.';
  END IF;
  UPDATE organization_members SET verified = true WHERE id = p_membership_id;
END;
$$;

CREATE OR REPLACE FUNCTION search_donors(
  p_blood_group text DEFAULT NULL,
  p_organization_id uuid DEFAULT NULL,
  p_district text DEFAULT NULL,
  p_thana text DEFAULT NULL,
  p_available_only boolean DEFAULT false,
  p_query text DEFAULT NULL
)
RETURNS TABLE (
  user_id uuid,
  organization_id uuid,
  organization_name text,
  full_name text,
  blood_group text,
  district text,
  thana text,
  available boolean,
  last_donated_at timestamptz,
  donations_count integer,
  contact_visible boolean,
  phone text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH matched AS (
    SELECT
      d.user_id,
      d.organization_id,
      o.name AS organization_name,
      d.full_name,
      d.blood_group,
      d.district,
      d.thana,
      d.available,
      d.last_donated_at,
      d.donations_count,
      (
        d.user_id = auth.uid()
        OR is_verified_member(d.organization_id)
        OR EXISTS (
          SELECT 1 FROM permission_requests pr
          WHERE pr.donor_user_id = d.user_id AND pr.requester_id = auth.uid() AND pr.status = 'approved'
        )
      ) AS contact_visible
    FROM donors d
    LEFT JOIN organizations o ON o.id = d.organization_id
    WHERE (p_blood_group IS NULL OR d.blood_group = p_blood_group)
      AND (p_organization_id IS NULL OR d.organization_id = p_organization_id)
      AND (p_district IS NULL OR d.district = p_district)
      AND (p_thana IS NULL OR d.thana = p_thana)
      AND (NOT p_available_only OR d.available)
      AND (p_query IS NULL OR d.full_name ILIKE '%' || p_query || '%' OR d.thana ILIKE '%' || p_query || '%')
  )
  SELECT
    m.user_id,
    m.organization_id,
    m.organization_name,
    m.full_name,
    m.blood_group,
    m.district,
    m.thana,
    m.available,
    m.last_donated_at,
    m.donations_count,
    m.contact_visible,
    CASE WHEN m.contact_visible THEN p.phone END AS phone
  FROM matched m
  JOIN profiles p ON p.id = m.user_id
  ORDER BY m.available DESC, m.full_name
  LIMIT 100;
$$;

ALTER TABLE donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_requests ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON donors TO authenticated;
GRANT UPDATE (available, organization_id) ON donors TO authenticated;
GRANT SELECT, INSERT ON blood_requests TO authenticated;
GRANT UPDATE (status) ON blood_requests TO authenticated;
GRANT SELECT ON permission_requests TO authenticated;
GRANT INSERT (donor_user_id, requester_id, requester_name, donor_name, reason, status) ON permission_requests TO authenticated;
GRANT UPDATE (status, reason, resolved_at) ON permission_requests TO authenticated;

DROP POLICY IF EXISTS "donors_select_own" ON donors;
CREATE POLICY "donors_select_own" ON donors FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "donors_insert_own" ON donors;
CREATE POLICY "donors_insert_own" ON donors FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "donors_update_own" ON donors;
CREATE POLICY "donors_update_own" ON donors FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Emergency board: intentionally visible to every signed-in user so requests can be found and answered.
DROP POLICY IF EXISTS "blood_requests_select_signed_in" ON blood_requests;
CREATE POLICY "blood_requests_select_signed_in" ON blood_requests FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "blood_requests_insert_own" ON blood_requests;
CREATE POLICY "blood_requests_insert_own" ON blood_requests FOR INSERT
TO authenticated WITH CHECK (requester_id = auth.uid());

DROP POLICY IF EXISTS "blood_requests_update_requester_or_responder" ON blood_requests;
CREATE POLICY "blood_requests_update_requester_or_responder" ON blood_requests FOR UPDATE
TO authenticated
USING (requester_id = auth.uid() OR can_handle_request(organization_id, district))
WITH CHECK (requester_id = auth.uid() OR can_handle_request(organization_id, district));

DROP POLICY IF EXISTS "permission_requests_select_party" ON permission_requests;
CREATE POLICY "permission_requests_select_party" ON permission_requests FOR SELECT
TO authenticated
USING (requester_id = auth.uid() OR is_verified_member(donor_organization(donor_user_id)));

DROP POLICY IF EXISTS "permission_requests_insert_own" ON permission_requests;
CREATE POLICY "permission_requests_insert_own" ON permission_requests FOR INSERT
TO authenticated
WITH CHECK (
  requester_id = auth.uid()
  AND status = 'pending'
  AND resolved_at IS NULL
  AND donor_organization(donor_user_id) IS NOT NULL
);

DROP POLICY IF EXISTS "permission_requests_update_reviewer_or_retry" ON permission_requests;
CREATE POLICY "permission_requests_update_reviewer_or_retry" ON permission_requests FOR UPDATE
TO authenticated
USING (
  (requester_id = auth.uid() AND status = 'denied')
  OR is_verified_member(donor_organization(donor_user_id))
)
WITH CHECK (
  (requester_id = auth.uid() AND status = 'pending' AND resolved_at IS NULL)
  OR is_verified_member(donor_organization(donor_user_id))
);

REVOKE EXECUTE ON FUNCTION donor_organization(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION can_handle_request(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION complete_profile(text, text, text, text, text, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION register_as_donor(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION approve_volunteer(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION search_donors(text, uuid, text, text, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION donor_organization(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION can_handle_request(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_profile(text, text, text, text, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION register_as_donor(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_volunteer(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION search_donors(text, uuid, text, text, boolean, text) TO authenticated;
