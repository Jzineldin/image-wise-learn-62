# Phase 1 Security Implementation Plan
*Based on Context7 MCP Documentation Patterns*
*Generated: 2025-09-18*

## 🎯 Implementation Priority & Timeline

**Total Estimated Time**: 3-4 days
**Risk Level**: Low (following official patterns)
**Impact**: High (critical security improvements)

---

## 📋 Task Breakdown

### Task 1: Client-Side Error Handling Enhancement
**Priority**: HIGH | **Estimated Time**: 1.5 days | **Risk**: Low

#### Context7 Documentation Source
- **File**: `docs/context7-snapshots/supabase-edge-functions.md`
- **Lines**: 1-15 (Error handling patterns)
- **Pattern**: FunctionsHttpError, FunctionsRelayError, FunctionsFetchError differentiation

#### Files to Modify

**1. `src/lib/api/ai-client.ts` (Lines 119-151)**
```typescript
// Current implementation needs enhancement
if (error) {
  console.error(`❌ ${functionName} supabase error:`, error);
  // Add Context7 pattern here
}
```

**Implementation Pattern from Context7**:
```javascript
if (error instanceof FunctionsHttpError) {
  const errorMessage = await error.context.json()
  console.log('Function returned an error', errorMessage)
} else if (error instanceof FunctionsRelayError) {
  console.log('Relay error:', error.message)
} else if (error instanceof FunctionsFetchError) {
  console.log('Fetch error:', error.message)
}
```

**2. `src/lib/ai-client.ts` (Lines 124-151)** - Duplicate file cleanup
**3. `src/pages/Create.tsx` (Lines 103-117)** - Update error handling
**4. `src/pages/StoryViewer.tsx` (Lines 20-22)** - Import updates
**5. `src/pages/StoryEnd.tsx` (Lines 209-218)** - Direct function calls

#### Implementation Steps
1. **Import Supabase error types** in ai-client.ts
2. **Replace generic error handling** with specific error type checking
3. **Add user-friendly error messages** for each error type
4. **Implement retry logic** for FunctionsRelayError (network issues)
5. **Add toast notifications** with appropriate messaging
6. **Update all direct supabase.functions.invoke calls** to use AIClient

#### Testing Approach
- **Unit Tests**: Mock each error type and verify correct handling
- **Integration Tests**: Test with network disconnection, invalid tokens, function errors
- **User Testing**: Verify error messages are helpful and actionable

#### Success Criteria
- [ ] All FunctionsHttpError, FunctionsRelayError, FunctionsFetchError handled distinctly
- [ ] User-friendly error messages displayed
- [ ] Automatic retry for network errors
- [ ] No more generic "something went wrong" messages

---

### Task 2: Complete JWT Validation Coverage
**Priority**: HIGH | **Estimated Time**: 1 day | **Risk**: Low

#### Context7 Documentation Source
- **File**: `docs/context7-snapshots/supabase-edge-functions.md`
- **Lines**: 23-31 (WebSocket auth example)
- **Pattern**: `supabase.auth.getUser(jwt)` server-side validation

#### Edge Functions Analysis
**Functions with proper JWT validation** (using CreditService):
- ✅ `generate-story/index.ts`
- ✅ `generate-story-segment/index.ts`
- ✅ `generate-story-ending/index.ts`
- ✅ `generate-story-audio/index.ts`
- ✅ `generate-story-image/index.ts`

**Functions needing JWT validation updates**:
- ❌ `check-subscription/index.ts` (Lines 33-42) - Manual token parsing
- ❌ `customer-portal/index.ts` (Lines 33-42) - Manual token parsing  
- ❌ `create-checkout/index.ts` (Lines 33-42) - Manual token parsing

#### Implementation Pattern from Context7
```typescript
const { error, data } = await supabase.auth.getUser(jwt)
if (error) {
  console.error(error)
  return new Response('Invalid token provided', { status: 403 })
}
if (!data.user) {
  console.error('user is not authenticated')
  return new Response('User is not authenticated', { status: 403 })
}
```

#### Files to Modify

**1. `supabase/functions/check-subscription/index.ts` (Lines 33-42)**
```typescript
// Replace manual parsing with Context7 pattern
const token = authHeader.replace("Bearer ", "");
const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
```

**2. `supabase/functions/customer-portal/index.ts` (Lines 33-42)**
**3. `supabase/functions/create-checkout/index.ts` (Lines 33-42)**

#### Implementation Steps
1. **Replace manual JWT parsing** with `auth.getUser(token)`
2. **Standardize error responses** to 403 status codes
3. **Add consistent error logging** patterns
4. **Update error messages** to match Context7 patterns
5. **Test authentication flow** for all functions

