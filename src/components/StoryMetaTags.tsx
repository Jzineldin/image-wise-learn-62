/**
 * StoryMetaTags Component
 *
 * Dynamically updates Open Graph and Twitter Card meta tags for individual stories
 * Enables rich social media previews when stories are shared
 */

import { Helmet } from 'react-helmet-async';

interface StoryMetaTagsProps {
  title: string;
  description?: string;
  imageUrl?: string;
  storyUrl?: string;
  authorName?: string;
}

export function StoryMetaTags({
  title,
  description,
  imageUrl,
  storyUrl,
  authorName,
}: StoryMetaTagsProps) {
  // Default values
  const defaultDescription = 'An interactive AI-powered story created on Tale Forge. Experience branching narratives and magical adventures!';
  const defaultImage = 'https://lovable.dev/opengraph-image-p98pqg.png'; // Fallback to Tale Forge logo
  const siteUrl = window.location.origin;
  const fullStoryUrl = storyUrl || window.location.href;

  // Prepare meta content
  const metaTitle = `${title} - Tale Forge`;
  const metaDescription = description || defaultDescription;
  const metaImage = imageUrl || defaultImage;
  const metaAuthor = authorName ? `Created by ${authorName}` : 'Created on Tale Forge';

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{metaTitle}</title>
      <meta name="title" content={metaTitle} />
      <meta name="description" content={metaDescription} />
      <meta name="author" content={metaAuthor} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="article" />
      <meta property="og:url" content={fullStoryUrl} />
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="Tale Forge" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={fullStoryUrl} />
      <meta property="twitter:title" content={metaTitle} />
      <meta property="twitter:description" content={metaDescription} />
      <meta property="twitter:image" content={metaImage} />
      <meta name="twitter:creator" content="@taleforge" />

      {/* Additional SEO */}
      <link rel="canonical" href={fullStoryUrl} />
    </Helmet>
  );
}
