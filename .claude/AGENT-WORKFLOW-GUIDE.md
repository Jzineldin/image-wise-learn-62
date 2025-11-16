# TaleForge Agent Workflow Guide

This guide explains how to use the configured agents together for optimal development workflow.

## 📋 Table of Contents
- [Agent Overview](#agent-overview)
- [Workflow Scenarios](#workflow-scenarios)
- [Agent Collaboration Patterns](#agent-collaboration-patterns)
- [Best Practices](#best-practices)

---

## 🤖 Agent Overview

### High Priority - Core Functionality (Team 1)
1. **Prompt Engineer** - Optimize AI prompts for story/image/video generation
2. **Context Manager** - Manage multi-step workflows and context flow
3. **AI Engineer** - Optimize LLM integrations and RAG systems
4. **Content Marketer** - Educational content and user-facing copy

### Technical Infrastructure (Team 2)
5. **Supabase Schema Architect** - Database design and optimization
6. **API Security Audit** - Security vulnerabilities and compliance
7. **Error Detective** - Log analysis and debugging
8. **Deployment Engineer** - CI/CD and deployment automation

### Quality & Performance (Team 3)
9. **Test Engineer** - Comprehensive testing strategy
10. **Performance Engineer** - Performance optimization
11. **Code Reviewer** - Code quality and best practices
12. **Database Optimizer** - Query optimization and indexing

### User Experience (Team 4)
13. **UI UX Designer** - Interface design and accessibility
14. **Technical Writer** - Documentation and guides
15. **Fullstack Developer** - End-to-end feature development

---

## 🔄 Workflow Scenarios

### Scenario 1: Implementing a New Feature

**Example**: Add story bookmarking feature

#### Step-by-Step Workflow

1. **Planning Phase** (Context Manager + Fullstack Developer)
   ```
   @context-manager: Plan the bookmark feature implementation workflow
   @fullstack-developer: Design database schema and API endpoints for bookmarks
   ```
   - Define user flow
   - Identify database changes
   - Plan API endpoints
   - Design UI components

2. **Database Design** (Supabase Schema Architect + Database Optimizer)
   ```
   @supabase-schema-architect: Design bookmark table schema with RLS
   @database-optimizer: Add indexes for efficient bookmark queries
   ```
   - Create migration file
   - Add RLS policies
   - Create indexes
   - Plan queries

3. **Security Review** (API Security Audit)
   ```
   @api-security-audit: Review bookmark feature for security vulnerabilities
   ```
   - Verify RLS policies
   - Check authorization logic
   - Ensure data privacy

4. **Backend Implementation** (Fullstack Developer)
   ```
   @fullstack-developer: Implement bookmark Edge Functions
   ```
   - Create API endpoints
   - Implement business logic
   - Add error handling

5. **Frontend Implementation** (Fullstack Developer + UI UX Designer)
   ```
   @ui-ux-designer: Design bookmark button and UI
   @fullstack-developer: Implement bookmark components
   ```
   - Create UI components
   - Implement state management
   - Add user feedback

6. **Testing** (Test Engineer)
   ```
   @test-engineer: Create tests for bookmark feature
   ```
   - Unit tests
   - Integration tests
   - E2E tests

7. **Code Review** (Code Reviewer)
   ```
   @code-reviewer: Review bookmark implementation
   ```
   - Check code quality
   - Verify security
   - Review performance

8. **Documentation** (Technical Writer)
   ```
   @technical-writer: Document bookmark feature
   ```
   - User guide
   - API documentation
   - Code comments

9. **Deployment** (Deployment Engineer)
   ```
   @deployment-engineer: Deploy bookmark feature
   ```
   - Deploy to staging
   - Test in staging
   - Deploy to production

---

### Scenario 2: Optimizing Story Generation

**Goal**: Improve story quality and reduce generation time

#### Workflow

1. **Analysis Phase** (Error Detective + Performance Engineer)
   ```
   @error-detective: Analyze story generation errors and failures
   @performance-engineer: Profile story generation performance
   ```
   - Identify bottlenecks
   - Find common errors
   - Measure current metrics

2. **Prompt Optimization** (Prompt Engineer)
   ```
   @prompt-engineer: Optimize story generation prompts
   ```
   - Improve prompt clarity
   - Add better examples
   - Reduce token usage
   - Enhance character consistency

3. **AI Integration** (AI Engineer)
   ```
   @ai-engineer: Optimize LLM API calls and implement caching
   ```
   - Implement streaming
   - Add response caching
   - Optimize token usage
   - Add fallback strategies

4. **Context Flow** (Context Manager)
   ```
   @context-manager: Optimize context passing between segments
   ```
   - Minimize redundant context
   - Implement efficient state management
   - Reduce API calls

5. **Database Optimization** (Database Optimizer)
   ```
   @database-optimizer: Optimize story data queries
   ```
   - Add indexes
   - Optimize JOINs
   - Implement caching

6. **Testing** (Test Engineer + Performance Engineer)
   ```
   @test-engineer: Test optimized story generation
   @performance-engineer: Measure performance improvements
   ```
   - Benchmark performance
   - Verify quality maintained
   - Test edge cases

7. **Documentation** (Technical Writer)
   ```
   @technical-writer: Document optimization changes
   ```
   - Update architecture docs
   - Document new patterns
   - Update developer guides

---

### Scenario 3: Security Audit & Hardening

**Goal**: Ensure platform security and COPPA compliance

#### Workflow

1. **Comprehensive Audit** (API Security Audit)
   ```
   @api-security-audit: Conduct full security audit
   ```
   - Review authentication
   - Check authorization
   - Audit API endpoints
   - Verify data protection

2. **Database Security** (Supabase Schema Architect)
   ```
   @supabase-schema-architect: Review RLS policies and data access
   ```
   - Verify RLS policies
   - Check data isolation
   - Audit permissions

3. **Code Review** (Code Reviewer)
   ```
   @code-reviewer: Review code for security issues
   ```
   - Check for vulnerabilities
   - Verify input validation
   - Review error handling

4. **Testing** (Test Engineer)
   ```
   @test-engineer: Create security test cases
   ```
   - Test authorization
   - Test RLS policies
   - Test input validation

5. **Documentation** (Technical Writer)
   ```
   @technical-writer: Document security measures and compliance
   ```
   - Security documentation
   - Compliance guides
   - Audit reports

---

### Scenario 4: Improving User Experience

**Goal**: Enhance story creation and viewing experience

#### Workflow

1. **UX Analysis** (UI UX Designer)
   ```
   @ui-ux-designer: Analyze current user flows and identify improvements
   ```
   - Review user flows
   - Identify pain points
   - Design improvements

2. **Performance Review** (Performance Engineer)
   ```
   @performance-engineer: Analyze loading times and optimize
   ```
   - Measure page load times
   - Optimize bundle size
   - Improve perceived performance

3. **Content Review** (Content Marketer)
   ```
   @content-marketer: Review and improve user-facing content
   ```
   - Optimize copy
   - Improve messaging
   - Enhance clarity

4. **Implementation** (Fullstack Developer + UI UX Designer)
   ```
   @fullstack-developer: Implement UX improvements
   @ui-ux-designer: Ensure design consistency
   ```
   - Update components
   - Improve interactions
   - Add animations

5. **Accessibility** (UI UX Designer)
   ```
   @ui-ux-designer: Conduct accessibility audit and improvements
   ```
   - WCAG compliance
   - Keyboard navigation
   - Screen reader support

6. **Testing** (Test Engineer)
   ```
   @test-engineer: Test UX improvements across devices
   ```
   - Cross-browser testing
   - Mobile testing
   - Accessibility testing

---

### Scenario 5: Debugging Production Issue

**Goal**: Quickly identify and fix a production bug

#### Workflow

1. **Error Analysis** (Error Detective)
   ```
   @error-detective: Analyze error logs and identify root cause
   ```
   - Review error logs
   - Identify patterns
   - Find root cause

2. **Quick Fix** (Fullstack Developer)
   ```
   @fullstack-developer: Implement fix for production issue
   ```
   - Create hotfix
   - Test locally
   - Prepare for deployment

3. **Code Review** (Code Reviewer)
   ```
   @code-reviewer: Quick review of hotfix
   ```
   - Verify fix correctness
   - Check for side effects
   - Approve for deployment

4. **Deployment** (Deployment Engineer)
   ```
   @deployment-engineer: Deploy hotfix to production
   ```
   - Deploy to staging first
   - Verify fix works
   - Deploy to production
   - Monitor for issues

5. **Post-Mortem** (Error Detective + Technical Writer)
   ```
   @error-detective: Analyze what caused the issue
   @technical-writer: Document incident and prevention
   ```
   - Document incident
   - Identify prevention measures
   - Update monitoring

---

## 🤝 Agent Collaboration Patterns

### Pattern 1: Feature Development Pipeline
```
Fullstack Developer → Code Reviewer → Test Engineer → Deployment Engineer
```

### Pattern 2: Performance Optimization
```
Performance Engineer → Database Optimizer → Code Reviewer → Test Engineer
```

### Pattern 3: Security Hardening
```
API Security Audit → Code Reviewer → Test Engineer → Technical Writer
```

### Pattern 4: AI/Prompt Optimization
```
Prompt Engineer → AI Engineer → Context Manager → Test Engineer
```

### Pattern 5: UX Enhancement
```
UI UX Designer → Content Marketer → Fullstack Developer → Test Engineer
```

---

## 💡 Best Practices

### 1. Always Start with Planning
- Use **Context Manager** to plan complex workflows
- Use **Fullstack Developer** to design end-to-end features
- Document decisions with **Technical Writer**

### 2. Security First
- Involve **API Security Audit** early in feature development
- Always review with **Code Reviewer** before deployment
- Test security with **Test Engineer**

### 3. Test Everything
- Use **Test Engineer** for comprehensive test coverage
- Use **Performance Engineer** for performance testing
- Use **Error Detective** for debugging

### 4. Optimize Continuously
- Use **Prompt Engineer** to improve AI outputs
- Use **Database Optimizer** for query performance
- Use **Performance Engineer** for frontend optimization

### 5. Document as You Go
- Use **Technical Writer** to document features
- Keep README files updated
- Document API changes

### 6. Monitor and Improve
- Use **Error Detective** to analyze logs
- Use **Performance Engineer** to track metrics
- Use **Deployment Engineer** for deployment health

---

## 🎯 Quick Reference

### For New Features
1. Context Manager (plan)
2. Fullstack Developer (implement)
3. Code Reviewer (review)
4. Test Engineer (test)
5. Technical Writer (document)
6. Deployment Engineer (deploy)

### For Bug Fixes
1. Error Detective (analyze)
2. Fullstack Developer (fix)
3. Code Reviewer (review)
4. Test Engineer (verify)
5. Deployment Engineer (deploy)

### For Performance Issues
1. Performance Engineer (analyze)
2. Database Optimizer (optimize queries)
3. AI Engineer (optimize AI calls)
4. Test Engineer (verify improvements)

### For Security Issues
1. API Security Audit (audit)
2. Code Reviewer (review)
3. Test Engineer (test)
4. Technical Writer (document)

---

## 📞 When to Call Each Agent

| Agent | Use When... |
|-------|------------|
| Prompt Engineer | Optimizing AI prompts, improving generation quality |
| Context Manager | Planning workflows, managing multi-step processes |
| AI Engineer | Integrating AI services, implementing RAG systems |
| Content Marketer | Writing user-facing content, marketing materials |
| Supabase Schema Architect | Designing database schema, RLS policies |
| API Security Audit | Security reviews, compliance checks |
| Error Detective | Debugging, analyzing logs, finding root causes |
| Deployment Engineer | Deploying features, CI/CD issues |
| Test Engineer | Writing tests, test strategy |
| Performance Engineer | Performance optimization, bottleneck analysis |
| Code Reviewer | Code quality reviews, best practices |
| Database Optimizer | Query optimization, indexing |
| UI UX Designer | Interface design, accessibility |
| Technical Writer | Documentation, user guides |
| Fullstack Developer | End-to-end feature development |

---

## 🚀 Getting Started

To use an agent, simply reference them in your conversation:

```
@prompt-engineer: Can you review the story generation prompts in src/lib/prompts/?
```

Or start a task with:

```
I need to implement a bookmark feature. Let me involve the relevant agents:
@context-manager: Help plan this feature implementation
```

---

**Remember**: Agents work best when used together. Don't hesitate to involve multiple agents for complex tasks!
