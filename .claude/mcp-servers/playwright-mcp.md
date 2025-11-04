# Playwright MCP Server

Browser automation and testing capabilities via Model Context Protocol.

## Purpose
Provides browser automation for testing, scraping, and automated UI interactions within Claude Code sessions.

## Installation

### Via NPM
```bash
npm install -g @playwright/test
npm install -g @modelcontextprotocol/server-playwright
```

### Configuration
Add to your MCP settings:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-playwright"]
    }
  }
}
```

## Capabilities

### Browser Control
- Launch browsers (Chromium, Firefox, WebKit)
- Navigate to URLs
- Click elements
- Fill forms
- Take screenshots

### Testing
- E2E test automation
- Visual regression testing
- Accessibility testing
- Cross-browser testing

## When to Use
- Testing new features
- Regression testing
- Cross-browser compatibility
- Mobile responsiveness
- Accessibility audits
- User flow validation
