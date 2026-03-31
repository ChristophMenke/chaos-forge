-- Fix: "elemental sun" is not a valid sphere — remap to canonical "sun" sphere
UPDATE public.spells SET sphere = 'sun' WHERE sphere = 'elemental sun';
