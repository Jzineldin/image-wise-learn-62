# Supabase Edge Functions Documentation
*Retrieved from Context7 MCP: `/supabase/supabase`*
*Topic: edge functions authentication JWT database operations error handling deployment configuration best practices*
*Tokens: 2800*
*Retrieved: 2025-09-18*

## Authentication & JWT Handling

### JWT Authentication in WebSocket Connections
**Source**: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/functions/websockets.mdx#_snippet_1

```typescript
import { createClient } from 'npm:@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
)

Deno.serve((req) => {
  const upgrade = req.headers.get('upgrade') || ''
  if (upgrade.toLowerCase() != 'websocket') {
    return new Response("request isn't trying to upgrade to websocket.", { status: 400 })
  }

  // Please be aware query params may be logged in some logging systems.
  const url = new URL(req.url)
  const jwt = url.searchParams.get('jwt')

  if (!jwt) {
    console.error('Auth token not provided')
    return new Response('Auth token not provided', { status: 403 })
  }

  const { error, data } = await supabase.auth.getUser(jwt)

  if (error) {
    console.error(error)
    return new Response('Invalid token provided', { status: 403 })
  }

  if (!data.user) {
    console.error('user is not authenticated')
    return new Response('User is not authenticated', { status: 403 })
  }

  const { socket, response } = Deno.upgradeWebSocket(req)
  // ... WebSocket handling
  return response
})
```

### Alternative JWT Authentication via Custom Headers
**Source**: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/functions/websockets.mdx#_snippet_2

```typescript
// Sec-WebSocket-Protocol may return multiple protocol values `jwt-TOKEN, value1, value 2`
const customProtocols = (req.headers.get('Sec-WebSocket-Protocol') ?? '')
  .split(',')
  .map((p) => p.trim())
const jwt = customProtocols.find((p) => p.startsWith('jwt')).replace('jwt-', '')

if (!jwt) {
  console.error('Auth token not provided')
  return new Response('Auth token not provided', { status: 403 })
}

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

## Error Handling Patterns

### Client-Side Error Handling
**Source**: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/functions/error-handling.mdx#_snippet_1

```javascript
import { FunctionsHttpError, FunctionsRelayError, FunctionsFetchError } from '@supabase/supabase-js'

const { data, error } = await supabase.functions.invoke('hello', {
  headers: { 'my-custom-header': 'my-custom-header-value' },
  body: { foo: 'bar' },
})

if (error instanceof FunctionsHttpError) {
  const errorMessage = await error.context.json()
  console.log('Function returned an error', errorMessage)
} else if (error instanceof FunctionsRelayError) {
  console.log('Relay error:', error.message)
} else if (error instanceof FunctionsFetchError) {
  console.log('Fetch error:', error.message)
}
```

## Deployment & Configuration

### Basic Function Deployment
**Source**: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/functions/quickstart.mdx#_snippet_8

```bash
# Deploy specific function
supabase functions deploy hello-world

# Deploy all functions
supabase functions deploy

# Deploy using API (when Docker unavailable)
supabase functions deploy hello-world --use-api

# Deploy without JWT verification
supabase functions deploy hello-world --no-verify-jwt
```

### Configuration in config.toml
**Source**: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/functions/deploy.mdx#_snippet_2

```toml
[functions.hello-world]
verify_jwt = false
```

### Advanced Configuration
**Source**: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/functions/development-tips.mdx#_snippet_2

```toml
[functions.hello-world]
verify_jwt = false
import_map = './import_map.json'
```

### Local Development
**Source**: https://github.com/supabase/supabase/blob/master/examples/edge-functions/supabase/functions/send-email-resend/README.md#_snippet_1

```bash
supabase start
supabase functions serve --no-verify-jwt --env-file ./supabase/.env.local
```

### Setting Secrets
**Source**: https://github.com/supabase/supabase/blob/master/examples/edge-functions/supabase/functions/connect-supabase/README.md#_snippet_1

```bash
supabase functions deploy connect-supabase --no-verify-jwt
supabase secrets set --env-file ./supabase/.env.local
```

## Best Practices Summary

1. **JWT Validation**: Always validate JWT tokens using `supabase.auth.getUser(jwt)` for authenticated endpoints
2. **Error Responses**: Return appropriate HTTP status codes (400, 403, 500) with clear error messages
3. **Configuration**: Use `config.toml` for function-specific settings like JWT verification
4. **Development**: Use `--no-verify-jwt` flag only for development and testing
5. **Client Error Handling**: Distinguish between FunctionsHttpError, FunctionsRelayError, and FunctionsFetchError
6. **Security**: Be aware that query parameters may be logged in some systems when passing JWTs
