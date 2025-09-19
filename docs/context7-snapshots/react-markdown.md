# React Markdown Documentation
*Retrieved from Context7 MCP: `/remarkjs/react-markdown`*
*Topic: rendering markdown safely custom components styling and customization security best practices*
*Tokens: 2500*
*Retrieved: 2025-09-18*

## Custom Components and Styling

### Basic Component Customization
**Source**: https://github.com/remarkjs/react-markdown/blob/main/readme.md#_snippet_13

```js
<Markdown
  components={{
    // Map `h1` (`# heading`) to use `h2`s.
    h1: 'h2',
    // Rewrite `em`s (`*like so*`) to `i` with a red foreground color.
    em(props) {
      const {node, ...rest} = props
      return <i style={{color: 'red'}} {...rest} />
    }
  }}
/>
```

### Syntax Highlighting with Custom Components
**Source**: https://github.com/remarkjs/react-markdown/blob/main/readme.md#_snippet_9

```js
import React from 'react'
import {createRoot} from 'react-dom/client'
import Markdown from 'react-markdown'
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter'
import {dark} from 'react-syntax-highlighter/dist/esm/styles/prism'

// Did you know you can use tildes instead of backticks for code in markdown? ✨
const markdown = `Here is some JavaScript code:

~~~js
console.log('It works!')
~~~`

createRoot(document.body).render(
  <Markdown
    children={markdown}
    components={{
      code(props) {
        const {children, className, node, ...rest} = props
        const match = /language-(\w+)/.exec(className || '')
        return match ? (
          <SyntaxHighlighter
            {...rest}
            PreTag="div"
            children={String(children).replace(/\n$/, '')}
            language={match[1]}
            style={dark}
          />
        ) : (
          <code {...rest} className={className}>
            {children}
          </code>
        )
      }
    }}
  />
)
```

## Security and HTML Handling

### Safe HTML Rendering with rehype-raw
**Source**: https://github.com/remarkjs/react-markdown/blob/main/readme.md#_snippet_11

```javascript
import React from 'react'
import {createRoot} from 'react-dom/client'
import Markdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'

const markdown = `<div class="note">

Some *emphasis* and <strong>strong</strong>!

</div>`

createRoot(document.body).render(
  <Markdown rehypePlugins={[rehypeRaw]}>{markdown}</Markdown>
)
```

## Proper JSX Usage

### Handling Line Endings in JSX
**Source**: https://github.com/remarkjs/react-markdown/blob/main/readme.md#_snippet_14

```js
// If you write actual markdown in your code, put your markdown in a variable;
// **do not indent markdown**:
const markdown = `
# This is perfect!
`

// Pass the value as an expression as an only child:
const result = <Markdown>{markdown}</Markdown>
```

### Correct JSX Patterns
**Source**: https://github.com/remarkjs/react-markdown/blob/main/readme.md#_snippet_14

```js
// ❌ Incorrect - whitespace issues
<Markdown># Hi

This is **not** a paragraph.</Markdown>

// ❌ Incorrect - collapsed whitespace
<Markdown> # Hi This is **not** a paragraph. </Markdown>

// ✅ Correct - using template literal
<Markdown>{`
# Hi

This is a paragraph.
`}</Markdown>

// ❌ Incorrect - indented code block instead of heading
<Markdown>{`
    # This is **not** a heading, it's an indented code block
`}</Markdown>
```

## API Reference

### Component Types
**Source**: https://github.com/remarkjs/react-markdown/blob/main/readme.md#_snippet_5

```typescript
// Synchronous rendering
Markdown:
  Renders markdown synchronously.
  Parameters:
    options (Options): Props for the component.
  Returns: React element.

// Async rendering for SSR
MarkdownAsync:
  Renders markdown with async plugin support, suitable for server-side rendering.
  Parameters:
    options (Options): Props for the component.
  Returns: Promise to a React element.

// Client-side async rendering
MarkdownHooks:
  Renders markdown with async plugin support using React hooks (useEffect, useState).
  Suitable for client-side async rendering.
  Parameters:
    options (Options): Props for the component.
  Returns: React node.
