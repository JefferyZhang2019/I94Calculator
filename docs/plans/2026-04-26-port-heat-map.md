# Port Heat Map — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Port Heat Map" accordion to the Analysis tab that plots I-94 entry/exit ports on a US map using heat glow circles, with a toggle for All/Entry/Exit and a ranked port list alongside.

**Architecture:** A new `portCoordinates.js` utility provides the ~300-port lookup table and a `lookupPort()` matcher. A new `computePortStats()` function in `calculator.js` aggregates port counts from stays and resolves coordinates. A new `PortHeatMap.jsx` component renders the map via `react-simple-maps` and the ranked list side-by-side. The accordion is wired into `AnalysisTab.jsx`.

**Tech Stack:** React 19, react-simple-maps, Tailwind CSS, Vite, Vitest

---

## File Map

| File | Change |
|---|---|
| `src/utils/portCoordinates.js` | New — lookup table + `lookupPort()` matcher |
| `src/utils/calculator.js` | Add `computePortStats(stays, mode)` |
| `src/utils/calculator.test.js` | Add tests for `computePortStats` |
| `src/components/PortHeatMap.jsx` | New — map + toggle + ranked list |
| `src/components/AnalysisTab.jsx` | Add Port Heat Map accordion |
| `src/i18n/strings.js` | Add new string keys |
| `package.json` | Add `react-simple-maps` |

---

## Task 1: Install react-simple-maps

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the package**

```bash
npm install react-simple-maps
```

Expected output: `added N packages` with no errors.

- [ ] **Step 2: Verify it resolves**

```bash
node -e "import('react-simple-maps').then(m => console.log(Object.keys(m)))"
```

