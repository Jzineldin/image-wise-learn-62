import html2pdf from 'html2pdf.js';

/**
 * Story segment interface matching our database schema
 */
interface StorySegment {
  segment_number: number;
  content?: string;
  segment_text?: string;
  image_url?: string;
}

/**
 * Export a Tale Forge story to PDF format
 * 
 * @param title - The story title
 * @param segments - Array of story segments
 * @returns Promise that resolves when PDF is generated and downloaded
 */
export const exportStoryToPDF = async (
  title: string,
  segments: StorySegment[]
): Promise<void> => {
  try {
    // Validate inputs
    if (!title || title.trim() === '') {
      throw new Error('Story title is required');
    }

    if (!segments || segments.length === 0) {
      throw new Error('Story must have at least one segment');
    }

    // Sort segments by segment_number to ensure correct order
    const sortedSegments = [...segments].sort(
      (a, b) => a.segment_number - b.segment_number
    );

    // Build HTML content for the PDF
    const htmlContent = buildPDFContent(title, sortedSegments);

    // Configure PDF options
    const pdfOptions = {
      margin: [0.5, 0.75, 0.5, 0.75], // top, right, bottom, left (in inches)
      filename: generateFilename(title),
      image: {
        type: 'jpeg',
        quality: 0.95
      },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        logging: false,
        allowTaint: true,
        windowWidth: 816, // 8.5 inches at 96 DPI
        windowHeight: 1056 // 11 inches at 96 DPI
      },
      jsPDF: {
        unit: 'in',
        format: 'letter',
        orientation: 'portrait',
        compress: true
      },
      pagebreak: {
        mode: 'css',
        before: ['.segment', '.footer-page'],
        after: '.title-page'
      }
    };

    // Generate and download PDF
    await html2pdf()
      .set(pdfOptions)
      .from(htmlContent)
      .save();

  } catch (error) {
    console.error('PDF export error:', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Failed to export PDF. Please try again.'
    );
  }
};

/**
 * Build the HTML content for the PDF
 */
function buildPDFContent(title: string, segments: StorySegment[]): string {
  const segmentsHTML = segments
    .map((segment, index) => {
      // Use content or segment_text, whichever is available
      const text = segment.content || segment.segment_text || '';
      const imageUrl = segment.image_url;

      return `
        <div class="segment" style="page-break-before: always; padding: 20px 0;">
          <div style="margin-bottom: 30px;">
            <h2 style="
              font-size: 18pt;
              color: #2c3e50;
              margin: 0 0 30px 0;
              font-weight: bold;
              text-align: center;
            ">
              Chapter ${segment.segment_number}
            </h2>
          </div>

          ${imageUrl ? `
            <div style="text-align: center; margin-bottom: 30px;">
              <img
                src="${imageUrl}"
                alt="Chapter ${segment.segment_number} illustration"
                style="
                  max-width: 90%;
                  max-height: 350px;
                  object-fit: contain;
                  border-radius: 8px;
                "
                crossorigin="anonymous"
              />
            </div>
          ` : ''}

          <div style="margin-top: 30px;">
            <p style="
              line-height: 1.8;
              font-size: 12pt;
              text-align: justify;
              margin: 0;
              color: #1a1a1a;
              white-space: pre-wrap;
            ">
              ${escapeHtml(text)}
            </p>
          </div>
        </div>
      `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @page {
            margin: 0.75in;
          }
          body {
            font-family: 'Georgia', 'Times New Roman', serif;
            color: #1a1a1a;
            line-height: 1.6;
            margin: 0;
            padding: 0;
          }
          .title-page {
            page-break-after: always;
            text-align: center;
            padding-top: 150px;
          }
          .segment {
            page-break-before: always;
          }
          .footer-page {
            page-break-before: always;
            text-align: center;
            padding-top: 200px;
          }
        </style>
      </head>
      <body>
        <!-- Title Page -->
        <div class="title-page">
          <h1 style="
            font-size: 32pt;
            margin-bottom: 40px;
            color: #2c3e50;
            font-weight: bold;
          ">
            ${escapeHtml(title)}
          </h1>
          <div style="
            margin-top: 150px;
            font-size: 11pt;
            color: #7f8c8d;
          ">
            <p style="margin: 8px 0;">Created with Tale Forge</p>
            <p style="margin: 8px 0;">tale-forge.app</p>
          </div>
        </div>

        <!-- Story Content -->
        ${segmentsHTML}

        <!-- Footer Page -->
        <div class="footer-page">
          <p style="margin: 8px 0; font-size: 14pt; color: #2c3e50; font-weight: bold;">Thank you for reading!</p>
          <p style="margin: 20px 0 8px 0; font-size: 10pt; color: #95a5a6;">This story was created with Tale Forge</p>
          <p style="margin: 8px 0; font-size: 10pt; color: #95a5a6;">An AI-powered interactive storytelling platform for kids</p>
          <p style="margin: 8px 0; font-size: 10pt; color: #95a5a6;">Visit us at tale-forge.app</p>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generate a safe filename from the story title
 */
function generateFilename(title: string): string {
  // Remove special characters and replace spaces with underscores
  const safeTitle = title
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50); // Limit length

  // Add timestamp to ensure uniqueness
  const timestamp = new Date().getTime();
  
  return `${safeTitle}_${timestamp}.pdf`;
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Export multiple stories to a single PDF (future enhancement)
 */
export const exportMultipleStoriesToPDF = async (
  stories: Array<{ title: string; segments: StorySegment[] }>
): Promise<void> => {
  // TODO: Implement batch export functionality
  throw new Error('Batch export not yet implemented');
};

