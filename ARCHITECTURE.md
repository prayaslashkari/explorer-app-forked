# SAWGraph Query Editor — Architecture Guide

A comprehensive guide to understanding how this application works, from knowledge graphs to query pipelines.

---

## Table of Contents

1. [Knowledge Graphs 101](#knowledge-graphs-101)
2. [High-Level Architecture](#high-level-architecture)
3. [Folder Structure](#folder-structure)
4. [Data Flow](#data-flow)
5. [The Query Pipeline](#the-query-pipeline)
6. [SPARQL Queries](#sparql-queries)
7. [Key Design Decisions](#key-design-decisions)
8. [The Endpoints](#the-endpoints)

---

## Knowledge Graphs 101

### What is a Knowledge Graph?

A knowledge graph is a database that stores information as **triples**: `(subject, predicate, object)`. Think of it like sentences:

- "Facility_123 **is located in** Illinois"
- "Facility_123 **has industry** NAICS-3253"
- "S2Cell_456 **contains** Facility_123"

Each triple connects two entities (subject and object) with a relationship (predicate).

### Why Use Knowledge Graphs?

Unlike SQL databases with fixed table schemas, knowledge graphs:
- **Connect anything to anything** — no rigid tables
- **Follow relationships** — traverse connections like "find all facilities → in S2 cells → connected to Maine"
- **Integrate multiple datasets** — combine EPA facility data, PFAS samples, hydrology data seamlessly

### SPARQL = SQL for Knowledge Graphs

SPARQL is the query language for knowledge graphs. It pattern-matches against triples:

```sparql
SELECT ?facility ?name WHERE {
  ?facility rdf:type fio:Facility .        # Find all facilities
  ?facility rdfs:label ?name .              # Get their names
  ?facility fio:ofIndustry naics:NAICS-3253 . # Filter by industry
}
```

This finds all facilities with industry code 3253 and returns their names.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         User Interface                       │
│  (Dashboard + Query Editor + Map)                           │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                      Query Pipeline                          │
│  (Planner → Executor → Result Transformer)                  │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                   SPARQL Query Templates                     │
│  (Facilities, Samples, Water Bodies, Spatial, Hydrology)   │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                     SPARQL Endpoints                         │
│  fiokg │ sawgraph │ spatialkg │ hydrologykg │ federation   │
└─────────────────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    Knowledge Graphs                          │
│  (RDF Triples in GraphDB)                                   │
└─────────────────────────────────────────────────────────────┘
```

**The flow:**
1. User asks: "What samples are near facilities in Maine?"
2. Query pipeline breaks this into steps
3. Each step generates a SPARQL query
4. Query executes against the right endpoint
5. Results transform into map features
6. Map displays points/polygons

---

## Folder Structure

```
sawgraph-query-editor/
├── src/
│   ├── components/          # React UI components
│   │   ├── Dashboard/       # Pre-built query cards
│   │   ├── QueryEditor/     # Block A / Relationship / Block C editors
│   │   ├── Map/             # Leaflet map + layers
│   │   ├── Pipeline/        # Pipeline progress visualization
│   │   └── Layout/          # Header, sidebar, layout
│   │
│   ├── engine/              # THE CORE: Query pipeline logic
│   │   ├── planner.ts       # Converts question → pipeline steps
│   │   ├── executor.ts      # Executes steps sequentially
│   │   ├── sparqlClient.ts  # Sends SPARQL to endpoints
│   │   ├── resultTransformer.ts # SPARQL rows → map features
│   │   └── templates/       # SPARQL query builders
│   │       ├── facilities.ts
│   │       ├── samples.ts
│   │       ├── waterBodies.ts
│   │       ├── spatial.ts   # Region filters, near expansion
│   │       └── hydrology.ts # Upstream/downstream tracing
│   │
│   ├── store/
│   │   └── queryStore.ts    # Zustand state (question + results)
│   │
│   ├── hooks/
│   │   └── useDiscoveryQueries.ts # React Query for dropdown data
│   │
│   ├── types/
│   │   ├── query.ts         # AnalysisQuestion, filters
│   │   └── sparql.ts        # SPARQL response types
│   │
│   └── constants/
│       ├── endpoints.ts     # SPARQL endpoint URLs
│       ├── prefixes.ts      # SPARQL namespace prefixes
│       └── regions.ts       # US states with data
│
├── FINDINGS.md              # Bugs, data model notes
├── DISCOVERY.md             # Predicate inventories
└── ARCHITECTURE.md          # This file
```

**Key directories:**
- **`engine/`** — The brain. All query logic lives here.
- **`components/`** — React UI. Organized by screen area.
- **`store/`** — Zustand for global state (the current question and results).
- **`hooks/`** — React Query for async data fetching (dropdown population).

---

## Data Flow

### 1. User Builds a Question

User selects in the UI:
- **Block A** (target): "Samples"
- **Relationship**: "near"
- **Block C** (anchor): "Facilities with NAICS 3253"
- **Region**: "Maine"

This creates an `AnalysisQuestion` object:

```typescript
{
  blockA: {
    type: 'samples',
    sampleFilters: { substances: [...], materialTypes: [...] },
    region: { stateCode: '23', countyCodes: ['23019'] }
  },
  relationship: { type: 'near' },
  blockC: {
    type: 'facilities',
    facilityFilters: { industryCodes: ['3253'] },
    region: { stateCode: '23' }
  }
}
```

### 2. Planner Creates Pipeline Steps

`planner.ts` converts the question into a sequence of steps:

```typescript
[
  Step 1: GET_S2_FOR_ANCHOR (Find S2 cells with NAICS 3253 facilities)
  Step 2: FILTER_S2_TO_REGION (Keep only Maine S2 cells)
  Step 3: EXPAND_S2_NEAR (Expand to neighboring S2 cells ~10km)
  Step 4: FILTER_S2_POST_SPATIAL (Filter expanded cells to target region)
  Step 5: FIND_TARGET_ENTITIES (Find samples in those S2 cells)
  Step 6: GET_ANCHOR_DETAILS (Get facility details for map)
  Step 7: GET_REGION_BOUNDARIES (Get Maine boundary polygon)
]
```

Each step specifies:
- **Type** (what kind of operation)
- **Endpoint** (which knowledge graph to query)
- **Description** (shown to user during execution)
- **Query builder** (function that generates SPARQL)

### 3. Executor Runs Steps Sequentially

`executor.ts` runs each step in order:

```typescript
for (const step of steps) {
  // 1. Build SPARQL query using context from previous steps
  const query = step.buildQuery(context);

  // 2. Execute against the endpoint
  const results = await executeSparql(step.endpoint, query);

  // 3. Update context for next step
  if (step produces S2 cells) {
    context.s2Cells = results.map(r => r.s2cell);
  }

  // 4. Store results
  context.results[step.type] = results;

  // 5. Early exit if no S2 cells (empty result)
  if (context.s2Cells.length === 0) break;
}
```

**Key concept: Threading S2 cells through steps**
- Step 1 finds S2 cells `['kwgr:s2.level13.123', 'kwgr:s2.level13.456']`
- Step 2 filters them to `['kwgr:s2.level13.123']`
- Step 3 expands to `['kwgr:s2.level13.123', 'kwgr:s2.level13.789']`
- Step 5 uses those cells to find samples

### 4. Result Transformer → Map Features

`resultTransformer.ts` converts SPARQL rows to GeoJSON-like features:

**Input (SPARQL row):**
```javascript
{
  sp: 'http://...samplePoint123',
  spWKT: 'POINT(-69.7795 44.3106)',
  substances: 'PFOA; PFOS',
  max: '45.2'
}
```

**Output (MapFeature):**
```javascript
{
  id: 'samplePoint123',
  geometry: {
    type: 'Point',
    coordinates: [44.3106, -69.7795] // [lat, lon] for Leaflet
  },
  properties: {
    type: 'sample',
    substances: 'PFOA; PFOS',
    maxConcentration: 45.2
  }
}
```

Handles Point, LineString, Polygon, MultiPolygon geometries.

### 5. Map Renders Layers

React components in `components/Map/` render features:
- `SampleLayer` — orange circles
- `FacilityLayer` — blue markers
- `WaterBodyLayer` — cyan polygons/lines
- `RegionLayer` — gray boundary polygons

---

## The Query Pipeline

### What is a Pipeline Step?

Each step is an object:

```typescript
{
  type: 'GET_S2_FOR_ANCHOR',
  endpoint: 'federation',
  description: 'Finding S2 cells containing matching facilities',
  buildQuery: (context) => {
    // Generate SPARQL using:
    // - User's filters (NAICS codes)
    // - Previous step results (S2 cells from context)
    return `SELECT ?s2cell WHERE { ... }`
  }
}
```

### Example: "Samples near facilities" Pipeline

Let's trace a full pipeline execution.

#### User Question:
"What samples in Penobscot County, Maine are near facilities with NAICS 3253?"

#### Step 1: GET_S2_FOR_ANCHOR (Find facility S2 cells)

**Endpoint:** `federation`

**SPARQL Generated:**
```sparql
SELECT DISTINCT ?s2cell WHERE {
  ?s2cell rdf:type kwg-ont:S2Cell_Level13 ;
          kwg-ont:sfContains ?facility .
  ?facility fio:ofIndustry naics:NAICS-3253 .
} GROUP BY ?s2cell
```

**What this does:**
- Find all S2 Level 13 cells
- That contain facilities
- With NAICS industry code 3253

**Result:** 1,534 S2 cells (nationwide with NAICS 3253 facilities)

#### Step 2: FILTER_S2_TO_REGION (Filter to Maine)

**Endpoint:** `spatialkg`

**SPARQL Generated:**
```sparql
SELECT ?s2cell WHERE {
  ?s2neighbor spatial:connectedTo kwgr:administrativeRegion.USA.23 .
  VALUES ?s2neighbor { kwgr:s2.level13.123 kwgr:s2.level13.456 ... }
  ?s2neighbor kwg-ont:sfTouches | owl:sameAs ?s2cell .
}
```

**What this does:**
- Take the 1,534 S2 cells from Step 1
- Find which ones are connected to Maine (FIPS code 23)
- Return those cells + their touching neighbors

**Result:** 0 S2 cells (no NAICS 3253 facilities in Maine)

**Pipeline exits early** — no point continuing if no S2 cells remain.

#### If there were results... the pipeline would continue:

**Step 3:** Expand S2 cells to neighbors (~10km radius)
**Step 4:** Filter expanded cells to target region (Penobscot County)
**Step 5:** Find samples in those S2 cells
**Step 6:** Get facility details for map display
**Step 7:** Get county boundary polygon

### Why S2 Cells?

**S2 cells** are Google's spatial index — they divide Earth into hierarchical grid cells. Level 13 ≈ 1.2km².

**Why we use them:**
- **Fast spatial queries** — instead of computing "is point X within 10km of point Y?" for millions of combinations, we just check "do they share an S2 cell?"
- **Pre-computed in the knowledge graph** — facilities, samples, water bodies all have `spatial:connectedTo` links to S2 cells
- **Hierarchical** — can zoom in/out by changing level

```
S2 Cell Hierarchy:
Level 0  = whole Earth
Level 10 = ~102 km²
Level 13 = ~1.2 km²   ← We use this
Level 16 = ~76 m²
Level 30 = ~1 cm²
```

---

## SPARQL Queries

### SPARQL Basics

SPARQL queries have three parts:

1. **Prefixes** — Namespace shortcuts
2. **SELECT** — What to return
3. **WHERE** — Pattern to match

Example:

```sparql
PREFIX fio: <http://w3id.org/fio/v1/fio#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?facility ?name WHERE {
  ?facility rdf:type fio:Facility .
  ?facility rdfs:label ?name .
  ?facility fio:ofIndustry naics:NAICS-3253 .
}
```

**Reads like:** "Find things called `?facility` where:
- `?facility` has type `fio:Facility`
- `?facility` has label `?name`
- `?facility` has industry `naics:NAICS-3253`"

The `?` variables get bound to actual values from the graph.

### How Our Templates Work

Each template function builds a SPARQL string. Example from `facilities.ts`:

```typescript
export function buildFacilityS2Query(filters?: FacilityFilters): string {
  const industryValuesClause = buildIndustryValues(filters?.industryCodes);

  return `
    ${PREFIXES}
    SELECT DISTINCT ?s2cell WHERE {
      ?s2cell rdf:type kwg-ont:S2Cell_Level13 ;
              kwg-ont:sfContains ?facility .
      ?facility fio:ofIndustry ?industryGroup ;
                fio:ofIndustry ?industryCode .
      ?industryCode a naics:NAICS-IndustryCode .
      ${industryValuesClause}
    } GROUP BY ?s2cell
  `;
}
```

**If user selects NAICS code "3253":**

`industryValuesClause` becomes:
```sparql
VALUES ?industryCode { naics:NAICS-3253 }
```

**Final query:**
```sparql
PREFIX fio: <http://w3id.org/fio/v1/fio#>
PREFIX naics: <http://w3id.org/fio/v1/naics#>
PREFIX kwg-ont: <http://stko-kwg.geog.ucsb.edu/lod/ontology/>

SELECT DISTINCT ?s2cell WHERE {
  ?s2cell rdf:type kwg-ont:S2Cell_Level13 ;
          kwg-ont:sfContains ?facility .
  ?facility fio:ofIndustry ?industryGroup ;
            fio:ofIndustry ?industryCode .
  ?industryCode a naics:NAICS-IndustryCode .
  VALUES ?industryCode { naics:NAICS-3253 }
} GROUP BY ?s2cell
```

### Common SPARQL Patterns

**1. VALUES — Filter a variable to specific options**
```sparql
VALUES ?substance { coso:PFOA coso:PFOS coso:PFNA }
?observation coso:ofSubstance ?substance .
```
Only matches observations of PFOA, PFOS, or PFNA.

**2. OPTIONAL — Don't fail if missing**
```sparql
?facility rdfs:label ?name .
OPTIONAL { ?facility schema:address ?address . }
```
Returns facilities even if they don't have an address.

**3. FILTER — Conditional filtering**
```sparql
?result coso:measurementValue ?value .
FILTER (?value > 50)
```
Only results with value > 50.

**4. Property paths — Follow relationships**
```sparql
?facility geo:hasGeometry/geo:asWKT ?wkt .
```
Equivalent to:
```sparql
?facility geo:hasGeometry ?geom .
?geom geo:asWKT ?wkt .
```

**5. BIND — Create new variables**
```sparql
BIND(REPLACE(STR(?region), ".*USA\\.", "") AS ?stateFIPS)
```
Extracts "23" from "kwgr:administrativeRegion.USA.23".

---

## Key Design Decisions

### 1. Why Separate Planning and Execution?

**Problem:** A query like "samples near facilities" could be implemented many ways:
- Start from samples, find nearby facilities?
- Start from facilities, find nearby samples?
- Which endpoint for each step?

**Solution:** `planner.ts` encodes the strategy as a declarative pipeline. `executor.ts` just runs steps. This separates "what to do" from "how to do it."

**Benefits:**
- Easy to debug — see the plan before executing
- Easy to test — mock step results
- Easy to change strategy — edit planner, executor stays the same

### 2. Why Thread S2 Cells Between Steps?

**Problem:** Can't do cross-endpoint joins in SPARQL (federation endpoint has limitations).

**Solution:** Use S2 cells as a "join key" passed through pipeline steps:
1. Find facility S2 cells in `federation`
2. Filter them in `spatialkg` (has admin region data)
3. Find samples in those cells in `sawgraph`

**Benefits:**
- Works around federation limitations
- Fast (S2 cells are pre-indexed)
- Flexible (any entity can link via S2 cells)

### 3. Why Zustand + React Query?

**Zustand** (`queryStore.ts`) — Global state for:
- Current question (Block A/B/C)
- Pipeline results
- UI state (view mode, progress)

**React Query** (`useDiscoveryQueries.ts`) — Async data fetching for:
- Dropdown options (NAICS codes, substances, etc.)
- Cached with `staleTime: Infinity` (doesn't change)
- Hardcoded fallbacks if endpoints fail

**Benefits:**
- Separation of concerns (query state vs dropdown data)
- React Query handles loading/error/caching automatically
- Zustand is simpler than Redux

### 4. Why Templates Instead of a Query Builder?

**Could have used:** A query builder library (like SPARQL.js)

**We chose:** String templates (`templates/*.ts`)

**Why:**
- SPARQL queries are complex (property paths, FILTERs, OPTIONALs)
- Templates are readable — you see the actual SPARQL
- Easy to debug — copy query into SPARQL editor to test
- Full control — no library limitations

### 5. Why Transform SPARQL Rows to Features?

**Problem:** SPARQL returns flat rows with WKT strings:
```javascript
{ sp: '...', spWKT: 'POINT(-69.7 44.3)', substances: 'PFOA; PFOS' }
```

**Leaflet needs:** GeoJSON-like features with typed geometry:
```javascript
{ id: '...', geometry: { type: 'Point', coordinates: [44.3, -69.7] }, properties: {...} }
```

**Solution:** `resultTransformer.ts` parses WKT → coordinates, detects feature type from row shape, builds typed objects.

**Benefits:**
- Decouples SPARQL from React components
- Type-safe (TypeScript `MapFeature` interface)
- Handles all geometry types (Point, LineString, Polygon, MultiPolygon)

---

## The Endpoints

All endpoints are SPARQL query interfaces to different parts of the knowledge graph.

### fiokg
**Contains:** Facility data
**Classes:** `fio:Facility`
**Count:** 1.3M facilities across 13 states
**Key predicates:**
- `fio:ofIndustry` → NAICS industry codes
- `rdfs:label` → Facility name
- `geo:hasGeometry/geo:asWKT` → Point location
- `kwg-ont:sfWithin` → S2 cells, admin regions

**Used for:** Facility details (Step 6 in pipelines)

### sawgraph
**Contains:** PFAS sample and observation data
**Classes:** `coso:MaterialSample`, `coso:ContaminantObservation`, `coso:SamplePoint`
**Count:** 28K samples, 705K observations
**Key predicates:**
- `coso:sampleOfMaterialType` → Water, soil, etc.
- `coso:ofSubstance` → PFOA, PFOS, etc.
- `coso:measurementValue` → Concentration (ng/L)
- `spatial:connectedTo` → S2 cells (via SamplePoint)

**Used for:** Sample retrieval, concentration data

### spatialkg
**Contains:** S2 cells, admin regions, spatial index
**Classes:** `kwg-ont:S2Cell_Level13`, `kwg-ont:AdministrativeRegion_2/3`
**Count:** 7.4M S2 cells, 35K counties, 6K states
**Key predicates:**
- `spatial:connectedTo` → Links S2 cells to regions
- `kwg-ont:sfContains` → Containment (region contains cells)
- `kwg-ont:sfTouches` → Neighboring cells
- `kwg-ont:hasFIPS` → FIPS codes

**Used for:** Region filtering, near expansion, boundaries

### hydrologykg
**Contains:** Water bodies, flow paths, wells
**Classes:** `hyf:HY_WaterBody`, `hyf:HY_FlowPath`
**Count:** 73K water bodies, 435K flow paths
**Key predicates:**
- `spatial:connectedTo` → S2 cells
- `hyf:downstreamFlowPathTC` → 408M transitive closure triples
- `nhdplusv2:hasCOMID` → NHDPlus identifiers
- `schema:name` → Water body names

**Used for:** Water body queries, upstream/downstream tracing

### federation
**Contains:** Nothing directly — it queries across all graphs
**How it works:** SPARQL federation joins data from multiple endpoints in a single query
**Caveat:** Performs owl:sameAs reasoning, inflating facility counts (1.3M real → 4.9M with aliases)

**Used for:** Facility S2 lookup (Step 1), cross-graph queries

---

## Common Patterns

### Pattern 1: Find entities in a region

```typescript
// Step 1: Find S2 cells with entity
SELECT ?s2cell WHERE {
  ?s2cell kwg-ont:sfContains ?entity .
  ?entity rdf:type SomeClass .
}

// Step 2: Filter to region
SELECT ?s2cell WHERE {
  VALUES ?s2cell { /* cells from step 1 */ }
  ?s2cell spatial:connectedTo kwgr:administrativeRegion.USA.23 .
}

// Step 3: Get entity details
SELECT ?entity ?wkt ?name WHERE {
  VALUES ?s2cell { /* cells from step 2 */ }
  ?s2cell kwg-ont:sfContains ?entity .
  ?entity geo:hasGeometry/geo:asWKT ?wkt ;
          rdfs:label ?name .
}
```

### Pattern 2: Spatial relationship (near)

```typescript
// Find S2 cells with anchor entity
// Filter to region
// Expand to neighboring cells (via kwg-ont:sfTouches)
// Filter neighbors to target region
// Find target entities in expanded cells
```

### Pattern 3: Hydrological relationship (downstream)

```typescript
// Find S2 cells with anchor (facilities)
// Find flow paths in those cells
// Follow hyf:downstreamFlowPathTC (transitive closure)
// Find S2 cells connected to downstream flow paths
// Find target entities (samples) in those cells
```

---

## Debugging Tips

### 1. Check FINDINGS.md and DISCOVERY.md

- `FINDINGS.md` — Known bugs, data coverage gaps
- `DISCOVERY.md` — Predicate inventories (what predicates exist on each entity type)

### 2. Inspect Pipeline Steps

In browser DevTools, set breakpoint in `executor.ts` and log each step's query:

```typescript
console.log(step.description);
console.log(query);
console.log(results);
```

### 3. Test SPARQL Queries Directly

Copy a query from the console, run it at:
```
https://frink.apps.renci.org/fiokg/sparql
```

### 4. Check S2 Cell Counts

If a step returns 0 results, check if S2 cells are empty:

```typescript
console.log('S2 cells after step:', context.s2Cells.length);
```

### 5. Validate Predicates

Use DISCOVERY.md to check if a predicate exists. Example:
- Using `kwg-ont:sfContains` for water bodies? ❌ Zero triples
- Should use `spatial:connectedTo` ✅ 274K triples

---

## Summary

**The app in one sentence:**
A React SPA that converts natural language questions into multi-step SPARQL query pipelines, executes them against distributed knowledge graph endpoints, and visualizes geospatial results on a map.

**Key concepts:**
- **Knowledge graphs** — Triples connecting entities
- **SPARQL** — Query language for graphs
- **S2 cells** — Spatial index for fast geo queries
- **Pipeline** — Multi-step query execution
- **Federation** — Cross-graph querying

**Architecture highlights:**
- Planner creates steps, Executor runs them
- S2 cells thread between steps as "join keys"
- Templates generate SPARQL with user filters
- Result transformer parses WKT → GeoJSON
- Zustand for question state, React Query for dropdown data

**13 states have data:** AL, AZ, AR, IL, IN, KS, ME, MA, MN, NH, OH, SC, VT
