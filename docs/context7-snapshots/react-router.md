# React Router Documentation
*Retrieved from Context7 MCP: `/remix-run/react-router`*
*Topic: error boundaries route protection nested routes navigation best practices*
*Tokens: 2500*
*Retrieved: 2025-09-18*

## Error Boundaries in React Router

### Route Error Boundary with isRouteErrorResponse
**Source**: https://github.com/remix-run/react-router/blob/main/docs/api/utils/isRouteErrorResponse.md#_snippet_0

```tsx
import { isRouteErrorResponse } from "react-router";

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error)) {
    return (
      <>
        <p>Error: `${error.status}: ${error.statusText}`</p>
        <p>{error.data}</p>
      </>
    );
  }

  return (
    <p>Error: {error instanceof Error ? error.message : "Unknown Error"}</p>
  );
}
```

### isRouteErrorResponse Function Signature
**Source**: https://github.com/remix-run/react-router/blob/main/docs/api/utils/isRouteErrorResponse.md#_snippet_1

```tsx
function isRouteErrorResponse(error: any): error is ErrorResponse
```

## Route Organization Patterns

### Flat Route Structure
**Source**: https://github.com/remix-run/react-router/blob/main/docs/how-to/file-route-conventions.md#_snippet_0

```text
app/
├── routes/
│   ├── _landing._index.tsx
│   ├── _landing.about.tsx
│   ├── _landing.tsx
│   ├── app._index.tsx
│   ├── app.projects.tsx
│   ├── app.tsx
│   └── app_.projects.$id.roadmap.tsx
└── root.tsx
```

### Folder-Based Route Structure
**Source**: https://github.com/remix-run/react-router/blob/main/docs/how-to/file-route-conventions.md#_snippet_1

```text
app/
├── routes/
│   ├── _landing._index/
│   │   ├── route.tsx
│   │   └── scroll-experience.tsx
│   ├── _landing.about/
│   │   ├── employee-profile-card.tsx
│   │   ├── get-employee-data.server.ts
│   │   ├── route.tsx
│   │   └── team-photo.jpg
│   ├── _landing/
│   │   ├── footer.tsx
│   │   ├── header.tsx
│   │   └── route.tsx
│   ├── app._index/
│   │   ├── route.tsx
│   │   └── stats.tsx
│   ├── app.projects/
│   │   ├── get-projects.server.ts
│   │   ├── project-buttons.tsx
│   │   ├── project-card.tsx
│   │   └── route.tsx
│   ├── app/
│   │   ├── footer.tsx
│   │   ├── primary-nav.tsx
│   │   └── route.tsx
│   ├── app_.projects.$id.roadmap/
│   │   ├── chart.tsx
│   │   ├── route.tsx
│   │   └── update-timeline.server.ts
│   └── contact-us.tsx
└── root.tsx
```

### Route File Equivalence
**Source**: https://github.com/remix-run/react-router/blob/main/docs/how-to/file-route-conventions.md#_snippet_2

```text
# these are the same route:
app/routes/app.tsx
app/routes/app/route.tsx

# as are these
app/routes/app._index.tsx
app/routes/app._index/route.tsx
```

## Root Layout and Navigation

### Root Layout Component
**Source**: https://github.com/remix-run/react-router/blob/main/docs/upgrading/router-provider.md#_snippet_2

```tsx
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

export function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />
        <title>My App</title>
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function Root() {
  return <Outlet />;
}
```

### Integrating Global Providers
**Source**: https://github.com/remix-run/react-router/blob/main/docs/upgrading/router-provider.md#_snippet_4

```tsx
+import "./index.css";

// ... other imports and Layout

export default function Root() {
  return (
+   <OtherProviders>
+     <AppLayout>
        <Outlet />
+     </AppLayout>
+   </OtherProviders>
  );
}
```

## Navigation and Path Resolution

### useResolvedPath Hook
**Source**: https://github.com/remix-run/react-router/blob/main/docs/api/hooks/useResolvedPath.md#_snippet_1

```tsx
function useResolvedPath(
  to: To,
  {
    relative,
  }: {
    relative?: RelativeRoutingType;
  } = {},
): Path {}
```

### Resolving Relative Paths
**Source**: https://github.com/remix-run/react-router/blob/main/docs/api/hooks/useResolvedPath.md#_snippet_0

```tsx
import { useResolvedPath } from "react-router";

function SomeComponent() {
  // if the user is at /dashboard/profile
  let path = useResolvedPath("../accounts");
  path.pathname; // "/dashboard/accounts"
  path.search; // ""
  path.hash; // ""
}
```

### Client-Side Redirects
**Source**: https://github.com/remix-run/react-router/blob/main/docs/api/utils/replace.md#_snippet_0

```tsx
import { replace } from "react-router";

export async function loader() {
  return replace("/new-location");
}
```

## Client Entry Points

### Standard Vite Entry Point
**Source**: https://github.com/remix-run/react-router/blob/main/docs/upgrading/router-provider.md#_snippet_5

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App";

const router = createBrowserRouter([
  // ... route definitions
]);

ReactDOM.createRoot(
  document.getElementById("root")!,
).render(
  <React.StrictMode>
    <RouterProvider router={router} />;
  </React.StrictMode>,
);
```

### React Router Client Entry
**Source**: https://github.com/remix-run/react-router/blob/main/docs/upgrading/router-provider.md#_snippet_6

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

ReactDOM.hydrateRoot(
  document,
  <React.StrictMode>
    <HydratedRouter />
  </React.StrictMode>,
);
```

## Configuration

### Future Flags Configuration
**Source**: https://github.com/remix-run/react-router/blob/main/docs/upgrading/future.md#_snippet_1

```ts
import type { Config } from "@react-router/dev/config";

export default {
  future: {
    v8_middleware: true,
  },
} satisfies Config;
```

## Best Practices Summary

1. **Error Boundaries**: Use `isRouteErrorResponse` to distinguish between HTTP errors and JavaScript errors
2. **Route Organization**: Choose between flat and folder-based structures based on project complexity
3. **Layout Components**: Use `<Outlet />` for nested routing and global layouts
4. **Path Resolution**: Use `useResolvedPath` for dynamic path calculations
5. **Client Entry**: Use `HydratedRouter` for SSR applications, `RouterProvider` for SPA
6. **Global Providers**: Wrap providers around `<Outlet />` in root layout for global access
