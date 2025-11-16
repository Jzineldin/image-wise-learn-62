-- Reset pending audio generations since ElevenLabs is working now
UPDATE story_segments 
SET audio_generation_status = NULL 
WHERE audio_generation_status = 'pending';

-- Reset failed story audio status to allow retry
UPDATE stories 
SET audio_generation_status = NULL 
WHERE audio_generation_status IN ('pending', 'failed');