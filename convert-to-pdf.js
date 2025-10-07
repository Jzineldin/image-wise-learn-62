import fs from 'fs';
import path from 'path';
import { marked } from 'marked';
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function convertMarkdownToPDF(inputFile, outputFile) {
  try {
    console.log(`📄 Reading ${inputFile}...`);
    
    // Read the markdown file
    const markdown = fs.readFileSync(inputFile, 'utf-8');
    
    console.log('🔄 Converting markdown to HTML...');
    
    // Convert markdown to HTML
    const htmlContent = marked.parse(markdown);
    
    // Create a styled HTML document
    const styledHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tale Forge Business Plan 2025</title>
  <style>
    @page {
      margin: 2cm;
      size: A4;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      font-size: 11pt;
    }
    
    h1 {
      color: #FF6B35;
      font-size: 28pt;
      margin-top: 30px;
      margin-bottom: 20px;
      border-bottom: 3px solid #FF6B35;
      padding-bottom: 10px;
      page-break-before: always;
    }
    
    h1:first-of-type {
      page-break-before: avoid;
    }
    
    h2 {
      color: #FF6B35;
      font-size: 20pt;
      margin-top: 25px;
      margin-bottom: 15px;
      border-bottom: 2px solid #FFB84D;
      padding-bottom: 8px;
    }
    
    h3 {
      color: #FF8C42;
      font-size: 16pt;
      margin-top: 20px;
      margin-bottom: 12px;
    }
    
    h4 {
      color: #666;
      font-size: 13pt;
      margin-top: 15px;
      margin-bottom: 10px;
    }
    
    p {
      margin-bottom: 12px;
      text-align: justify;
    }
    
    ul, ol {
      margin-bottom: 15px;
      padding-left: 25px;
    }
    
    li {
      margin-bottom: 8px;
    }
    
    strong {
      color: #FF6B35;
      font-weight: 600;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 10pt;
      page-break-inside: avoid;
    }
    
    th {
      background-color: #FF6B35;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: 600;
    }
    
    td {
      padding: 10px 12px;
      border-bottom: 1px solid #ddd;
    }
    
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    
    blockquote {
      border-left: 4px solid #FF6B35;
      padding-left: 20px;
      margin: 20px 0;
      font-style: italic;
      color: #666;
      background-color: #fff8f5;
      padding: 15px 20px;
    }
    
    code {
      background-color: #f4f4f4;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 10pt;
    }
    
    pre {
      background-color: #f4f4f4;
      padding: 15px;
      border-radius: 5px;
      overflow-x: auto;
      page-break-inside: avoid;
    }
    
    hr {
      border: none;
      border-top: 2px solid #FFB84D;
      margin: 30px 0;
    }
    
    .page-break {
      page-break-after: always;
    }
    
    /* Header styling */
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #FF6B35;
    }
    
    .confidential {
      color: #999;
      font-size: 10pt;
      font-style: italic;
      text-align: center;
      margin-top: 10px;
    }
    
    /* Footer for page numbers */
    @media print {
      .footer {
        position: fixed;
        bottom: 0;
        width: 100%;
        text-align: center;
        font-size: 9pt;
        color: #999;
      }
    }
  </style>
</head>
<body>
  ${htmlContent}
  
  <div class="footer">
    <p>Tale Forge Business Plan 2025 - Confidential</p>
  </div>
</body>
</html>
    `;
    
    console.log('🚀 Launching browser...');
    
    // Launch puppeteer
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    console.log('📝 Generating PDF...');
    
    // Set content and generate PDF
    await page.setContent(styledHTML, { waitUntil: 'networkidle0' });
    
    await page.pdf({
      path: outputFile,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="font-size: 9pt; color: #999; text-align: center; width: 100%; padding: 10px 0;">
          <span>Tale Forge Business Plan 2025 - Confidential</span>
          <span style="margin-left: 20px;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>
      `
    });
    
    await browser.close();
    
    console.log(`✅ PDF created successfully: ${outputFile}`);
    console.log(`📊 File size: ${(fs.statSync(outputFile).size / 1024).toFixed(2)} KB`);
    
  } catch (error) {
    console.error('❌ Error converting to PDF:', error);
    throw error;
  }
}

// Main execution
const inputFile = path.join(__dirname, 'Tale_Forge_Business_Plan_2025.md');
const outputFile = path.join(__dirname, 'Tale_Forge_Business_Plan_2025.pdf');

console.log('🎯 Tale Forge Business Plan - Markdown to PDF Converter\n');

convertMarkdownToPDF(inputFile, outputFile)
  .then(() => {
    console.log('\n🎉 Conversion complete!');
    console.log(`📁 PDF saved to: ${outputFile}`);
  })
  .catch((error) => {
    console.error('\n💥 Conversion failed:', error.message);
    process.exit(1);
  });

