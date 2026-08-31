-- Quantitative VoicePrint metrics (Feature B) alongside the existing
-- prose analysis_summary — computed deterministically in
-- lib/voiceprint/metrics.ts, not guessed by the LLM.
alter table public.voice_profiles
  add column if not exists avg_wpm integer,
  add column if not exists avg_sentence_length numeric,
  add column if not exists vocabulary_richness numeric,
  add column if not exists top_catchphrases jsonb,
  add column if not exists source text not null default 'own_scripts';