Expected output: a list including `ComposableMap`, `Geographies`, `Geography`, `Marker`.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add react-simple-maps dependency"
```

---

## Task 2: Create portCoordinates.js

**Files:**
- Create: `src/utils/portCoordinates.js`

The lookup map keys are **normalized** port names: lowercase, all non-alphanumeric/non-space characters removed, multiple spaces collapsed.

Normalization formula: `name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()`

- [ ] **Step 1: Create the file with the full lookup table and matcher**

Create `src/utils/portCoordinates.js`:

```js
// Keys are normalized port names (lowercase, punctuation stripped, spaces collapsed).
// Values are { lat, lng } in decimal degrees.
const PORT_COORDINATES = {
  // ── Major International Airports ──────────────────────────────────────────
  'new york john f kennedy international airport': { lat: 40.6413, lng: -73.7781 },
  'john f kennedy international airport': { lat: 40.6413, lng: -73.7781 },
  'jfk': { lat: 40.6413, lng: -73.7781 },
  'new york kennedy': { lat: 40.6413, lng: -73.7781 },
  'los angeles international airport': { lat: 33.9425, lng: -118.4081 },
  'lax': { lat: 33.9425, lng: -118.4081 },
  'chicago ohare international airport': { lat: 41.9742, lng: -87.9073 },
  'ohare international airport': { lat: 41.9742, lng: -87.9073 },
  'ord': { lat: 41.9742, lng: -87.9073 },
  'atlanta hartsfieldjackson atlanta international airport': { lat: 33.6367, lng: -84.4281 },
  'hartsfieldjackson atlanta international airport': { lat: 33.6367, lng: -84.4281 },
  'atl': { lat: 33.6367, lng: -84.4281 },
  'dallas fort worth international airport': { lat: 32.8998, lng: -97.0403 },
  'dfw': { lat: 32.8998, lng: -97.0403 },
  'denver international airport': { lat: 39.8561, lng: -104.6737 },
  'den': { lat: 39.8561, lng: -104.6737 },
  'san francisco international airport': { lat: 37.6213, lng: -122.3790 },
  'sfo': { lat: 37.6213, lng: -122.3790 },
  'seattle tacoma international airport': { lat: 47.4502, lng: -122.3088 },
  'seatac international airport': { lat: 47.4502, lng: -122.3088 },
  'sea': { lat: 47.4502, lng: -122.3088 },
  'miami international airport': { lat: 25.7959, lng: -80.2870 },
  'mia': { lat: 25.7959, lng: -80.2870 },
  'boston logan international airport': { lat: 42.3656, lng: -71.0096 },
  'logan international airport': { lat: 42.3656, lng: -71.0096 },
  'bos': { lat: 42.3656, lng: -71.0096 },
  'orlando international airport': { lat: 28.4312, lng: -81.3081 },
  'mco': { lat: 28.4312, lng: -81.3081 },
  'harry reid international airport': { lat: 36.0840, lng: -115.1537 },
  'mccarran international airport': { lat: 36.0840, lng: -115.1537 },
  'las vegas international airport': { lat: 36.0840, lng: -115.1537 },
  'las': { lat: 36.0840, lng: -115.1537 },
  'charlotte douglas international airport': { lat: 35.2140, lng: -80.9431 },
  'clt': { lat: 35.2140, lng: -80.9431 },
  'phoenix sky harbor international airport': { lat: 33.4373, lng: -112.0078 },
  'phx': { lat: 33.4373, lng: -112.0078 },
  'newark liberty international airport': { lat: 40.6895, lng: -74.1745 },
  'ewr': { lat: 40.6895, lng: -74.1745 },
  'george bush intercontinental airport': { lat: 29.9902, lng: -95.3368 },
  'houston george bush intercontinental airport': { lat: 29.9902, lng: -95.3368 },
  'iah': { lat: 29.9902, lng: -95.3368 },
  'minneapolissaint paul international airport': { lat: 44.8848, lng: -93.2223 },
  'minneapolis saint paul international airport': { lat: 44.8848, lng: -93.2223 },
  'msp': { lat: 44.8848, lng: -93.2223 },
  'detroit metropolitan wayne county airport': { lat: 42.2162, lng: -83.3554 },
  'detroit metropolitan airport': { lat: 42.2162, lng: -83.3554 },
  'dtw': { lat: 42.2162, lng: -83.3554 },
  'philadelphia international airport': { lat: 39.8744, lng: -75.2424 },
  'phl': { lat: 39.8744, lng: -75.2424 },
  'laguardia airport': { lat: 40.7769, lng: -73.8740 },
  'new york laguardia airport': { lat: 40.7769, lng: -73.8740 },
  'lga': { lat: 40.7769, lng: -73.8740 },
  'baltimorewashington international airport': { lat: 39.1754, lng: -76.6682 },
  'baltimore washington international airport': { lat: 39.1754, lng: -76.6682 },
  'bwi': { lat: 39.1754, lng: -76.6682 },
  'washington dulles international airport': { lat: 38.9531, lng: -77.4565 },
  'dulles international airport': { lat: 38.9531, lng: -77.4565 },
  'iad': { lat: 38.9531, lng: -77.4565 },
  'salt lake city international airport': { lat: 40.7884, lng: -111.9778 },
  'slc': { lat: 40.7884, lng: -111.9778 },
  'chicago midway international airport': { lat: 41.7868, lng: -87.7522 },
  'midway international airport': { lat: 41.7868, lng: -87.7522 },
  'mdw': { lat: 41.7868, lng: -87.7522 },
  'daniel k inouye international airport': { lat: 21.3245, lng: -157.9251 },
  'honolulu international airport': { lat: 21.3245, lng: -157.9251 },
  'hnl': { lat: 21.3245, lng: -157.9251 },
  'san diego international airport': { lat: 32.7338, lng: -117.1933 },
  'san diego lindbergh field': { lat: 32.7338, lng: -117.1933 },
  'san': { lat: 32.7338, lng: -117.1933 },
  'tampa international airport': { lat: 27.9755, lng: -82.5332 },
  'tpa': { lat: 27.9755, lng: -82.5332 },
  'portland international airport': { lat: 45.5898, lng: -122.5951 },
  'pdx': { lat: 45.5898, lng: -122.5951 },
  'lambert st louis international airport': { lat: 38.7487, lng: -90.3700 },
  'st louis lambert international airport': { lat: 38.7487, lng: -90.3700 },
  'stl': { lat: 38.7487, lng: -90.3700 },
  'nashville international airport': { lat: 36.1245, lng: -86.6782 },
  'bna': { lat: 36.1245, lng: -86.6782 },
  'austinbergstrom international airport': { lat: 30.1975, lng: -97.6664 },
  'austin bergstrom international airport': { lat: 30.1975, lng: -97.6664 },
  'aus': { lat: 30.1975, lng: -97.6664 },
  'kansas city international airport': { lat: 39.2976, lng: -94.7139 },
  'mci': { lat: 39.2976, lng: -94.7139 },
  'raleighdurham international airport': { lat: 35.8776, lng: -78.7875 },
  'raleigh durham international airport': { lat: 35.8776, lng: -78.7875 },
  'rdu': { lat: 35.8776, lng: -78.7875 },
  'sacramento international airport': { lat: 38.6954, lng: -121.5908 },
  'smf': { lat: 38.6954, lng: -121.5908 },
  'san jose international airport': { lat: 37.3626, lng: -121.9290 },
  'sjc': { lat: 37.3626, lng: -121.9290 },
  'oakland international airport': { lat: 37.7213, lng: -122.2208 },
  'oak': { lat: 37.7213, lng: -122.2208 },
  'memphis international airport': { lat: 35.0424, lng: -89.9767 },
  'mem': { lat: 35.0424, lng: -89.9767 },
  'louisville international airport': { lat: 38.1744, lng: -85.7360 },
  'louisville standiford field': { lat: 38.1744, lng: -85.7360 },
  'sdf': { lat: 38.1744, lng: -85.7360 },
  'louis armstrong new orleans international airport': { lat: 29.9934, lng: -90.2580 },
  'new orleans international airport': { lat: 29.9934, lng: -90.2580 },
  'msy': { lat: 29.9934, lng: -90.2580 },
  'pittsburgh international airport': { lat: 40.4915, lng: -80.2329 },
  'pit': { lat: 40.4915, lng: -80.2329 },
  'san antonio international airport': { lat: 29.5337, lng: -98.4698 },
  'sat': { lat: 29.5337, lng: -98.4698 },
  'jacksonville international airport': { lat: 30.4941, lng: -81.6879 },
  'jax': { lat: 30.4941, lng: -81.6879 },
  'milwaukee mitchell international airport': { lat: 42.9472, lng: -87.8966 },
  'mke': { lat: 42.9472, lng: -87.8966 },
  'kahului airport': { lat: 20.8986, lng: -156.4305 },
  'maui airport': { lat: 20.8986, lng: -156.4305 },
  'ogg': { lat: 20.8986, lng: -156.4305 },
  'ellison onizuka kona international airport': { lat: 19.7388, lng: -156.0456 },
  'kona international airport': { lat: 19.7388, lng: -156.0456 },
  'koa': { lat: 19.7388, lng: -156.0456 },
  'hilo international airport': { lat: 19.7214, lng: -155.0481 },
  'ito': { lat: 19.7214, lng: -155.0481 },
  'lihue airport': { lat: 21.9760, lng: -159.3390 },
  'lih': { lat: 21.9760, lng: -159.3390 },
  'antonio b won pat international airport': { lat: 13.4834, lng: 144.7958 },
  'guam international airport': { lat: 13.4834, lng: 144.7958 },
  'gum': { lat: 13.4834, lng: 144.7958 },
  'luis munoz marin international airport': { lat: 18.4394, lng: -66.0018 },
  'san juan international airport': { lat: 18.4394, lng: -66.0018 },
  'sju': { lat: 18.4394, lng: -66.0018 },
  'ted stevens anchorage international airport': { lat: 61.1744, lng: -149.9964 },
  'anchorage international airport': { lat: 61.1744, lng: -149.9964 },
  'anc': { lat: 61.1744, lng: -149.9964 },
  'fairbanks international airport': { lat: 64.8151, lng: -147.8562 },
  'fai': { lat: 64.8151, lng: -147.8562 },
  'juneau international airport': { lat: 58.3550, lng: -134.5763 },
  'jnu': { lat: 58.3550, lng: -134.5763 },
  'albuquerque international sunport': { lat: 35.0402, lng: -106.6090 },
  'abq': { lat: 35.0402, lng: -106.6090 },
  'el paso international airport': { lat: 31.8072, lng: -106.3779 },
  'elp': { lat: 31.8072, lng: -106.3779 },
  'tucson international airport': { lat: 32.1161, lng: -110.9410 },
  'tus': { lat: 32.1161, lng: -110.9410 },
  'ontario international airport': { lat: 34.0560, lng: -117.6012 },
  'ont': { lat: 34.0560, lng: -117.6012 },
  'hollywood burbank airport': { lat: 34.2007, lng: -118.3583 },
  'burbank airport': { lat: 34.2007, lng: -118.3583 },
  'bur': { lat: 34.2007, lng: -118.3583 },
  'long beach airport': { lat: 33.8177, lng: -118.1516 },
  'lgb': { lat: 33.8177, lng: -118.1516 },
  'john wayne airport': { lat: 33.6757, lng: -117.8682 },
  'orange county airport': { lat: 33.6757, lng: -117.8682 },
  'sna': { lat: 33.6757, lng: -117.8682 },
  'richmond international airport': { lat: 37.5052, lng: -77.3197 },
  'ric': { lat: 37.5052, lng: -77.3197 },
  'bradley international airport': { lat: 41.9389, lng: -72.6832 },
  'bdl': { lat: 41.9389, lng: -72.6832 },
  'norfolk international airport': { lat: 36.8977, lng: -76.0120 },
  'orf': { lat: 36.8977, lng: -76.0120 },
  'buffalo niagara international airport': { lat: 42.9405, lng: -78.7322 },
  'buf': { lat: 42.9405, lng: -78.7322 },
  'cincinnati northern kentucky international airport': { lat: 39.0488, lng: -84.6678 },
  'cvg': { lat: 39.0488, lng: -84.6678 },
  'dulles': { lat: 38.9531, lng: -77.4565 },
  'reagan national airport': { lat: 38.8512, lng: -77.0402 },
  'ronald reagan washington national airport': { lat: 38.8512, lng: -77.0402 },
  'dca': { lat: 38.8512, lng: -77.0402 },
  'indianapolis international airport': { lat: 39.7173, lng: -86.2944 },
  'ind': { lat: 39.7173, lng: -86.2944 },
  'columbus john glenn international airport': { lat: 39.9980, lng: -82.8919 },
  'port columbus international airport': { lat: 39.9980, lng: -82.8919 },
  'cmh': { lat: 39.9980, lng: -82.8919 },
  'cleveland hopkins international airport': { lat: 41.4117, lng: -81.8498 },
  'cle': { lat: 41.4117, lng: -81.8498 },
  'spokane international airport': { lat: 47.6199, lng: -117.5338 },
  'geg': { lat: 47.6199, lng: -117.5338 },
  'boise airport': { lat: 43.5644, lng: -116.2228 },
  'boi': { lat: 43.5644, lng: -116.2228 },
  'reno tahoe international airport': { lat: 39.4991, lng: -119.7681 },
  'rno': { lat: 39.4991, lng: -119.7681 },

  // ── Mexico Land Border Crossings ──────────────────────────────────────────
  'san ysidro': { lat: 32.5543, lng: -117.0300 },
  'san ysidro california': { lat: 32.5543, lng: -117.0300 },
  'otay mesa': { lat: 32.5538, lng: -116.9735 },
  'otay mesa california': { lat: 32.5538, lng: -116.9735 },
  'calexico': { lat: 32.6789, lng: -115.4989 },
  'calexico california': { lat: 32.6789, lng: -115.4989 },
  'calexico east': { lat: 32.6777, lng: -115.4412 },
  'el paso texas': { lat: 31.7619, lng: -106.4850 },
  'el paso': { lat: 31.7619, lng: -106.4850 },
  'laredo texas': { lat: 27.5036, lng: -99.5075 },
  'laredo': { lat: 27.5036, lng: -99.5075 },
  'laredo colombia': { lat: 27.6389, lng: -99.5297 },
  'eagle pass texas': { lat: 28.7091, lng: -100.4995 },
  'eagle pass': { lat: 28.7091, lng: -100.4995 },
  'del rio texas': { lat: 29.3627, lng: -100.8965 },
  'del rio': { lat: 29.3627, lng: -100.8965 },
  'brownsville texas': { lat: 25.9017, lng: -97.4975 },
  'brownsville': { lat: 25.9017, lng: -97.4975 },
  'mcallen texas': { lat: 26.1003, lng: -98.2830 },
  'hidalgo texas': { lat: 26.1003, lng: -98.2830 },
  'hidalgo': { lat: 26.1003, lng: -98.2830 },
  'nogales arizona': { lat: 31.3404, lng: -110.9379 },
  'nogales': { lat: 31.3404, lng: -110.9379 },
  'douglas arizona': { lat: 31.3444, lng: -109.5453 },
  'douglas': { lat: 31.3444, lng: -109.5453 },
  'presidio texas': { lat: 29.5604, lng: -104.3704 },
  'presidio': { lat: 29.5604, lng: -104.3704 },
  'roma texas': { lat: 26.4062, lng: -99.0076 },
  'roma': { lat: 26.4062, lng: -99.0076 },
  'progreso texas': { lat: 26.0956, lng: -97.9600 },
  'progreso': { lat: 26.0956, lng: -97.9600 },
  'pharr texas': { lat: 26.1948, lng: -98.1831 },
  'pharr': { lat: 26.1948, lng: -98.1831 },
  'los indios texas': { lat: 26.0425, lng: -97.7503 },
  'columbus new mexico': { lat: 31.8279, lng: -107.6389 },
  'lukeville arizona': { lat: 31.8896, lng: -112.8127 },
  'lukeville': { lat: 31.8896, lng: -112.8127 },
  'naco arizona': { lat: 31.3332, lng: -109.9471 },
  'naco': { lat: 31.3332, lng: -109.9471 },
  'sasabe arizona': { lat: 31.4729, lng: -111.5399 },
  'san luis arizona': { lat: 32.4798, lng: -114.7803 },
  'san luis': { lat: 32.4798, lng: -114.7803 },
  'andrade california': { lat: 32.7243, lng: -114.7213 },
  'andrade': { lat: 32.7243, lng: -114.7213 },
  'santa teresa new mexico': { lat: 31.8618, lng: -106.6774 },
  'tornillo texas': { lat: 31.4452, lng: -106.0869 },

  // ── Canada Land Border Crossings ─────────────────────────────────────────
  'peace bridge': { lat: 42.9045, lng: -78.8906 },
  'buffalo peace bridge': { lat: 42.9045, lng: -78.8906 },
  'buffalo new york': { lat: 42.9045, lng: -78.8906 },
  'ambassador bridge': { lat: 42.3222, lng: -83.0456 },
  'detroit michigan': { lat: 42.3222, lng: -83.0456 },
  'detroit': { lat: 42.3222, lng: -83.0456 },
  'blue water bridge': { lat: 42.9931, lng: -82.4251 },
  'port huron michigan': { lat: 42.9931, lng: -82.4251 },
  'port huron': { lat: 42.9931, lng: -82.4251 },
  'sault sainte marie michigan': { lat: 46.5021, lng: -84.3459 },
  'sault ste marie': { lat: 46.5021, lng: -84.3459 },
  'niagara falls new york': { lat: 43.0962, lng: -79.0377 },
  'niagara falls': { lat: 43.0962, lng: -79.0377 },
  'champlain new york': { lat: 44.9885, lng: -73.4445 },
  'champlain': { lat: 44.9885, lng: -73.4445 },
  'derby line vermont': { lat: 45.0039, lng: -72.0970 },
  'derby line': { lat: 45.0039, lng: -72.0970 },
  'calais maine': { lat: 45.1867, lng: -67.2788 },
  'calais': { lat: 45.1867, lng: -67.2788 },
  'houlton maine': { lat: 46.1260, lng: -67.8400 },
  'houlton': { lat: 46.1260, lng: -67.8400 },
  'madawaska maine': { lat: 47.3566, lng: -68.3314 },
  'madawaska': { lat: 47.3566, lng: -68.3314 },
  'fort kent maine': { lat: 47.2562, lng: -68.5921 },
  'fort kent': { lat: 47.2562, lng: -68.5921 },
  'van buren maine': { lat: 47.1507, lng: -67.9383 },
  'van buren': { lat: 47.1507, lng: -67.9383 },
  'international falls minnesota': { lat: 48.6006, lng: -93.4106 },
  'international falls': { lat: 48.6006, lng: -93.4106 },
  'grand portage minnesota': { lat: 47.9634, lng: -89.6812 },
  'grand portage': { lat: 47.9634, lng: -89.6812 },
  'baudette minnesota': { lat: 48.7139, lng: -94.6022 },
  'baudette': { lat: 48.7139, lng: -94.6022 },
  'warroad minnesota': { lat: 48.9053, lng: -95.3158 },
  'warroad': { lat: 48.9053, lng: -95.3158 },
  'pembina north dakota': { lat: 48.9658, lng: -97.2375 },
  'pembina': { lat: 48.9658, lng: -97.2375 },
  'portal north dakota': { lat: 48.9933, lng: -102.5531 },
  'portal': { lat: 48.9933, lng: -102.5531 },
  'sweetgrass montana': { lat: 48.9989, lng: -111.5694 },
  'sweetgrass': { lat: 48.9989, lng: -111.5694 },
  'piegan montana': { lat: 48.9989, lng: -113.3878 },
  'piegan': { lat: 48.9989, lng: -113.3878 },
  'chief mountain montana': { lat: 48.9989, lng: -113.6267 },
  'chief mountain': { lat: 48.9989, lng: -113.6267 },
  'oroville washington': { lat: 48.9383, lng: -119.4386 },
  'oroville': { lat: 48.9383, lng: -119.4386 },
  'lynden washington': { lat: 48.9481, lng: -122.4533 },
  'lynden': { lat: 48.9481, lng: -122.4533 },
  'blaine washington': { lat: 48.9939, lng: -122.7497 },
  'blaine': { lat: 48.9939, lng: -122.7497 },
  'peace arch': { lat: 48.9939, lng: -122.7497 },
  'sumas washington': { lat: 48.9989, lng: -122.2700 },
  'sumas': { lat: 48.9989, lng: -122.2700 },
  'danville washington': { lat: 48.9989, lng: -118.6000 },
  'eastport idaho': { lat: 48.9989, lng: -116.1667 },
  'eastport': { lat: 48.9989, lng: -116.1667 },
  'porthill idaho': { lat: 48.9989, lng: -116.5000 },
  'porthill': { lat: 48.9989, lng: -116.5000 },
  'metaline falls washington': { lat: 48.8628, lng: -117.3667 },
  'metaline falls': { lat: 48.8628, lng: -117.3667 },
  'newport washington': { lat: 48.1844, lng: -117.0437 },
  'norton vermont': { lat: 45.0083, lng: -71.7917 },
  'norton': { lat: 45.0083, lng: -71.7917 },
  'richford vermont': { lat: 45.0000, lng: -72.6667 },
  'richford': { lat: 45.0000, lng: -72.6667 },
  'highgate springs vermont': { lat: 44.9897, lng: -73.0217 },
  'highgate springs': { lat: 44.9897, lng: -73.0217 },
  'beecher falls vermont': { lat: 44.9817, lng: -71.5167 },
  'beecher falls': { lat: 44.9817, lng: -71.5167 },
  'pittsburg new hampshire': { lat: 45.0750, lng: -71.3667 },
  'coburn gore maine': { lat: 45.2000, lng: -70.6817 },
  'coburn gore': { lat: 45.2000, lng: -70.6817 },
  'vanceboro maine': { lat: 45.5573, lng: -67.4315 },
  'vanceboro': { lat: 45.5573, lng: -67.4315 },
  'jackman maine': { lat: 45.6267, lng: -70.2570 },
  'jackman': { lat: 45.6267, lng: -70.2570 },
  'ogdensburg new york': { lat: 44.6940, lng: -75.4863 },
  'ogdensburg': { lat: 44.6940, lng: -75.4863 },
  'alexandria bay new york': { lat: 44.3318, lng: -75.9241 },
  'alexandria bay': { lat: 44.3318, lng: -75.9241 },
  'massena new york': { lat: 44.9284, lng: -74.8924 },
  'massena': { lat: 44.9284, lng: -74.8924 },
  'rooseveltown new york': { lat: 44.9833, lng: -74.7833 },
  'rooseveltown': { lat: 44.9833, lng: -74.7833 },
  'fort covington new york': { lat: 44.9817, lng: -74.4983 },
  'fort covington': { lat: 44.9817, lng: -74.4983 },
  'rouses point new york': { lat: 44.9867, lng: -73.3617 },
  'rouses point': { lat: 44.9867, lng: -73.3617 },
  'trout river new york': { lat: 44.9667, lng: -74.2667 },
  'trout river': { lat: 44.9667, lng: -74.2667 },
  'dunseith north dakota': { lat: 48.8167, lng: -100.0500 },
  'dunseith': { lat: 48.8167, lng: -100.0500 },
  'bottineau north dakota': { lat: 48.8286, lng: -100.4431 },
  'bottineau': { lat: 48.8286, lng: -100.4431 },
  'walhalla north dakota': { lat: 48.9167, lng: -97.9167 },
  'walhalla': { lat: 48.9167, lng: -97.9167 },
  'neche north dakota': { lat: 48.9833, lng: -97.5500 },
  'neche': { lat: 48.9833, lng: -97.5500 },
  'northgate north dakota': { lat: 49.0000, lng: -101.9000 },
  'northgate': { lat: 49.0000, lng: -101.9000 },
  'scobey montana': { lat: 48.7917, lng: -105.4250 },
  'opheim montana': { lat: 48.8628, lng: -106.4167 },
  'raymond montana': { lat: 49.0000, lng: -112.6500 },
  'del bonita montana': { lat: 49.0000, lng: -112.8000 },
  'wild horse montana': { lat: 49.0000, lng: -110.2167 },

  // ── Major Seaports ────────────────────────────────────────────────────────
  'port of new york': { lat: 40.6682, lng: -74.0700 },
  'port of new york and new jersey': { lat: 40.6682, lng: -74.0700 },
  'port of los angeles': { lat: 33.7406, lng: -118.2764 },
  'port of long beach': { lat: 33.7544, lng: -118.2165 },
  'port of seattle': { lat: 47.6040, lng: -122.3492 },
  'port of miami': { lat: 25.7759, lng: -80.1614 },
  'port of houston': { lat: 29.7355, lng: -95.2706 },
  'port of new orleans': { lat: 29.9526, lng: -90.0750 },
  'port of baltimore': { lat: 39.2654, lng: -76.5790 },
  'port of charleston': { lat: 32.7789, lng: -79.9400 },
  'port of savannah': { lat: 32.0720, lng: -81.0888 },
  'port of boston': { lat: 42.3530, lng: -71.0419 },
  'port of tampa': { lat: 27.9420, lng: -82.4559 },
  'port of philadelphia': { lat: 39.9526, lng: -75.1652 },
  'port of san francisco': { lat: 37.7956, lng: -122.3935 },
  'port of portland': { lat: 45.5480, lng: -122.7970 },
  'port of honolulu': { lat: 21.3069, lng: -157.8583 },
  'port of anchorage': { lat: 61.2208, lng: -149.8408 },
  'port of juneau': { lat: 58.3005, lng: -134.4197 },
  'port of norfolk': { lat: 36.8508, lng: -76.2955 },
  'port of jacksonville': { lat: 30.3949, lng: -81.5697 },
}

