# Auto-Center Map on Data Load

## Context

Currently, the map view is hardcoded to center at `[44.0, -69.0]` (Maine) with zoom level 7. When users run queries and new data loads (samples, facilities, water bodies), the map displays the data but **does not automatically center or zoom** to show it. Users must manually pan and zoom to find their results.

**The Problem:**
- Poor user experience - users can't see their query results without manual navigation
- Data may be completely off-screen from the default view
- No visual feedback that the query succeeded and data loaded

**The Solution:**
Implement auto-centering that automatically fits the map view to show all loaded data features when pipeline results complete.

---

## Implementation Approach

### Pattern: Controller Component

Create a `MapCenterController` component that:
- Uses react-leaflet's `useMap()` hook to access the map instance
- Calculates bounding box from all feature coordinates
- Calls `map.fitBounds()` when data changes
- Handles edge cases (empty data, single points, mixed geometries)

**Why this pattern:**
- `useMap()` can only be called from children of `MapContainer` - controller component is the natural fit
- Separates map control logic from data transformation (keeps `useMapLayers` focused on data)
- Easy to test and extend with future features
- Follows react-leaflet best practices

---

## Files to Modify

### NEW FILE: `src/components/Map/MapCenterController.tsx`

Create a new controller component with:

1. **Props Interface:**
   ```typescript
   interface MapCenterControllerProps {
     layers: MapLayerData;
   }
   ```

2. **Core Logic:**
   - Use `useMap()` hook to get map instance
   - Use `useRef` to track previous layers and avoid unnecessary recenters
   - `useEffect` with `[layers, map]` dependencies
   - Call `calculateBounds()` helper function
   - Handle edge cases before calling `map.fitBounds()`

3. **calculateBounds() Helper:**
   - Extract coordinates from all feature types:
     - **Samples**: Point geometries → add coordinates directly
     - **Facilities**: Point geometries → add coordinates directly
     - **Water Bodies**: Mixed types (Point/LineString/Polygon) → handle each
     - **Region Boundaries**: Only include if no data features exist (prevents over-zooming)
   - Return `L.LatLngBounds | null`
   - Return null if no coordinates found

4. **Edge Case Handling:**
   ```typescript
   // No data - keep current view
   if (!bounds) return;

   // Single point - use setView with fixed zoom
   if (bounds.getNorthEast().equals(bounds.getSouthWest())) {
     map.setView(bounds.getCenter(), 10);
     return;
   }

   // Multiple points - fit bounds with options
   map.fitBounds(bounds, {
     padding: [50, 50],  // 50px breathing room
     maxZoom: 15,        // Don't zoom past city-scale
     animate: true,
     duration: 0.5
   });
   ```

5. **Return Value:**
   - Return `null` (this is a controller component, renders nothing)

**Key Implementation Details:**

```typescript
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import type { MapLayerData } from '../../hooks/useMapLayers';
import L from 'leaflet';

function calculateBounds(layers: MapLayerData): L.LatLngBounds | null {
  const allCoordinates: [number, number][] = [];

  // Samples (Point)
  for (const feature of layers.samples) {
    if (feature.geometry.type === 'Point') {
      allCoordinates.push(feature.geometry.coordinates as [number, number]);
    }
  }

  // Facilities (Point)
  for (const feature of layers.facilities) {
    if (feature.geometry.type === 'Point') {
      allCoordinates.push(feature.geometry.coordinates as [number, number]);
    }
  }

  // Water Bodies (Point | LineString | Polygon)
  for (const feature of layers.waterBodies) {
    if (feature.geometry.type === 'Point') {
      allCoordinates.push(feature.geometry.coordinates as [number, number]);
    } else if (feature.geometry.type === 'LineString') {
      allCoordinates.push(...(feature.geometry.coordinates as [number, number][]));
    } else if (feature.geometry.type === 'Polygon') {
      // Only outer ring to avoid over-weighting complex polygons
      allCoordinates.push(...(feature.geometry.coordinates[0] as [number, number][]));
    }
  }

  // Region boundaries ONLY if no data features
  if (allCoordinates.length === 0) {
    for (const feature of layers.regionBoundaries) {
      if (feature.geometry.type === 'Polygon') {
        allCoordinates.push(...(feature.geometry.coordinates[0] as [number, number][]));
      }
    }
  }

  if (allCoordinates.length === 0) return null;
  return L.latLngBounds(allCoordinates);
}
```

---

### MODIFY: `src/components/Map/ResultsMap.tsx`

**Changes:**
1. Add import: `import { MapCenterController } from './MapCenterController';`
2. Add controller as child of `MapContainer`, before `LayersControl`

