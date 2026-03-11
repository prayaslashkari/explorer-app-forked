# Samples Near Agricultural Chemical Facilities in Maine

> Find PFAS sample points located near pesticide, fertilizer, and agricultural chemical manufacturing facilities (NAICS 3253) across the state of Maine.

**ID**: `samples-near-agchem-maine`

## Analysis Question

| Part | Configuration |
|------|--------------|
| **Block A** (target) | Samples in Maine (state FIPS: 23) |
| **Relationship** | Near (1 hop) |
| **Block C** (anchor) | Facilities — NAICS 3253 (Pesticide, Fertilizer, and Other Agricultural Chemical Manufacturing) |

## Pipeline Steps

| # | Step Type | Endpoint | Description |
|---|-----------|----------|-------------|
| 1 | `GET_S2_FOR_ANCHOR` | federation | Find S2 cells containing NAICS 3253 facilities in Maine |
| 2 | `EXPAND_S2_NEAR` | spatialkg | Expand to neighboring S2 cells (1 hop) |
| 3 | `FIND_TARGET_ENTITIES` | sawgraph | Find samples in the expanded area |
| 4 | `FILTER_ANCHOR_TO_NEARBY_TARGETS` | spatialkg | Keep only facilities near found samples |
| 5 | `GET_ANCHOR_DETAILS` | federation | Get facility details for map display |
| 6 | `GET_REGION_BOUNDARIES` | spatialkg | Load Maine county boundaries |

## SPARQL Queries

### Step 1: Find Facility S2 Cells

**Endpoint**: `federation`
**Template**: `buildFacilityS2Query(filters, "23")`

The region code `23` (Maine) is passed directly into the S2 query, so no separate region filter step is needed.

```sparql
SELECT DISTINCT ?s2cell WHERE {
  ?s2cell rdf:type kwg-ont:S2Cell_Level13 ;
          kwg-ont:sfContains ?facility .
  ?s2cell spatial:connectedTo kwgr:administrativeRegion.USA.23 .
  ?facility fio:ofIndustry ?industryGroup ;
            fio:ofIndustry ?industryCode .
  ?industryCode a naics:NAICS-IndustryCode ;
                fio:subcodeOf ?industryGroup ;
                rdfs:label ?industryName .
  VALUES ?industryGroup { naics:NAICS-3253 }
} GROUP BY ?s2cell
```

**Notes**:
- NAICS 3253 is a 4-digit code, so it's treated as a **grouping** (matched via `?industryGroup`)
- The region filter (`spatial:connectedTo ... USA.23`) is baked into this query
- No LIMIT since region + industry filters are present

### Step 2: Expand to Neighboring S2 Cells

**Endpoint**: `spatialkg`
**Template**: `buildNearExpansionQuery(s2ValuesString)`

```sparql
SELECT DISTINCT ?s2cell WHERE {
  VALUES ?s2neighbor { <s2cells from step 1> }
  ?s2neighbor kwg-ont:sfTouches | owl:sameAs ?s2cell .
  ?s2cell rdf:type kwg-ont:S2Cell_Level13 .
}
```

**Notes**:
- Expands the search area by finding all cells that touch the anchor cells
- `owl:sameAs` handles duplicate cell references
- Each S2 Level 13 cell is ~1.2 km^2, so 1 hop ~= 1-2 km radius

### Step 3: Find Samples in Expanded Area

**Endpoint**: `sawgraph`
**Template**: `buildSampleRetrievalQuery(s2ValuesString, undefined)`

No sample filters are applied (Block A has no `sampleFilters`), so all samples in the area are returned.

```sparql
SELECT
  (COUNT(DISTINCT ?subVal) as ?resultCount)
  (MAX(?result_value) as ?max)
  (GROUP_CONCAT(DISTINCT ?substance; separator="; ") as ?substances)
  (GROUP_CONCAT(DISTINCT ?matTypeLabel; separator="; ") as ?materials)
  ?sp ?spWKT ?s2cell
WHERE {
  ?sp rdf:type coso:SamplePoint ;
      spatial:connectedTo ?s2cell ;
      geo:hasGeometry/geo:asWKT ?spWKT .
  VALUES ?s2cell { <s2cells from step 2> }
  ?observation rdf:type coso:ContaminantObservation ;
      coso:observedAtSamplePoint ?sp ;
      coso:ofSubstance ?substance ;
      coso:analyzedSample ?sample ;
      coso:hasResult ?result .
  ?sample rdfs:label ?sampleLabel ;
      coso:sampleOfMaterialType ?matType .
  ?matType rdfs:label ?matTypeLabel .
  ?result coso:measurementValue ?result_value ;
      coso:measurementUnit ?unit .
  ?unit qudt:symbol ?unit_sym .
  BIND((CONCAT(str(?result_value), " ", ?unit_sym)) as ?subVal)
} GROUP BY ?sp ?spWKT ?s2cell
```

**Returns**: Sample points with WKT geometry, aggregated substance list, material types, max concentration, and result count.

### Step 4: Filter Anchors to Nearby Targets

**Endpoint**: `spatialkg`
**Template**: `buildAnchorFilterByTargetProximity(anchorS2Values, targetS2Values)`

```sparql
SELECT DISTINCT ?anchor WHERE {
  VALUES ?anchor { <facility s2cells from step 1> }
  VALUES ?target { <sample s2cells from step 3> }
  ?anchor kwg-ont:sfTouches | owl:sameAs ?target .
}
```

**Notes**:
- Reverse-filters: only keeps facility S2 cells that are adjacent to at least one sample S2 cell
- Prevents showing facilities with no nearby samples on the map

### Step 5: Get Facility Details

**Endpoint**: `federation`
**Template**: `buildFacilityDetailsQuery(filters, filteredAnchorS2Cells)`

```sparql
SELECT DISTINCT ?facility ?facWKT ?facilityName ?industryCode ?industryName ?s2cell WHERE {
  VALUES ?s2cell { <filtered facility s2cells from step 4> }
  ?s2cell kwg-ont:sfContains ?facility .
  ?facility fio:ofIndustry ?industryGroup ;
            fio:ofIndustry ?industryCode ;
            geo:hasGeometry/geo:asWKT ?facWKT ;
            rdfs:label ?facilityName .
  ?industryCode a naics:NAICS-IndustryCode ;
                fio:subcodeOf ?industryGroup ;
                rdfs:label ?industryName .
  VALUES ?industryGroup { naics:NAICS-3253 }
}
```

**Returns**: Facility URI, WKT geometry, name, and NAICS industry code/name.

### Step 6: Load Region Boundaries

**Endpoint**: `spatialkg`
**Template**: `buildRegionBoundaryQuery("23")`

```sparql
SELECT ?region ?regionName ?regionWKT WHERE {
  ?region kwg-ont:administrativePartOf kwgr:administrativeRegion.USA.23 ;
          rdfs:label ?regionName ;
          geo:hasGeometry/geo:asWKT ?regionWKT .
}
```

**Returns**: All counties in Maine with their names and boundary geometries.
