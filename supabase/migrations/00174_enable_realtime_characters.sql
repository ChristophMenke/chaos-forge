-- Enable Supabase Realtime for characters table (GM Dashboard live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.characters;
