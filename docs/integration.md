# Integrating the I-94 Calculator into Other Sites

The calculator supports two integration modes: iframe embed and React component import.

---

## Mode 1 — iframe Embed (any tech stack)

Append `?embed=true` to the deployed URL. In embed mode the header, tab bar, and footer are stripped, leaving only the calculator panels stacked vertically.

```html
<iframe
  src="https://your-deployed-url/?embed=true"
  width="100%"
  height="900"
  frameborder="0"
  title="I-94 U.S. Presence Calculator"
></iframe>
```

Pros: Zero dependency coupling. Works from any HTML page, static site, or non-React app.

Cons: Fixed height requires tuning; no shared state with the host page.

---

## Mode 2 — React Component Import

The calculator is exported as a named React component from `src/index.js`.

### Step 1 — Install peer dependencies

Your host project needs these if not already present:

```bash
npm install react react-dom date-fns recharts
```

### Step 2 — Reference the source

Until the package is published to npm, reference the source directory directly:

```bash
# Install from local path
npm install /path/to/USDays
```

### Step 3 — Import and render

The `I94Calculator` component manages all its own state internally. It requires two props: `activeTab` (string) and `setActiveTab` (function). It also requires a `LangProvider` ancestor for i18n.

```jsx
import { useState } from 'react'
import { LangProvider } from './i94-calculator/i18n/LangContext'
import { I94Calculator } from './i94-calculator/index.js'

export default function MyToolPage() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <LangProvider>
      <I94Calculator
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    </LangProvider>
  )
}
```

### Step 4 — Include Tailwind CSS

Add the source directory to your Tailwind `content` array:

```javascript
// tailwind.config.js
export default {
  content: [
    './src/**/*.{js,jsx}',
    './src/i94-calculator/**/*.{js,jsx}',
  ],
}
```

---

## Exposing Results to the Host Page

The calculator is self-contained by default. To read results from outside, add an optional `onResults` callback prop:

```jsx
// In I94Calculator.jsx — add onResults prop
export default function I94Calculator({ activeTab, setActiveTab, onResults, embed = false }) {
  function handleCalculate({ rawText, prDate }) {
    // ... existing logic ...
    const resultData = { entries, stays, totals, byYear, byMonth, rolling, visitStats, warnings }
    setResults({ ...resultData, error: null })
    onResults?.(resultData)
    setActiveTab('overview')
  }
  // ...
}
```

---

## Publishing as an npm Package

When ready to share across multiple projects without copying source:

1. Confirm `package.json` has `"main": "src/index.js"` and `"peerDependencies"` listing React and date-fns.
2. Add a `"files"` field limiting the published payload to `src/` and `dist/`.
3. Run `npm publish`.
