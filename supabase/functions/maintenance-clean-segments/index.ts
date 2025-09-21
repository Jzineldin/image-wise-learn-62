import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { CreditService } from '../_shared/credit-system.ts';
import { ResponseHandler } from '../_shared/response-handlers.ts';

interface CleanRequest {
  dry_run?: boolean;
  limit?: number; // for safety
}

function stripChoices(content: string): { cleaned: string; removed: boolean } {
  if (!content) return { cleaned: content, removed: false };
  // 1) If explicit CHOICES: header present
  const hdr = content.search(/^\s*CHOICES:/mi);
  if (hdr >= 0) {
    const cleaned = content.slice(0, hdr).trim();
    return { cleaned, removed: cleaned.length !== content.length };
  }
  // 2) Otherwise remove trailing numbered choice lines
  const pat = /(?:^|\n)\s*(?:Choice\s*\d+:|Option\s*\d+:|\d+\.)/g;
  let lastIndex = -1;
  let m: RegExpExecArray | null;
  while ((m = pat.exec(content)) !== null) lastIndex = m.index;
  if (lastIndex >= 0) {
    return { cleaned: content.slice(0, lastIndex).trim(), removed: true };
  }
  return { cleaned: content, removed: false };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return ResponseHandler.corsOptions();
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return ResponseHandler.error('No authorization header', 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const creditService = new CreditService(supabaseUrl, supabaseKey, authHeader);
    const userId = await creditService.getUserId();

    const body: CleanRequest = await req.json().catch(() => ({}));
    const dryRun = body.dry_run !== false; // default true unless explicitly false
    const pageSize = Math.min(Math.max(body.limit ?? 500, 50), 2000);

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch story IDs for this user
    const { data: stories, error: storyErr } = await supabase
      .from('stories')
      .select('id')
      .eq('user_id', userId)
      .limit(5000);
    if (storyErr) throw storyErr;
    const storyIds = (stories ?? []).map(s => s.id);

    let totalChecked = 0;
    let totalUpdated = 0;
    const updatedIds: string[] = [];

    // Process in pages
    for (let i = 0; i < storyIds.length; i += 100) {
      const batch = storyIds.slice(i, i + 100);
      const { data: segs, error: segErr } = await supabase
        .from('story_segments')
        .select('id, content, segment_text, story_id')
        .in('story_id', batch)
        .limit(pageSize);
      if (segErr) throw segErr;

      for (const seg of segs ?? []) {
        totalChecked++;
        const original = seg.content || seg.segment_text || '';
        const { cleaned, removed } = stripChoices(String(original));
        if (!removed) continue;

        if (!dryRun) {
          const { error: upErr } = await supabase
            .from('story_segments')
            .update({ content: cleaned, segment_text: cleaned })
            .eq('id', seg.id);
          if (upErr) throw upErr;
        }
        totalUpdated++;
        updatedIds.push(seg.id);
      }
    }

    return ResponseHandler.success({
      dryRun,
      userId,
      totalChecked,
      totalUpdated,
      updatedIds: updatedIds.slice(0, 50), // trim response size
    });
  } catch (error) {
    console.error('maintenance-clean-segments error', error);
    return ResponseHandler.error(error.message || 'Cleanup failed', 500);
  }
});

