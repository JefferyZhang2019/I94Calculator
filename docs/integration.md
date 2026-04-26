# Integrating the I-94 Calculator into Other Sites

The calculator supports two integration modes: iframe embed and React component import.

---

## Mode 1 — iframe Embed (any tech stack)

Append `?embed=true` to the deployed URL. In embed mode the header, tab bar, and disclaimer footer are stripped, leaving only the calculator panels stacked vertically followed by a minimal version line.

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

The calculator is exported as a named React component from `src/index.js`. Choose one of the two approaches below.

### Step 1 — Install peer dependencies

Your host project needs these if not already present:

```bash
npm install react react-dom date-fns recharts @react-pdf/renderer
```

### Step 2 — Reference the source

**Option A — Copy source into your project:**

```bash
cp -r /path/to/USDays/src ./src/i94-calculator
```

**Option B — npm local install** (keeps the source in one place):

```bash
npm install /path/to/USDays
```

### Step 3 — Import and render

The `I94Calculator` component requires two props: `activeTab` (string) and `setActiveTab` (function). It also requires a `LangProvider` ancestor for i18n.

**If you used Option A (copy):**

```jsx
import { useState } from 'react'
import { LangProvider } from './i94-calculator/i18n/LangContext'
import { I94Calculator } from './i94-calculator/index.js'

export default function MyToolPage() {
  const [activeTab, setActiveTab] = useState('overview')
  return (
    <LangProvider>
      <I94Calculator activeTab={activeTab} setActiveTab={setActiveTab} />
    </LangProvider>
  )
}
```

**If you used Option B (npm install), the package name is `usdays`:**

```jsx
import { useState } from 'react'
import { LangProvider } from 'usdays/src/i18n/LangContext'
import { I94Calculator } from 'usdays'

export default function MyToolPage() {
  const [activeTab, setActiveTab] = useState('overview')
  return (
    <LangProvider>
      <I94Calculator activeTab={activeTab} setActiveTab={setActiveTab} />
    </LangProvider>
  )
}
```

### Step 4 — Include Tailwind CSS

**Option A (copy into `src/i94-calculator/`):** No extra config needed — `'./src/**/*.{js,jsx}'` already covers subdirectories of `src/`.

**Option B (npm install):** Add the package source to your `content` array:

```javascript
// tailwind.config.js
export default {
  content: [
    './src/**/*.{js,jsx}',
    './node_modules/usdays/src/**/*.{js,jsx}',
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
