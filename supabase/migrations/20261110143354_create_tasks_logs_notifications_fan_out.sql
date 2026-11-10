/*
# Volunteer tasks, field logs and emergency alert notifications

Plain-English summary: when someone posts a blood request, the database automatically alerts the verified admins and active volunteers of the relevant NGO(s). For requests tied to one NGO it also creates a follow-up task for that NGO's volunteers. Alerts appear in each person's notification inbox in real time.

1. New Tables
- `volunteer_tasks`: follow-up work for an organization, usually created from a blood request. Volunteers can mark them done.
- `volunteer_logs`: field activity notes written by verified volunteers. Visible to their organization's verified members.
- `notifications`: per-person alert inbox entries. Created only by the database when a request is posted.

2. Automation
- Trigger `blood_request_fan_out` runs after a blood request is inserted. It:
  - Creates one notification for every verified member (admin or volunteer) of the matched organization. If the request has no organization, it notifies every verified member of NGOs in the same district.
  - Skips the person who posted the request.
  - Creates a volunteer task for the organization when the request is assigned to one.

3. Security
- Row level security enabled on all three tables.
- `volunteer_tasks`: visible to verified members of the organization. Only the done flag can be changed.
- `volunteer_logs`: visible to verified members of the organization. Volunteers can add logs only as themselves and only for an organization they belong to.
- `notifications`: each person can read and mark only their own notifications as read. Nobody can insert notifications directly.
- The trigger function is not callable by any app role.
- `notifications` is added to the realtime publication so the app receives new alerts instantly. Realtime respects the same row rules.

4. Important notes
- 1. Notifications reach the in-app inbox and the realtime channel. Operating-system push notifications need a push provider and are not part of this migration.
- 2. Every statement is idempotent, so this migration is safe to re-run.
*/

CREATE TABLE IF NOT EXISTS volunteer_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  request_id uuid REFERENCES blood_requests(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 3 AND 200),
  district text NOT NULL,
  thana text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  due_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS volunteer_tasks_organization_idx ON volunteer_tasks (organization_id, done);

CREATE TABLE IF NOT EXISTS volunteer_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  volunteer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('visit', 'donation', 'awareness', 'other')),
  note text NOT NULL CHECK (char_length(btrim(note)) BETWEEN 10 AND 500),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS volunteer_logs_organization_idx ON volunteer_logs (organization_id, created_at DESC);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  request_id uuid REFERENCES blood_requests(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

CREATE INDEX IF NOT EXISTS notifications_recipient_idx ON notifications (recipient_id, created_at DESC);

CREATE OR REPLACE FUNCTION fan_out_blood_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title text;
  v_body text;
BEGIN
  v_title := CASE WHEN NEW.urgency = 'critical' THEN 'SOS: ' ELSE '' END
    || NEW.blood_group || ' blood needed (' || NEW.units_needed || ' unit' || CASE WHEN NEW.units_needed > 1 THEN 's' ELSE '' END || ')';
  v_body := NEW.patient_name || ' at ' || NEW.hospital || ', ' || NEW.thana || ', ' || NEW.district;

  INSERT INTO notifications (recipient_id, request_id, organization_id, title, body)
  SELECT DISTINCT m.user_id, NEW.id, NEW.organization_id, v_title, v_body
  FROM organization_members m
  JOIN organizations o ON o.id = m.organization_id
  WHERE m.verified
    AND m.user_id <> NEW.requester_id
    AND (
      (NEW.organization_id IS NOT NULL AND o.id = NEW.organization_id)
      OR (NEW.organization_id IS NULL AND o.district = NEW.district)
    );

  IF NEW.organization_id IS NOT NULL THEN
    INSERT INTO volunteer_tasks (organization_id, request_id, title, district, thana, due_at)
    VALUES (
      NEW.organization_id,
      NEW.id,
      'Coordinate donors for ' || NEW.patient_name || ' (' || NEW.blood_group || ')',
      NEW.district,
      NEW.thana,
      NEW.deadline
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS blood_request_fan_out ON blood_requests;
CREATE TRIGGER blood_request_fan_out
AFTER INSERT ON blood_requests
FOR EACH ROW EXECUTE FUNCTION fan_out_blood_request();

REVOKE EXECUTE ON FUNCTION fan_out_blood_request() FROM PUBLIC, anon, authenticated;

ALTER TABLE volunteer_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON volunteer_tasks TO authenticated;
GRANT UPDATE (done) ON volunteer_tasks TO authenticated;
GRANT SELECT, INSERT ON volunteer_logs TO authenticated;
GRANT SELECT, UPDATE (read_at) ON notifications TO authenticated;

DROP POLICY IF EXISTS "volunteer_tasks_select_members" ON volunteer_tasks;
CREATE POLICY "volunteer_tasks_select_members" ON volunteer_tasks FOR SELECT
TO authenticated USING (is_verified_member(organization_id));

DROP POLICY IF EXISTS "volunteer_tasks_update_members" ON volunteer_tasks;
CREATE POLICY "volunteer_tasks_update_members" ON volunteer_tasks FOR UPDATE
TO authenticated
USING (is_verified_member(organization_id))
WITH CHECK (is_verified_member(organization_id));

DROP POLICY IF EXISTS "volunteer_logs_select_members" ON volunteer_logs;
CREATE POLICY "volunteer_logs_select_members" ON volunteer_logs FOR SELECT
TO authenticated USING (is_verified_member(organization_id));

DROP POLICY IF EXISTS "volunteer_logs_insert_own" ON volunteer_logs;
CREATE POLICY "volunteer_logs_insert_own" ON volunteer_logs FOR INSERT
TO authenticated
WITH CHECK (volunteer_id = auth.uid() AND is_verified_member(organization_id));

DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT
TO authenticated USING (recipient_id = auth.uid());

DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE
TO authenticated
USING (recipient_id = auth.uid())
WITH CHECK (recipient_id = auth.uid());

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END $$;
