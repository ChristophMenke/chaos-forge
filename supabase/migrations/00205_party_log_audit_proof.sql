-- Audit-proof Chronik: keine Löschungen auf party_loot_log mehr zulassen.
-- Die bisherige Delete-Policy erlaubte Owner ihre eigenen Einträge zu
-- entfernen, was die Chronik manipulierbar machte. Komplett sperren.

DROP POLICY IF EXISTS "Authenticated can delete party log" ON party_loot_log;
DROP POLICY IF EXISTS "Owner can delete party log" ON party_loot_log;

-- Ebenso UPDATE sperren, falls jemand später eine Edit-Funktion hinzufügt.
DROP POLICY IF EXISTS "Authenticated can update party log" ON party_loot_log;
DROP POLICY IF EXISTS "Owner can update party log" ON party_loot_log;
