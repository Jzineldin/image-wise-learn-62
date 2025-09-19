import { memo } from 'react';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  allowHtml?: boolean;
  components?: Record<string, React.ComponentType<any>>;
}

// Context7 Pattern: Safe URL transformation for security
const defaultUrlTransform = (url: string): string => {
  // Allow specific protocols and relative URLs for security
  const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
  
  try {
    // Handle relative URLs
    if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
      return url;
    }
    
    const urlObj = new URL(url);
    if (allowedProtocols.includes(urlObj.protocol)) {
      return url;
    }
    
    // Block potentially dangerous protocols
    return '#';
  } catch {
    // Invalid URL, return safe fallback
    return '#';
  }
};

// Context7 Pattern: Custom component overrides for styling
const defaultComponents = {
  // Headings with custom styling
  h1: ({ children, ...props }: any) => (
    <h1 
      className="text-3xl font-heading font-bold text-text-primary mb-6 border-b border-border pb-2" 
      {...props}
    >
      {children}
    </h1>
  ),
  
  h2: ({ children, ...props }: any) => (
    <h2 
      className="text-2xl font-heading font-semibold text-text-primary mb-4 mt-8" 
      {...props}
    >
      {children}
    </h2>
  ),
  
  h3: ({ children, ...props }: any) => (
    <h3 
      className="text-xl font-heading font-medium text-text-primary mb-3 mt-6" 
      {...props}
    >
      {children}
    </h3>
  ),
  
  // Paragraphs with proper spacing
  p: ({ children, ...props }: any) => (
    <p 
      className="text-text-secondary leading-relaxed mb-4" 
      {...props}
    >
      {children}
    </p>
  ),
  
  // Links with security and styling
  a: ({ href, children, ...props }: any) => (
    <a
      href={defaultUrlTransform(href || '#')}
      className="text-primary hover:text-primary/80 underline transition-colors"
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      {...props}
    >
      {children}
    </a>
  ),
  
  // Code blocks with syntax highlighting styling
  code: ({ children, className, ...props }: any) => {
    const isInline = !className;
    
    if (isInline) {
      return (
        <code 
          className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-text-primary" 
          {...props}
        >
          {children}
        </code>
      );
    }
    
    // Block code - could be enhanced with syntax highlighting
    return (
      <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4">
        <code 
          className="text-sm font-mono text-text-primary" 
          {...props}
        >
          {children}
        </code>
      </pre>
    );
  },
  
  // Lists with proper styling
  ul: ({ children, ...props }: any) => (
    <ul 
      className="list-disc list-inside mb-4 space-y-1 text-text-secondary" 
      {...props}
    >
      {children}
    </ul>
  ),
  
  ol: ({ children, ...props }: any) => (
    <ol 
      className="list-decimal list-inside mb-4 space-y-1 text-text-secondary" 
      {...props}
    >
      {children}
    </ol>
  ),
  
  li: ({ children, ...props }: any) => (
    <li className="leading-relaxed" {...props}>
      {children}
    </li>
  ),
  
  // Blockquotes
  blockquote: ({ children, ...props }: any) => (
    <blockquote 
      className="border-l-4 border-primary pl-4 italic text-text-secondary mb-4" 
      {...props}
    >
      {children}
    </blockquote>
  ),
  
  // Tables
  table: ({ children, ...props }: any) => (
    <div className="overflow-x-auto mb-4">
      <table 
        className="min-w-full border-collapse border border-border" 
        {...props}
      >
        {children}
      </table>
    </div>
  ),
  
  th: ({ children, ...props }: any) => (
    <th 
      className="border border-border bg-muted px-4 py-2 text-left font-semibold text-text-primary" 
      {...props}
    >
      {children}
    </th>
  ),
  
  td: ({ children, ...props }: any) => (
    <td 
      className="border border-border px-4 py-2 text-text-secondary" 
      {...props}
    >
      {children}
    </td>
  ),
};

// Context7 Pattern: Simple markdown parser for basic formatting
const parseMarkdown = (content: string): string => {
  return content
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    
    // Bold and italic
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    
    // Code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    
    // Line breaks
    .replace(/\n/g, '<br>');
};

// Context7 Pattern: Memoized markdown renderer component
export const MarkdownRenderer = memo(({
  content,
  className,
  allowHtml = false,
  components = {}
}: MarkdownRendererProps) => {
  const mergedComponents = { ...defaultComponents, ...components };
  
  // For now, use simple HTML parsing since react-markdown isn't installed
  // In a real implementation, you would use react-markdown with these components
  const processedContent = parseMarkdown(content);
  
  return (
    <div 
      className={cn(
        "prose prose-slate max-w-none",
        "prose-headings:font-heading prose-headings:text-text-primary",
        "prose-p:text-text-secondary prose-p:leading-relaxed",
        "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
        "prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded",
        "prose-pre:bg-muted prose-pre:border prose-pre:border-border",
        className
      )}
      dangerouslySetInnerHTML={allowHtml ? { __html: processedContent } : undefined}
    >
      {!allowHtml && content}
    </div>
  );
});

MarkdownRenderer.displayName = 'MarkdownRenderer';

// Context7 Pattern: Story content renderer with enhanced formatting
export const StoryContentRenderer = memo(({ 
  content, 
  className 
}: { 
  content: string; 
  className?: string; 
}) => (
  <MarkdownRenderer
    content={content}
    className={cn("story-content", className)}
    allowHtml={false} // Keep stories safe
    components={{
      // Custom story-specific components
      p: ({ children, ...props }: any) => (
        <p 
          className="text-text-primary leading-relaxed mb-4 text-lg" 
          {...props}
        >
          {children}
        </p>
      ),
    }}
  />
));
