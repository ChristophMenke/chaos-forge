-- Fix: Add search_path pinning and explicit GRANT for distribute_gold RPC
CREATE OR REPLACE FUNCTION distribute_gold(
  char_id uuid, pp int, gp int, ep int, sp int, cp int
) RETURNS void AS $$
  UPDATE characters SET
    gold_pp = gold_pp + pp,
    gold_gp = gold_gp + gp,
    gold_ep = gold_ep + ep,
    gold_sp = gold_sp + sp,
    gold_cp = gold_cp + cp
  WHERE id = char_id;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION distribute_gold(uuid, int, int, int, int, int) TO authenticated;
REVOKE EXECUTE ON FUNCTION distribute_gold(uuid, int, int, int, int, int) FROM public;
