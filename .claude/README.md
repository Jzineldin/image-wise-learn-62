# TaleForge AI Agent System

Welcome to the TaleForge AI Agent System! This directory contains 15 specialized agents and 3 MCP servers configured to help you develop, optimize, and maintain the TaleForge educational story generation platform.

## 📁 Directory Structure

```
.claude/
├── README.md                          # This file
├── AGENT-WORKFLOW-GUIDE.md            # Comprehensive workflow scenarios
├── agents/                            # Agent configuration files
│   ├── prompt-engineer.md
│   ├── context-manager.md
│   ├── ai-engineer.md
│   ├── content-marketer.md
│   ├── supabase-schema-architect.md
│   ├── api-security-audit.md
│   ├── error-detective.md
│   ├── deployment-engineer.md
│   ├── test-engineer.md
│   ├── performance-engineer.md
│   ├── code-reviewer.md
│   ├── database-optimizer.md
│   ├── ui-ux-designer.md
│   ├── technical-writer.md
│   └── fullstack-developer.md
├── mcp-servers/                       # MCP server configurations
│   ├── supabase-mcp.md
│   ├── memory-integration-mcp.md
│   └── playwright-mcp.md
└── settings.local.json                # Local permissions
```

## 🤖 Available Agents

### 🎯 Team 1: Core Functionality (High Priority)
- **Prompt Engineer** - Optimize AI prompts for better story/image/video generation
- **Context Manager** - Manage complex multi-step workflows
- **AI Engineer** - Optimize LLM integrations and RAG systems
- **Content Marketer** - Educational content and marketing copy

### 🔧 Team 2: Technical Infrastructure
- **Supabase Schema Architect** - Database design and optimization
- **API Security Audit** - Security audits and compliance
- **Error Detective** - Debug issues and analyze logs
- **Deployment Engineer** - CI/CD and deployment automation

### ✅ Team 3: Quality & Performance
- **Test Engineer** - Comprehensive testing strategy
- **Performance Engineer** - Performance optimization
- **Code Reviewer** - Code quality and best practices
- **Database Optimizer** - Query and index optimization

### 🎨 Team 4: User Experience
- **UI UX Designer** - Interface design and accessibility
- **Technical Writer** - Documentation and guides
- **Fullstack Developer** - End-to-end feature development

## 🔌 MCP Servers

- **Supabase MCP** - Direct database access and management
- **Memory Integration MCP** - Persistent context across sessions
- **Playwright MCP** - Browser automation and E2E testing

## 🚀 Quick Start

### For Common Tasks

#### 1. Implementing a New Feature
```
@context-manager: Plan the implementation of [feature name]
@fullstack-developer: Implement [feature name]
@code-reviewer: Review the implementation
@test-engineer: Create tests for [feature name]
```

#### 2. Fixing a Bug
```
@error-detective: Analyze the error logs for [issue]
@fullstack-developer: Fix [issue]
@test-engineer: Verify the fix
```

#### 3. Optimizing Performance
```
@performance-engineer: Analyze performance bottlenecks
@database-optimizer: Optimize slow queries
@ai-engineer: Optimize AI API calls
```

#### 4. Security Review
```
@api-security-audit: Conduct security audit
@code-reviewer: Review for security issues
@test-engineer: Create security tests
```

## 📖 Detailed Guides

### Agent Workflow Guide
See [AGENT-WORKFLOW-GUIDE.md](./AGENT-WORKFLOW-GUIDE.md) for:
- Complete workflow scenarios
- Agent collaboration patterns
- Best practices
- Quick reference guide

### Individual Agent Documentation
Each agent has detailed documentation in the `agents/` directory explaining:
- Their specific role and responsibilities
- Key files they should review
- Best practices
- When to use them

### MCP Server Setup
See files in `mcp-servers/` directory for:
- Installation instructions
- Configuration examples
- Usage guidelines

## 💡 Agent Usage Tips

### 1. Use Multiple Agents for Complex Tasks
Don't limit yourself to one agent. Complex features benefit from multiple perspectives:
```
# Example: Adding video export feature
@context-manager: Plan video export workflow
@ai-engineer: Design video generation pipeline
@fullstack-developer: Implement video export
@performance-engineer: Optimize video processing
@test-engineer: Test video export feature
```

### 2. Start with Planning
Always involve **Context Manager** or **Fullstack Developer** for planning before implementation.

### 3. Always Review and Test
After implementation:
- Use **Code Reviewer** for quality
- Use **Test Engineer** for testing
- Use **Technical Writer** for documentation

### 4. Security First
Involve **API Security Audit** early, especially for:
- New API endpoints
- Authentication changes
- Data handling
- External integrations

### 5. Document Everything
Use **Technical Writer** to:
- Document new features
- Update README files
- Create user guides
- Write API documentation

## 🎯 Common Scenarios

### Story Generation Optimization
```
Team: Prompt Engineer + AI Engineer + Context Manager
Goal: Improve story quality and reduce generation time
```

### Character Consistency Improvement
```
Team: Prompt Engineer + AI Engineer + Database Optimizer
Goal: Ensure character consistency across segments and videos
```

### Mobile Experience Enhancement
```
Team: UI UX Designer + Performance Engineer + Fullstack Developer
Goal: Optimize mobile user experience
```

### Credit System Security
```
Team: API Security Audit + Code Reviewer + Test Engineer
Goal: Ensure credit system is secure and tamper-proof
```

### Deployment Pipeline Setup
```
Team: Deployment Engineer + Test Engineer + Error Detective
Goal: Automate and monitor deployments
```

## 🔍 Finding the Right Agent

| I need to... | Use this agent |
|--------------|----------------|
| Optimize AI prompts | Prompt Engineer |
| Plan a complex feature | Context Manager |
| Improve LLM integration | AI Engineer |
| Write marketing copy | Content Marketer |
| Design database schema | Supabase Schema Architect |
| Security audit | API Security Audit |
| Debug production issue | Error Detective |
| Deploy to production | Deployment Engineer |
| Write tests | Test Engineer |
| Improve performance | Performance Engineer |
| Review code quality | Code Reviewer |
| Optimize queries | Database Optimizer |
| Design UI/UX | UI UX Designer |
| Write documentation | Technical Writer |
| Build full feature | Fullstack Developer |

## 📚 Resources

### Project Documentation
- Main README: `/README.md`
- Deployment Guide: `/DEPLOYMENT-GUIDE.md`
- Architecture Docs: Various markdown files in root

### Key Code Locations
- Frontend: `/src/`
- Edge Functions: `/supabase/functions/`
- Database: `/supabase/migrations/`
- Tests: `/tests/`

### External Services
- Anthropic Claude (story generation)
- OpenAI DALL-E 3 (character images)
- Google Gemini (video generation)
- Freepik API (alternative images)
- Supabase (database, auth, functions, storage)

## 🤝 Contributing

When contributing to TaleForge:
1. Use agents to plan your work
2. Get code review before merging
3. Write tests for new features
4. Document your changes
5. Follow security best practices

## 🆘 Getting Help

If you're unsure which agent to use:
1. Check the [Quick Reference](#finding-the-right-agent)
2. Read the [Workflow Guide](./AGENT-WORKFLOW-GUIDE.md)
3. Start with **Context Manager** for planning
4. Ask **Fullstack Developer** for general guidance

---

**Pro Tip**: Agents work best in teams! Don't hesitate to involve multiple agents for comprehensive solutions.

**Remember**: Each agent has deep context about the TaleForge platform and can access project files, documentation, and code to help you effectively.

Happy coding! 🚀