**Insertion point** (after line 28, after TileLayer):
```typescript
<TileLayer
  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
/>

{/* Auto-center controller - renders nothing, just manages map view */}
<MapCenterController layers={layers} />

{hasData && (
  <LayersControl position="topright">
    {/* existing layer controls */}
  </LayersControl>
)}
```

**Rationale for placement:**
- Must be inside `MapContainer` for `useMap()` hook to work
- Before LayersControl so it runs first
- Does not affect rendering - returns null

---

## Edge Cases & Behavior

| Scenario | Behavior |
|----------|----------|
| **Empty results** | Keep current view (do nothing) |
| **Single point** | Center on point with zoom level 10 (city-scale) |
| **Multiple points** | Fit bounds with 50px padding, max zoom 15 |
| **Only region boundaries** | Center on state boundary |
| **Data + regions** | Ignore regions, fit only to data features |
| **Very clustered data** | maxZoom:15 prevents over-zooming |
| **Very scattered data** | fitBounds automatically includes all points |
| **User manually pans/zoom** | Next query overrides and recenters (expected behavior) |
| **Layer toggle interaction** | Does NOT recenter (layers object unchanged) |

---

## Data Flow

```
Pipeline completes
  → Zustand store: pipelineResult updated
  → MainContent.tsx: useMapLayers(pipelineResult) triggered
  → useMapLayers useMemo: result dependency changed
  → New layers object created
  → ResultsMap re-renders with new layers
  → MapCenterController useEffect: layers dependency changed
  → calculateBounds(layers) → L.LatLngBounds
  → map.fitBounds(bounds, options)
  → Map view updates with smooth animation
```

**Performance:** `layers` only changes when `result` changes (useMapLayers is memoized), so auto-center only triggers on new query results, not on every render.

---

## Verification Steps

After implementation, test these scenarios:

1. **Basic Centering:**
   - Open app, run any query with results
   - Verify map smoothly animates to show all data
   - Verify 50px padding around edges

2. **Single Point:**
   - Create query returning 1 sample
   - Verify centers on point at zoom level 10
   - Verify doesn't zoom to street level

3. **Multiple States:**
   - Query for samples across multiple states (use region filter "Any")
   - Verify all points visible in view
   - Verify doesn't exceed maxZoom:15

4. **Mixed Geometries:**
   - Query for facilities + water bodies
   - Verify bounds include both points and linestrings/polygons
   - Verify polygon vertices are considered

5. **Empty to Data Transition:**
   - Start at default view (Maine, zoom 7)
   - Run query for Alabama data
   - Verify map jumps to Alabama

6. **Sequential Queries:**
   - Run query for Maine
   - Run query for Arizona
   - Verify map recenters to Arizona

7. **User Interaction Preservation:**
   - Run query → auto-centers
   - Manually pan/zoom to different area
   - Toggle layer visibility → verify doesn't recenter
   - Only recenters on new query

8. **Region Boundaries Only:**
   - Dashboard query with only region boundaries
   - Verify centers on state outline
   - Then run query with data → verify switches to data bounds

9. **Build Verification:**
   ```bash
   cd sawgraph-query-editor
   npm run build
   ```
   Verify no TypeScript errors.

---

## Critical Files Reference

- **New file**: `src/components/Map/MapCenterController.tsx` (~80 lines) - Core auto-centering logic
- **Modified**: `src/components/Map/ResultsMap.tsx` (line 28) - Add controller import + render
- **Reference**: `src/hooks/useMapLayers.ts` - MapLayerData interface and transformation logic
- **Reference**: `src/types/map.ts` - MapFeature geometry type definitions
- **Reference**: `src/engine/resultTransformer.ts` - WKT parsing (coordinates already [lat, lon])

---

## Dependencies

- **react-leaflet**: v5.0.0 (already installed) - provides `useMap()` hook
- **leaflet**: v1.9.4 (already installed) - provides `L.latLngBounds()` and map methods
- **No new dependencies required**

---

## Future Enhancements

1. **Reset View Button**: Add UI control to manually trigger recenter to data
2. **Smart Padding**: Adjust padding based on number of features or zoom level
3. **Animation Toggle**: User preference to disable smooth animation
4. **Preserve Manual View**: Setting to disable auto-center after first query
5. **Zoom to Selected**: Click feature → zoom to that feature

---

## Notes

- The hardcoded initial center `[44.0, -69.0]` remains in `MapContainer` props - this is fine, it's just the starting view before any data loads
- The controller pattern is standard react-leaflet practice (see official docs: "Creating a custom component")
- Auto-center runs on every `layers` change, which only happens on new pipeline results (not on every render)
- Region boundaries are weighted lower (only used if no data) to prevent zooming too far out when actual data exists
