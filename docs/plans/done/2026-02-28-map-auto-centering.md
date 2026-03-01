# Map Auto-Centering on Data Load

**Status**: done
**Created**: 2026-02-28
**Completed**: 2026-02-28

## Problem

The map view is hardcoded to center at `[44.0, -69.0]` (Maine) with zoom level 7. When users run queries and new data loads, the map doesn't auto-center — users must manually pan and zoom to find results. Data may be completely off-screen from the default view.

## Approach

Create a `MapCenterController` component that lives inside `MapContainer` and uses the `useMap()` hook to call `map.fitBounds()` whenever the `layers` prop changes.

- `layers` only changes when `result` changes (`useMapLayers` is memoized), so auto-center only fires on new query results — not on renders or layer toggles
- Controller renders nothing (`return null`) — pure behavior component
- Region boundaries are only used if no data features exist (prevents over-zooming to state outlines when data is present)

## Tasks

- [ ] Create `src/components/Map/MapCenterController.tsx`
  - `calculateBounds(layers)` helper — extracts coordinates from samples, facilities, water bodies (points/lines/polygons), falls back to region boundaries if no data
  - `useEffect` on `[layers, map]` — calls `map.fitBounds()` with `padding: [50,50]`, `maxZoom: 15`, `animate: true`
  - Single point edge case: `map.setView(center, 10)` instead of fitBounds
- [ ] Add `<MapCenterController layers={layers} />` to `src/components/Map/ResultsMap.tsx` (inside `MapContainer`, before `LayersControl`)
- [ ] Verify `npm run build` passes

## Notes

- `useMap()` can only be called from children of `MapContainer` — this is why a controller component is needed rather than logic in the parent
- Hardcoded initial center `[44.0, -69.0]` in `MapContainer` props remains — it's the starting view before any data loads, not a bug
- react-leaflet v5 + leaflet v1.9.4 are already installed, no new deps needed
- Full implementation details were drafted in the previous planning session (see session history)

### Edge Cases

| Scenario | Behavior |
|----------|----------|
| Empty results | Keep current view |
| Single point | `setView(center, 10)` |
| Multiple points | `fitBounds` with 50px padding, maxZoom 15 |
| Only region boundaries | Center on state outline |
| Data + regions | Ignore regions, fit to data only |
| Layer toggle | Does NOT recenter (layers object unchanged) |