#### Testing Approach
- **Invalid Token Test**: Send malformed JWT, expect 403
- **Expired Token Test**: Send expired JWT, expect 403  
- **Valid Token Test**: Send valid JWT, expect successful processing
- **Missing Header Test**: No Authorization header, expect 401

#### Success Criteria
- [ ] All Edge Functions use `auth.getUser(token)` validation
- [ ] Consistent 403 responses for invalid tokens
- [ ] Consistent 401 responses for missing headers
- [ ] No manual JWT decoding remaining

---

### Task 3: Input Validation & Response Standardization
**Priority**: MEDIUM | **Estimated Time**: 1 day | **Risk**: Low

#### Context7 Documentation Source
- **File**: `docs/context7-snapshots/supabase-edge-functions.md`
- **Lines**: 25, 31, 37 (Consistent error responses)
- **Pattern**: Standardized HTTP status codes and error formats

#### Current State Analysis
**Functions with good validation**:
- ✅ `generate-story-segment/index.ts` (Lines 45-52) - Uses ResponseHandler
- ✅ `generate-story/index.ts` (Lines 25-30) - Uses ResponseHandler

**Functions needing validation improvements**:
- ❌ `generate-story-ending/index.ts` (Lines 43-45) - Throws generic errors
- ❌ `generate-story-audio/index.ts` - Missing input validation
- ❌ `generate-story-image/index.ts` - Inconsistent error format

#### Implementation Pattern from Context7
```typescript
// Input validation with 400 responses
if (!required_field) {
  return ResponseHandler.error('Field is required', 400, { 
    error_code: 'MISSING_REQUIRED_FIELD',
    field: 'required_field',
    requestId 
  });
}

// Auth validation with 401/403 responses  
if (!authHeader) {
  return ResponseHandler.error('No authorization header', 401, { requestId });
}
```

#### Files to Modify

**1. `supabase/functions/generate-story-ending/index.ts` (Lines 43-45)**
**2. `supabase/functions/generate-story-audio/index.ts` (Add validation)**
**3. `supabase/functions/generate-story-image/index.ts` (Standardize responses)**
**4. `supabase/functions/_shared/response-handlers.ts` (Enhance if needed)**

#### Implementation Steps
1. **Add input validation** to all function entry points
2. **Standardize error response format** using ResponseHandler
3. **Add error codes** for different validation failures
4. **Include request IDs** in all error responses
5. **Document validation rules** for each function

#### Testing Approach
- **Missing Fields Test**: Send incomplete data, expect 400 with error details
- **Invalid Data Test**: Send malformed data, expect 400 with validation errors
- **Response Format Test**: Verify all errors follow consistent JSON schema

#### Success Criteria
- [ ] All functions validate required inputs
- [ ] Consistent 400 responses for validation errors
- [ ] Error responses include error codes and details
- [ ] All responses include request IDs for tracing

---

## 🧪 Testing Strategy

### Automated Testing
```bash
# Run existing tests
npm test

# Add new test files
src/lib/api/__tests__/ai-client-error-handling.test.ts
supabase/functions/__tests__/jwt-validation.test.ts
```

### Manual Testing Checklist
- [ ] Test each error type in browser dev tools
- [ ] Verify error messages are user-friendly
- [ ] Test with expired/invalid tokens
- [ ] Test with network disconnection
- [ ] Verify Simple Mode experience unchanged

### Security Testing
- [ ] Attempt to bypass JWT validation
- [ ] Test with malformed authorization headers
- [ ] Verify no sensitive data in error responses
- [ ] Test rate limiting and circuit breaker

---

## 📊 Success Metrics

### Before Implementation
- Generic error handling in 5+ locations
- Manual JWT parsing in 3 functions
- Inconsistent error response formats
- Poor error visibility for debugging

### After Implementation  
- [ ] 100% Context7 pattern compliance
- [ ] Centralized error handling with specific types
- [ ] Standardized JWT validation across all functions
- [ ] Consistent error response format
- [ ] Improved error visibility and debugging
- [ ] Maintained Simple Mode user experience

---

## 🔄 Implementation Order

**Day 1**: Task 1 (Client-Side Error Handling)
- Morning: Update ai-client.ts with Context7 patterns
- Afternoon: Update all function call sites

**Day 2**: Task 2 (JWT Validation Coverage)  
- Morning: Update subscription-related functions
- Afternoon: Testing and validation

**Day 3**: Task 3 (Input Validation)
- Morning: Add validation to remaining functions
- Afternoon: Standardize response formats

**Day 4**: Testing & Documentation
- Morning: Comprehensive testing
- Afternoon: Update documentation and deployment

This plan ensures complete traceability to Context7 MCP documentation while maintaining the existing user experience and improving security posture significantly.
