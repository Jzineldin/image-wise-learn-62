/**
 * Chapter Details Drawer
 *
 * Edit per-chapter metadata:
 * - Chapter title
 * - Tags
 * - Age range
 * - Cover thumbnail
 */

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { Edit, Loader2, Sparkles, Image as ImageIcon, Tag } from 'lucide-react';

interface Chapter {
  id: string;
  segment_number: number;
  content: string;
  chapter_title?: string;
  chapter_tags?: string[];
  chapter_age_range?: string;
  chapter_cover_url?: string;
  details_status: string;
  missing_fields?: string[];
}

interface ChapterDetailsDrawerProps {
  open: boolean;
  onClose: () => void;
  chapter: Chapter;
  storyId: string;
  onSuccess: () => void;
}

// Age range options
const AGE_RANGES = [
  { value: '3-6', label: '3-6 years (Preschool)' },
  { value: '7-9', label: '7-9 years (Early Elementary)' },
  { value: '10-12', label: '10-12 years (Late Elementary)' },
  { value: '13+', label: '13+ years (Teen)' },
];

export function ChapterDetailsDrawer({
  open,
  onClose,
  chapter,
  storyId,
  onSuccess,
}: ChapterDetailsDrawerProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState(chapter.chapter_title || '');
  const [tags, setTags] = useState<string>(
    chapter.chapter_tags?.join(', ') || ''
  );
  const [ageRange, setAgeRange] = useState(chapter.chapter_age_range || '');
  const [coverUrl, setCoverUrl] = useState(chapter.chapter_cover_url || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);

      // Parse tags
      const tagArray = tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      // Determine missing fields
      const missingFields: string[] = [];
      if (!title) missingFields.push('title');
      if (tagArray.length === 0) missingFields.push('tags');
      if (!ageRange) missingFields.push('age_range');
      if (!coverUrl) missingFields.push('cover');

      const detailsStatus = missingFields.length === 0 ? 'complete' : 'incomplete';

      logger.info('Saving chapter details', {
        chapterId: chapter.id,
        storyId,
        title,
        tags: tagArray,
        ageRange,
        coverUrl,
        detailsStatus,
        missingFields,
      });

      // Track analytics - edit opened
      if (window.gtag) {
        window.gtag('event', 'chapter_details_edit_opened', {
          story_id: storyId,
          chapter_id: chapter.id,
          chapter_number: chapter.segment_number,
        });
      }

      // Update chapter details
      const { error } = await supabase
        .from('story_segments')
        .update({
          chapter_title: title || null,
          chapter_tags: tagArray.length > 0 ? tagArray : null,
          chapter_age_range: ageRange || null,
          chapter_cover_url: coverUrl || null,
          details_status: detailsStatus,
          missing_fields: missingFields.length > 0 ? missingFields : null,
        })
        .eq('id', chapter.id);

      if (error) throw error;

      // Track analytics - saved
      if (window.gtag) {
        window.gtag('event', 'chapter_details_saved', {
          story_id: storyId,
          chapter_id: chapter.id,
          chapter_number: chapter.segment_number,
          details_status: detailsStatus,
          missing_count: missingFields.length,
        });
      }

      toast({
        title: 'Details Saved!',
        description:
          detailsStatus === 'complete'
            ? `Chapter ${chapter.segment_number} details are now complete.`
            : `Chapter ${chapter.segment_number} details updated (${missingFields.length} field${missingFields.length > 1 ? 's' : ''} still missing).`,
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      logger.error('Failed to save chapter details', error);

      toast({
        title: 'Save Failed',
        description: error.message || 'Failed to save chapter details. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-lg bg-[rgba(17,17,22,.95)] border-[rgba(242,181,68,.25)] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl font-heading text-[#F4E3B2] flex items-center gap-2">
            <Edit className="w-6 h-6" />
            Edit Chapter Details
          </SheetTitle>
          <SheetDescription className="text-[#C9C5D5]">
            Chapter {chapter.segment_number}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Chapter Title */}
          <div>
            <Label htmlFor="title" className="text-[#F4E3B2]">
              Chapter Title
            </Label>
            <Input
              id="title"
              placeholder={`Chapter ${chapter.segment_number}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2 bg-[rgba(17,17,22,.5)] border-[rgba(242,181,68,.25)] text-[#F4E3B2]"
            />
            <p className="text-xs text-[#C9C5D5] mt-1">
              Give this chapter a memorable title
            </p>
          </div>

          {/* Tags */}
          <div>
            <Label htmlFor="tags" className="text-[#F4E3B2] flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Tags
            </Label>
            <Input
              id="tags"
              placeholder="adventure, magic, friendship (comma-separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="mt-2 bg-[rgba(17,17,22,.5)] border-[rgba(242,181,68,.25)] text-[#F4E3B2]"
            />
            <p className="text-xs text-[#C9C5D5] mt-1">
              Add tags to help categorize this chapter (separate with commas)
            </p>
          </div>

          {/* Age Range */}
          <div>
            <Label htmlFor="age-range" className="text-[#F4E3B2]">
              Age Range
            </Label>
            <Select value={ageRange} onValueChange={setAgeRange}>
              <SelectTrigger
                id="age-range"
                className="mt-2 bg-[rgba(17,17,22,.5)] border-[rgba(242,181,68,.25)] text-[#F4E3B2]"
              >
                <SelectValue placeholder="Select age range..." />
              </SelectTrigger>
              <SelectContent className="bg-[rgba(17,17,22,.95)] border-[rgba(242,181,68,.25)]">
                {AGE_RANGES.map((range) => (
                  <SelectItem
                    key={range.value}
                    value={range.value}
                    className="text-[#F4E3B2] focus:bg-[rgba(242,181,68,.15)]"
                  >
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-[#C9C5D5] mt-1">
              Specify the target age range for this chapter
            </p>
          </div>

          {/* Cover/Thumbnail URL */}
          <div>
            <Label htmlFor="cover" className="text-[#F4E3B2] flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Cover Thumbnail URL
            </Label>
            <Input
              id="cover"
              type="url"
              placeholder="https://example.com/thumbnail.jpg"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              className="mt-2 bg-[rgba(17,17,22,.5)] border-[rgba(242,181,68,.25)] text-[#F4E3B2]"
            />
            <p className="text-xs text-[#C9C5D5] mt-1">
              Optional: Add a custom cover image URL for this chapter
            </p>
          </div>

          {/* Cover Preview */}
          {coverUrl && (
            <div>
              <Label className="text-[#F4E3B2]">Preview</Label>
              <div className="mt-2 rounded-lg overflow-hidden border border-[rgba(242,181,68,.15)]">
                <img
                  src={coverUrl}
                  alt="Cover preview"
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    toast({
                      title: 'Invalid Image',
                      description: 'The cover URL appears to be invalid.',
                      variant: 'destructive',
                    });
                  }}
                />
              </div>
            </div>
          )}

          {/* Missing Fields Warning */}
          {chapter.missing_fields && chapter.missing_fields.length > 0 && (
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-yellow-500 mb-1">Incomplete Details</h4>
                  <p className="text-sm text-yellow-200/80 mb-2">
                    Missing: {chapter.missing_fields.join(', ')}
                  </p>
                  <p className="text-xs text-yellow-200/60">
                    Fill in the missing information to mark this chapter as complete.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} disabled={saving} className="flex-1">
              Cancel
            </Button>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-[rgba(242,181,68,.15)] text-[#F4E3B2] border-2 border-[rgba(242,181,68,.35)] hover:bg-[rgba(242,181,68,.25)]"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Save Details
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-[#C9C5D5] text-center italic">
            Complete all fields to mark this chapter's details as ready.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
