/**
 * Global type declarations
 */

// Google Analytics gtag types
interface Window {
  gtag?: (
    command: 'event' | 'config' | 'set' | 'js',
    targetId: string,
    config?: Record<string, any>
  ) => void;
}

// Extend html2pdf types
declare module 'html2pdf.js' {
  interface Html2PdfOptions {
    margin?: number | [number, number] | [number, number, number, number];
    filename?: string;
    image?: {
      type?: string;
      quality?: number;
    };
    html2canvas?: any;
    jsPDF?: any;
    pagebreak?: any;
  }
}
