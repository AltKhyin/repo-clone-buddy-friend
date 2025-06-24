
-- Create the Notifications table
CREATE TABLE public."Notifications" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  practitioner_id uuid NOT NULL,
  content text NOT NULL,
  link text NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "Notifications_pkey" PRIMARY KEY (id),
  CONSTRAINT "Notifications_practitioner_id_fkey" FOREIGN KEY (practitioner_id) REFERENCES public."Practitioners"(id) ON DELETE CASCADE
);

-- Add comments to the table and columns for clarity
COMMENT ON TABLE public."Notifications" IS 'Stores notifications for users.';
COMMENT ON COLUMN public."Notifications".practitioner_id IS 'The user who receives the notification.';
COMMENT ON COLUMN public."Notifications".link IS 'A URL to navigate to when the notification is clicked.';

-- Enable Row Level Security
ALTER TABLE public."Notifications" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies to ensure users can only access their own data
CREATE POLICY "Practitioners can view their own notifications."
ON public."Notifications"
FOR SELECT
USING (auth.uid() = practitioner_id);

CREATE POLICY "Practitioners can update their own notifications."
ON public."Notifications"
FOR UPDATE
USING (auth.uid() = practitioner_id);

-- Add the new table to the realtime publication to enable live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public."Notifications";

