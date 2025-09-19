# React Hooks and Components Documentation
*Retrieved from Context7 MCP: `/reactjs/react.dev`*
*Topic: error boundaries hooks components memoization performance optimization best practices*
*Tokens: 2500*
*Retrieved: 2025-09-18*

## Performance Optimization with Memoization

### useCallback for Function Memoization
**Source**: https://github.com/reactjs/react.dev/blob/main/src/content/reference/react/useMemo.md#_snippet_28

```javascript
export default function Page({ productId, referrer }) {
  const handleSubmit = useCallback((orderDetails) => {
    post('/product/' + productId + '/buy', {
      referrer,
      orderDetails
    });
  }, [productId, referrer]);

  return <Form onSubmit={handleSubmit} />;
}
```

### useMemo for Expensive Calculations
**Source**: https://github.com/reactjs/react.dev/blob/main/src/content/reference/react/hooks.md#_snippet_4

```javascript
function TodoList({ todos, tab, theme }) {
  const visibleTodos = useMemo(() => filterTodos(todos, tab), [todos, tab]);
  // ...
}
```

### React.memo for Component Memoization
**Source**: https://github.com/reactjs/react.dev/blob/main/src/content/reference/react/useCallback.md#_snippet_4

```javascript
import { memo } from 'react';

const ShippingForm = memo(function ShippingForm({ onSubmit }) {
  // ...
});
```

### Optimizing List Components
**Source**: https://github.com/reactjs/react.dev/blob/main/src/content/reference/react/useMemo.md#_snippet_11

```javascript
import { memo } from 'react';

const List = memo(function List({ items }) {
  // ...
});
```

## Complete Performance Optimization Example

### App Component with State Management
**Source**: https://github.com/reactjs/react.dev/blob/main/src/content/reference/react/useMemo.md#_snippet_15

```javascript
import { useState } from 'react';
import { createTodos } from './utils.js';
import TodoList from './TodoList.js';

const todos = createTodos();

export default function App() {
  const [tab, setTab] = useState('all');
  const [isDark, setIsDark] = useState(false);
  return (
    <>
      <button onClick={() => setTab('all')}>
        All
      </button>
      <button onClick={() => setTab('active')}>
        Active
      </button>
      <button onClick={() => setTab('completed')}>
        Completed
      </button>
      <br />
      <label>
        <input
          type="checkbox"
          checked={isDark}
          onChange={e => setIsDark(e.target.checked)}
        />
        Dark mode
      </label>
      <hr />
      <TodoList
        todos={todos}
        tab={tab}
        theme={isDark ? 'dark' : 'light'}
      />
    </>
  );
}
```

### TodoList with useMemo
**Source**: https://github.com/reactjs/react.dev/blob/main/src/content/reference/react/useMemo.md#_snippet_15

```javascript
import { useMemo } from 'react';
import List from './List.js';
import { filterTodos } from './utils.js'

export default function TodoList({ todos, theme, tab }) {
  const visibleTodos = useMemo(
    () => filterTodos(todos, tab),
    [todos, tab]
  );
  return (
    <div className={theme}>
      <p><b>Note: <code>List</code> is artificially slowed down!</b></p>
      <List items={visibleTodos} />
    </div>
  );
}
```

### Memoized List Component
**Source**: https://github.com/reactjs/react.dev/blob/main/src/content/reference/react/useMemo.md#_snippet_15

```javascript
import { memo } from 'react';

const List = memo(function List({ items }) {
  console.log('[ARTIFICIALLY SLOW] Rendering <List /> with ' + items.length + ' items');
  let startTime = performance.now();
  while (performance.now() - startTime < 500) {
    // Do nothing for 500 ms to emulate extremely slow code
  }

  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>
          {item.completed ?
            <s>{item.text}</s> :
            item.text
          }
        </li>
      ))}
    </ul>
  );
});

export default List;
```

### Utility Functions
**Source**: https://github.com/reactjs/react.dev/blob/main/src/content/reference/react/useMemo.md#_snippet_15

```javascript
export function createTodos() {
  const todos = [];
  for (let i = 0; i < 50; i++) {
    todos.push({
      id: i,
      text: "Todo " + (i + 1),
      completed: Math.random() > 0.5
    });
  }
  return todos;
}

export function filterTodos(todos, tab) {
  return todos.filter(todo => {
    if (tab === 'all') {
      return true;
    } else if (tab === 'active') {
      return !todo.completed;
    } else if (tab === 'completed') {
      return todo.completed;
    }
  });
}
```

### CSS for Theme Support
**Source**: https://github.com/reactjs/react.dev/blob/main/src/content/reference/react/useMemo.md#_snippet_15

```css
label {
  display: block;
  margin-top: 10px;
}

.dark {
  background-color: black;
  color: white;
}

.light {
  background-color: white;
  color: black;
}
```

## Alternative Optimization: memo for List Items
**Source**: https://github.com/reactjs/react.dev/blob/main/src/content/reference/react/useCallback.md#_snippet_25

```javascript
function ReportList({ items }) {
  // ...
}

const Report = memo(function Report({ item }) {
  function handleClick() {
    sendReport(item);
  }

  return (
    <figure>
      <Chart onClick={handleClick} />
    </figure>
  );
});
```

## Best Practices Summary

1. **useCallback**: Memoize functions to prevent unnecessary re-renders of child components
2. **useMemo**: Cache expensive calculations that depend on specific values
3. **React.memo**: Wrap functional components to prevent re-renders when props haven't changed
4. **Dependencies**: Always include all dependencies in useCallback and useMemo dependency arrays
5. **Performance**: Use these optimizations only when you have actual performance issues
6. **Profiling**: Use React DevTools Profiler to identify performance bottlenecks before optimizing
