-- RPC function for GM gold distribution (atomic increment, no race conditions)
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
$$ LANGUAGE sql SECURITY DEFINER;