/**
 * Normalizes a port name for lookup: lowercase, strip non-alphanumeric/space, collapse spaces.
 * @param {string} name
 * @returns {string}
 */
function normalize(name) {
  return name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
}

/**
 * Looks up coordinates for a port name using exact → substring → first-token matching.
 * @param {string} portName
 * @returns {{ lat: number, lng: number } | null}
 */
export function lookupPort(portName) {
  if (!portName) return null
  const n = normalize(portName)
  if (!n) return null

  // 1. Exact match
  if (PORT_COORDINATES[n]) return PORT_COORDINATES[n]

  // 2. Substring match (either direction)
  for (const [key, coords] of Object.entries(PORT_COORDINATES)) {
    if (n.includes(key) || key.includes(n)) return coords
  }

  // 3. First-token match (skip tokens shorter than 4 chars to avoid false positives)
  const firstToken = n.split(' ').find(t => t.length >= 4)
  if (firstToken) {
    for (const [key, coords] of Object.entries(PORT_COORDINATES)) {
      if (key.startsWith(firstToken) || firstToken.startsWith(key.split(' ')[0])) return coords
    }
  }

  return null
}
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/portCoordinates.js
git commit -m "feat: add port coordinates lookup table and matcher"
```

---

## Task 3: Add computePortStats() to calculator.js

**Files:**
- Modify: `src/utils/calculator.js`
- Modify: `src/utils/calculator.test.js`

- [ ] **Step 1: Write the failing tests**

Add to the bottom of `src/utils/calculator.test.js`:

```js
import { computePortStats } from './calculator.js'

