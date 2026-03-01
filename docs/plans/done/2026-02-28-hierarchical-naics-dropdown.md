# Hierarchical NAICS Industry Dropdown

**Status**: done
**Created**: 2026-02-28
**Completed**: 2026-02-28

## Context

The FacilityFilters component uses a flat `react-select` dropdown for NAICS industry codes. NAICS codes are inherently hierarchical (2-digit sectors → 3-digit → 4-digit groups → 5-6 digit specifics), but the current UI shows them as a flat list. Additionally, the dropdown gets clipped inside the modal's scrollable body.

## Problem

1. Dropdown is clipped by the modal's `overflow-y: auto` — users must scroll inside the modal to see options
2. No dynamic positioning — dropdown always opens downward even when near the bottom of the viewport
3. Flat list makes it hard to find related industries
4. No way to select an entire industry sector at once

## Approach

Replace `react-select` in `FacilityFilters` with a custom `HierarchicalSelect` component that renders a tree dropdown via a portal.

## Tasks

- [x] **1. Create `useNaicsTree.ts` hook** — tree building, selection expansion/collapse logic
- [x] **2. Create `TreeNode.tsx`** — recursive tree node with expand/collapse, three-state checkbox
- [x] **3. Create `HierarchicalSelect.tsx`** — portal dropdown, dynamic positioning, chip display
- [x] **4. Add CSS styles to `App.css`** — all `.hs-*` classes
- [x] **5. Update `FacilityFilters.tsx`** — replaced react-select with HierarchicalSelect
- [x] **6. Build & verify** — `npm run build` and `npm run lint` pass cleanly