```

### Available Component Overrides
**Source**: https://github.com/remarkjs/react-markdown/blob/main/readme.md#_snippet_15

```typescript
Components:
  a: React.ComponentType<React.AnchorHTMLAttributes<HTMLAnchorElement>>
  blockquote: React.ComponentType<React.BlockquoteHTMLAttributes<HTMLQuoteElement>>
  code: React.ComponentType<React.HTMLAttributes<HTMLElement>>
  del: React.ComponentType<React.HTMLAttributes<HTMLElement>>
  em: React.ComponentType<React.HTMLAttributes<HTMLElement>>
  h1: React.ComponentType<React.HeadingHTMLAttributes<HTMLHeadingElement>>
  h2: React.ComponentType<React.HeadingHTMLAttributes<HTMLHeadingElement>>
  h3: React.ComponentType<React.HeadingHTMLAttributes<HTMLHeadingElement>>
  h4: React.ComponentType<React.HeadingHTMLAttributes<HTMLHeadingElement>>
  h5: React.ComponentType<React.HeadingHTMLAttributes<HTMLHeadingElement>>
  h6: React.ComponentType<React.HeadingHTMLAttributes<HTMLHeadingElement>>
  hr: React.ComponentType<React.HTMLAttributes<HTMLHRElement>>
  img: React.ComponentType<React.ImgHTMLAttributes<HTMLImageElement>>
  li: React.ComponentType<React.LiHTMLAttributes<HTMLLIElement>>
  ol: React.ComponentType<React.OlHTMLAttributes<HTMLOListElement>>
  p: React.ComponentType<React.HTMLAttributes<HTMLParagraphElement>>
  pre: React.ComponentType<React.HTMLAttributes<HTMLPreElement>>
  strong: React.ComponentType<React.HTMLAttributes<HTMLElement>>
  table: React.ComponentType<React.TableHTMLAttributes<HTMLTableElement>>
  tbody: React.ComponentType<React.HTMLAttributes<HTMLTableSectionElement>>
  td: React.ComponentType<React.TdHTMLAttributes<HTMLTableCellElement>>
  th: React.ComponentType<React.ThHTMLAttributes<HTMLTableCellElement>>
  thead: React.ComponentType<React.HTMLAttributes<HTMLTableSectionElement>>
  tr: React.ComponentType<React.HTMLAttributes<HTMLTableRowElement>>
  ul: React.ComponentType<React.UlHTMLAttributes<HTMLUListElement>>
```

### Security Functions
**Source**: https://github.com/remarkjs/react-markdown/blob/main/readme.md#_snippet_6

```typescript
defaultUrlTransform(url: string):
  Makes a URL safe by allowing specific protocols (http, https, irc, ircs, mailto, xmpp) and relative URLs.
  Parameters:
    url (string): The URL to transform.
  Returns: Safe URL (string).

UrlTransform (TypeScript type):
  Transforms URLs for security and consistency.
  Parameters:
    url (string): The URL to transform.
    key (string, example: 'href'): The property name (e.g., 'href').
    node (Element from hast): The HAST element.
  Returns: Transformed URL (string, optional).
```

### Configuration Options
**Source**: https://github.com/remarkjs/react-markdown/blob/main/readme.md#_snippet_6

```typescript
Options (TypeScript type):
  Configuration for markdown rendering.
  Fields:
    allowElement (AllowElement, optional): Filter elements.
    allowedElements (Array<string>, optional): Tag names to allow.
    children (string, optional): Markdown content.
    components (Components, optional): Map tag names to components.
    disallowedElements (Array<string>, optional): Tag names to disallow.
    rehypePlugins (Array<Plugin>, optional): List of rehype plugins.
    remarkPlugins (Array<Plugin>, optional): List of remark plugins.
    remarkRehypeOptions (Options from remark-rehype, optional): Options for remark-rehype.
    skipHtml (boolean, optional): Ignore HTML in markdown.
    unwrapDisallowed (boolean, optional): Unwrap disallowed elements.
    urlTransform (UrlTransform, optional): Function to transform URLs.
```

## Best Practices Summary

1. **Security**: Use `defaultUrlTransform` or custom `urlTransform` to sanitize URLs
2. **HTML Handling**: Only use `rehype-raw` in trusted environments; prefer custom components
3. **Custom Components**: Override specific elements with custom React components for styling
4. **JSX Usage**: Use template literals in expressions, avoid indenting markdown content
5. **Performance**: Use `Markdown` for sync rendering, `MarkdownAsync` for SSR, `MarkdownHooks` for client-side async
6. **Element Filtering**: Use `allowedElements`/`disallowedElements` for content control
7. **Syntax Highlighting**: Implement custom `code` component with libraries like react-syntax-highlighter
