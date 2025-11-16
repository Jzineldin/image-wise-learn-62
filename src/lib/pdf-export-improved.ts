import html2pdf from 'html2pdf.js';
import { logger } from './logger';

/**
 * Story segment interface matching our database schema
 */
interface StorySegment {
  segment_number: number;
  content?: string;
  segment_text?: string;
  image_url?: string;
  chapter_title?: string;
}

/**
 * Export a Tale Forge story to PDF format with improved formatting
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

    logger.info('Starting PDF export', { title, segmentCount: segments.length });

    // Sort segments by segment_number to ensure correct order
    const sortedSegments = [...segments].sort(
      (a, b) => a.segment_number - b.segment_number
    );

    // Build HTML content for the PDF
    const htmlContent = buildPDFContent(title, sortedSegments);

    // Configure PDF options with improved settings
    const pdfOptions = {
      margin: [0.5, 0.5, 0.5, 0.5] as [number, number, number, number],
      filename: generateFilename(title),
      image: {
        type: 'jpeg' as const,
        quality: 0.98
      },
      html2canvas: {
        scale: 2.5, // Higher resolution for better quality
        useCORS: true,
        letterRendering: true,
        logging: false,
        allowTaint: true,
        windowWidth: 1200, // Larger canvas for better quality
        windowHeight: 1600,
        backgroundColor: '#ffffff'
      },
      jsPDF: {
        unit: 'in',
        format: 'letter',
        orientation: 'portrait' as const,
        compress: true
      },
      pagebreak: {
        mode: ['avoid-all', 'css', 'legacy'] as any,
        before: ['.page-break-before'],
        after: ['.page-break-after'],
        avoid: ['.no-break', 'img']
      }
    };

    // Generate and download PDF
    await html2pdf()
      .set(pdfOptions)
      .from(htmlContent)
      .save();

    logger.info('PDF export completed successfully', { filename: pdfOptions.filename });

  } catch (error) {
    logger.error('PDF export failed', error);
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Failed to export PDF. Please try again.'
    );
  }
};

/**
 * Build the HTML content for the PDF with improved children's book styling
 */
function buildPDFContent(title: string, segments: StorySegment[]): string {
  const segmentsHTML = segments
    .map((segment) => {
      const text = segment.content || segment.segment_text || '';
      const imageUrl = segment.image_url;
      const chapterTitle = segment.chapter_title;

      return `
        <div class="page-break-before no-break" style="
          min-height: 100%;
          padding: 40px 30px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
        ">
          <!-- Chapter Header -->
          <div style="margin-bottom: 25px; text-align: center;">
            <div style="
              font-size: 14pt;
              color: #7f8c8d;
              font-weight: 600;
              letter-spacing: 2px;
              text-transform: uppercase;
              margin-bottom: 8px;
            ">
              Chapter ${segment.segment_number}
            </div>
            ${chapterTitle ? `
              <h2 style="
                font-size: 20pt;
                color: #2c3e50;
                margin: 0;
                font-weight: bold;
                font-family: 'Georgia', 'Palatino', serif;
              ">
                ${escapeHtml(chapterTitle)}
              </h2>
            ` : ''}
          </div>

          ${imageUrl ? `
            <!-- Chapter Image -->
            <div class="no-break" style="
              text-align: center;
              margin: 20px 0 30px 0;
              page-break-inside: avoid;
            ">
              <img
                src="${imageUrl}"
                alt="Chapter ${segment.segment_number} illustration"
                style="
                  max-width: 100%;
                  max-height: 400px;
                  width: auto;
                  height: auto;
                  object-fit: contain;
                  border-radius: 12px;
                  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                "
                crossorigin="anonymous"
              />
            </div>
          ` : ''}

          <!-- Chapter Text -->
          <div style="
            flex: 1;
            display: flex;
            align-items: flex-start;
            justify-content: center;
            padding: 0 10px;
          ">
            <p style="
              font-family: 'Georgia', 'Palatino', 'Times New Roman', serif;
              font-size: 13pt;
              line-height: 1.9;
              text-align: justify;
              margin: 0;
              color: #1a1a1a;
              white-space: pre-wrap;
              word-wrap: break-word;
              hyphens: auto;
            ">
              ${escapeHtml(text)}
            </p>
          </div>

          <!-- Page Number -->
          <div style="
            text-align: center;
            margin-top: 30px;
            font-size: 10pt;
            color: #95a5a6;
          ">
            ${segment.segment_number}
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
            size: letter;
            margin: 0;
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 0;
            font-family: 'Georgia', 'Palatino', 'Times New Roman', serif;
            color: #1a1a1a;
            background: white;
          }

          .page-break-before {
            page-break-before: always;
            page-break-inside: avoid;
          }

          .page-break-after {
            page-break-after: always;
          }

          .no-break {
            page-break-inside: avoid;
          }

          .title-page {
            height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 60px;
            page-break-after: always;
            background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
          }

          .footer-page {
            height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 60px;
            page-break-before: always;
            background: linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%);
          }

          img {
            page-break-inside: avoid;
            page-break-before: avoid;
            page-break-after: avoid;
          }
        </style>
      </head>
      <body>
        <!-- Title Page -->
        <div class="title-page">
          <div style="
            border: 3px solid #2c3e50;
            padding: 50px 40px;
            border-radius: 20px;
            background: white;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          ">
            <h1 style="
              font-size: 38pt;
              margin: 0 0 20px 0;
              color: #2c3e50;
              font-weight: bold;
              font-family: 'Georgia', 'Palatino', serif;
              line-height: 1.2;
            ">
              ${escapeHtml(title)}
            </h1>
            <div style="
              width: 60px;
              height: 3px;
              background: linear-gradient(90deg, #3498db, #9b59b6);
              margin: 20px auto;
            "></div>
            <p style="
              font-size: 16pt;
              color: #7f8c8d;
              margin: 20px 0 0 0;
              font-style: italic;
            ">
              A Tale Forge Story
            </p>
          </div>

          <div style="
            position: absolute;
            bottom: 60px;
            font-size: 10pt;
            color: #95a5a6;
          ">
            <p style="margin: 8px 0;">Created with Tale Forge</p>
            <p style="margin: 8px 0;">tale-forge.app</p>
          </div>
        </div>

        <!-- Story Content -->
        ${segmentsHTML}

        <!-- Footer Page -->
        <div class="footer-page">
          <div style="max-width: 500px;">
            <p style="
              font-size: 24pt;
              color: #2c3e50;
              font-weight: bold;
              margin: 0 0 30px 0;
            ">
              The End
            </p>
            <div style="
              width: 80px;
              height: 3px;
              background: linear-gradient(90deg, #3498db, #9b59b6);
              margin: 0 auto 30px auto;
            "></div>
            <p style="
              font-size: 14pt;
              color: #7f8c8d;
              margin: 15px 0;
              line-height: 1.6;
            ">
              This story was created with Tale Forge, an AI-powered interactive storytelling platform designed to spark imagination and creativity in children.
            </p>
            <p style="
              font-size: 12pt;
              color: #95a5a6;
              margin: 25px 0 0 0;
            ">
              Visit us at <strong>tale-forge.app</strong>
            </p>
          </div>
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

  return `TaleForge_${safeTitle}_${timestamp}.pdf`;
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
