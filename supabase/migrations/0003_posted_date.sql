-- Auto-set posted_date when a post is marked posted (authoritative in DB).

CREATE OR REPLACE FUNCTION public.set_posted_date_on_post()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'posted' AND NEW.posted_date IS NULL THEN
    NEW.posted_date := coalesce(NEW.scheduled_date, current_date);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_posted_date_on_post
  BEFORE INSERT OR UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_posted_date_on_post();

-- Backfill existing posted rows missing posted_date.
UPDATE posts
SET posted_date = coalesce(scheduled_date, current_date)
WHERE status = 'posted'
  AND posted_date IS NULL;