describe('computePortStats', () => {
  const stays = [
    {
      port: 'New York - John F. Kennedy International Airport',
      exitPort: 'Los Angeles International Airport',
      isOngoing: false,
    },
    {
      port: 'New York - John F. Kennedy International Airport',
      exitPort: '',
      isOngoing: true,
    },
    {
      port: 'Los Angeles International Airport',
      exitPort: 'New York - John F. Kennedy International Airport',
      isOngoing: false,
    },
  ]

  it('counts entry ports in entry mode', () => {
    const result = computePortStats(stays, 'entry')
    expect(result[0].port).toBe('New York - John F. Kennedy International Airport')
    expect(result[0].count).toBe(2)
    expect(result[1].port).toBe('Los Angeles International Airport')
    expect(result[1].count).toBe(1)
  })

  it('skips empty exitPort strings in exit mode', () => {
    const result = computePortStats(stays, 'exit')
    expect(result.every(r => r.port !== '')).toBe(true)
  })

  it('counts exit ports correctly in exit mode', () => {
    const result = computePortStats(stays, 'exit')
    const lax = result.find(r => r.port === 'Los Angeles International Airport')
    expect(lax.count).toBe(1)
    const jfk = result.find(r => r.port === 'New York - John F. Kennedy International Airport')
    expect(jfk.count).toBe(1)
  })

  it('counts all ports in all mode', () => {
    const result = computePortStats(stays, 'all')
    const jfk = result.find(r => r.port === 'New York - John F. Kennedy International Airport')
    expect(jfk.count).toBe(3)
    const lax = result.find(r => r.port === 'Los Angeles International Airport')
    expect(lax.count).toBe(2)
  })

  it('returns matched:true and non-null coords for known ports', () => {
    const result = computePortStats(stays, 'entry')
    expect(result[0].matched).toBe(true)
    expect(result[0].lat).not.toBeNull()
    expect(result[0].lng).not.toBeNull()
  })

  it('returns matched:false and null coords for unknown ports', () => {
    const unknownStays = [{ port: 'Zzz Unknown Port XYZ', exitPort: '', isOngoing: false }]
    const result = computePortStats(unknownStays, 'entry')
    expect(result[0].matched).toBe(false)
    expect(result[0].lat).toBeNull()
    expect(result[0].lng).toBeNull()
  })

  it('returns empty array for empty stays', () => {
    expect(computePortStats([], 'all')).toEqual([])
  })

  it('sorts results by count descending', () => {
    const result = computePortStats(stays, 'all')
    for (let i = 1; i < result.length; i++) {
      expect(result[i].count).toBeLessThanOrEqual(result[i - 1].count)
    }
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --reporter=verbose 2>&1 | grep -A 3 "computePortStats"
```

Expected: `computePortStats` tests fail with "computePortStats is not a function".

- [ ] **Step 3: Implement computePortStats in calculator.js**

Add to the bottom of `src/utils/calculator.js`:

```js
import { lookupPort } from './portCoordinates.js'

/**
 * Aggregates port usage counts from stays and resolves coordinates.
 * @param {Array} stays
 * @param {'all'|'entry'|'exit'} mode
 * @returns {Array<{port: string, count: number, lat: number|null, lng: number|null, matched: boolean}>}
 */
export function computePortStats(stays, mode) {
  const counts = new Map()
  for (const stay of stays) {
    const ports = []
    if (mode === 'entry' || mode === 'all') {
      if (stay.port) ports.push(stay.port)
    }
    if (mode === 'exit' || mode === 'all') {
      if (stay.exitPort) ports.push(stay.exitPort)
    }
    for (const port of ports) {
      counts.set(port, (counts.get(port) || 0) + 1)
    }
  }

  return Array.from(counts.entries())
    .map(([port, count]) => {
      const coords = lookupPort(port)
      return {
        port,
        count,
        lat: coords ? coords.lat : null,
        lng: coords ? coords.lng : null,
        matched: coords !== null,
      }
    })
    .sort((a, b) => b.count - a.count)
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --reporter=verbose 2>&1 | grep -A 3 "computePortStats"
```

Expected: all `computePortStats` tests pass.

- [ ] **Step 5: Run the full test suite to check for regressions**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/utils/calculator.js src/utils/calculator.test.js
git commit -m "feat: add computePortStats to calculator"
```

---

## Task 4: Add i18n strings

**Files:**
- Modify: `src/i18n/strings.js`

- [ ] **Step 1: Add the new keys to the en locale**

In `src/i18n/strings.js`, inside the `en: { ... }` object, add after the last existing key:

```js
portHeatMapTitle: 'Port Heat Map',
portHeatMapAll: 'All',
portHeatMapEntry: 'Entry',
portHeatMapExit: 'Exit',
portHeatMapNotOnMap: 'Not on map',
portHeatMapEmpty: 'No port data — paste your I-94 history to see the heat map.',
portHeatMapVisits: '{n} visit(s)',
```

- [ ] **Step 2: Commit**

```bash
git add src/i18n/strings.js
git commit -m "feat: add i18n strings for port heat map"
```

---

## Task 5: Create PortHeatMap.jsx

**Files:**
- Create: `src/components/PortHeatMap.jsx`

- [ ] **Step 1: Create the component**

Create `src/components/PortHeatMap.jsx`:

```jsx
import { useState } from 'react'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'
import { computePortStats } from '../utils/calculator'
import { useLang } from '../i18n/LangContext'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json'

function portColor(t) {
  if (t < 0.33) return '#22c55e'
  if (t < 0.66) return '#eab308'
  if (t < 0.85) return '#f97316'
  return '#ef4444'
}

function baseRadius(t) {
  return 5 + t * 13
}

export default function PortHeatMap({ stays }) {
  const { t, tpl } = useLang()
  const [mode, setMode] = useState('all')
  const [tooltip, setTooltip] = useState(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const stats = computePortStats(stays, mode)
  const matched = stats.filter(s => s.matched)
  const unmatched = stats.filter(s => !s.matched)
  const maxCount = matched.length > 0 ? matched[0].count : 1

  if (stats.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-8">{t('portHeatMapEmpty')}</p>
  }

  const modes = ['all', 'entry', 'exit']
  const modeLabels = {
    all: t('portHeatMapAll'),
    entry: t('portHeatMapEntry'),
    exit: t('portHeatMapExit'),
  }

  return (
    <div>
      {/* Toggle */}
      <div className="flex justify-end mb-4">
        <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden text-sm">
          {modes.map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-1.5 ${
                mode === m
                  ? 'bg-blue-600 text-white font-medium'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {modeLabels[m]}
            </button>
          ))}
        </div>
      </div>

      {/* Map + List */}
      <div className="flex gap-4">
        {/* Map */}
        <div
          className="relative"
          style={{ flex: '0 0 65%' }}
          onMouseMove={e => {
            const rect = e.currentTarget.getBoundingClientRect()
            setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
          }}
          onMouseLeave={() => setTooltip(null)}
        >
          <ComposableMap
            projection="geoAlbersUsa"
            style={{ width: '100%', height: 'auto' }}
          >
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map(geo => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#dbeafe"
                    stroke="#bfdbfe"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: 'none' },
                      hover: { outline: 'none' },
                      pressed: { outline: 'none' },
                    }}
                  />
                ))
              }
            </Geographies>
            {matched.map(({ port, count, lat, lng }) => {
              const ratio = count / maxCount
              const color = portColor(ratio)
              const base = baseRadius(ratio)
              return (
                <Marker key={port} coordinates={[lng, lat]}>
                  <g
                    onMouseEnter={() => setTooltip({ port, count })}
                    onMouseLeave={() => setTooltip(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    <circle r={base * 3} fill={color} fillOpacity={0.15} />
                    <circle r={base * 2} fill={color} fillOpacity={0.25} />
                    <circle r={base} fill={color} fillOpacity={0.70} />
                  </g>
                </Marker>
              )
            })}
          </ComposableMap>

          {tooltip && (
            <div
              className="absolute z-10 bg-gray-900 text-white text-xs rounded px-2 py-1 pointer-events-none whitespace-nowrap"
              style={{ left: mousePos.x + 10, top: mousePos.y - 30 }}
            >
              {tooltip.port} — {tpl('portHeatMapVisits', { n: tooltip.count })}
            </div>
          )}

          {matched.length === 0 && (
            <p className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
              No ports could be mapped
            </p>
          )}
        </div>

        {/* Ranked list */}
        <div className="flex-1 overflow-y-auto max-h-72">
          {matched.map(({ port, count }) => {
            const ratio = count / maxCount
            const color = portColor(ratio)
            return (
              <div key={port} className="flex items-center gap-2 py-1.5 border-b border-gray-100 last:border-0">
                <span
                  className="inline-block rounded-full flex-shrink-0"
                  style={{ width: 10, height: 10, background: color }}
                />
                <span className="text-sm text-gray-800 flex-1 truncate">{port}</span>
                <span className="text-sm font-semibold text-gray-700 flex-shrink-0">{count}</span>
              </div>
            )
          })}

          {unmatched.length > 0 && (
            <>
              <p className="text-xs text-gray-400 uppercase tracking-wide mt-3 mb-1 pt-2 border-t border-gray-100">
                {t('portHeatMapNotOnMap')}
              </p>
              {unmatched.map(({ port, count }) => (
                <div key={port} className="flex items-center gap-2 py-1.5 border-b border-gray-100 last:border-0">
                  <span
                    className="inline-block rounded-full flex-shrink-0 bg-gray-300"
                    style={{ width: 10, height: 10 }}
                  />
                  <span className="text-sm text-gray-500 flex-1 truncate">{port}</span>
                  <span className="text-sm font-semibold text-gray-500 flex-shrink-0">{count}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/PortHeatMap.jsx
git commit -m "feat: create PortHeatMap component"
```

---

## Task 6: Integrate into AnalysisTab.jsx

**Files:**
- Modify: `src/components/AnalysisTab.jsx`

- [ ] **Step 1: Add the import and new accordion**

At the top of `src/components/AnalysisTab.jsx`, add the import after the existing imports:

```js
import PortHeatMap from './PortHeatMap'
```

Then inside the returned JSX, after the closing `</Accordion>` tag of the Visit Summary section (the last accordion), add:

```jsx
{/* ── Port Heat Map ── */}
<Accordion title={t('portHeatMapTitle')} defaultOpen={false}>
  <PortHeatMap stays={stays} />
</Accordion>
```

- [ ] **Step 2: Start the dev server and verify visually**

```bash
npm run dev
```

Open the app, paste some I-94 data, go to the Analysis tab, open the "Port Heat Map" accordion. Verify:
- Toggle switches between All / Entry / Exit
- Heat glow dots appear on the US map at port locations
- Hovering a dot shows a tooltip with the port name and count
- Ranked list on the right shows ports sorted by count
- Unmatched ports appear at the bottom under "Not on map"

- [ ] **Step 3: Run the full test suite**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/AnalysisTab.jsx
git commit -m "feat: add Port Heat Map accordion to Analysis tab"
```
