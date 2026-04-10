-- Enable Supabase Realtime for shared tables across the app
-- Pattern already in use by characters (00174) and notifications (00177).

ALTER PUBLICATION supabase_realtime ADD TABLE public.party_loot_gold;
ALTER PUBLICATION supabase_realtime ADD TABLE public.party_loot_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.party_loot_log;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chronicle_quotes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chronicle_npcs;
