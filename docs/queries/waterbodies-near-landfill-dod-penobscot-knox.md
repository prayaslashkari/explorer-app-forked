# Water Bodies Near Landfills & DOD Sites in Penobscot and Knox County

> Locate water bodies (streams, rivers, lakes) near Solid Waste Landfills (NAICS 562212) and National Security / DOD facilities (NAICS 928110) in Penobscot and Knox counties, Maine.

**ID**: `waterbodies-near-landfill-dod-penobscot-knox`

## Analysis Question

| Part | Configuration |
|------|--------------|
| **Block A** (target) | Water Bodies in Maine (state FIPS: 23), counties: Penobscot (23019), Knox (23013) |
| **Relationship** | Near (1 hop) |
| **Block C** (anchor) | Facilities — NAICS 562212 (Solid Waste Landfill), 928110 (National Security) |

## Pipeline Steps

| # | Step Type | Endpoint | Description |
|---|-----------|----------|-------------|
| 1 | `GET_S2_FOR_ANCHOR` | federation | Find S2 cells containing landfill/DOD facilities in Penobscot county |
| 2 | `EXPAND_S2_NEAR` | spatialkg | Expand to neighboring S2 cells (1 hop) |
| 3 | `FILTER_S2_POST_SPATIAL` | spatialkg | Strict filter expanded cells to Penobscot county |
| 4 | `FIND_TARGET_ENTITIES` | hydrologykg | Find water bodies in the expanded area |
| 5 | `FILTER_ANCHOR_TO_NEARBY_TARGETS` | spatialkg | Keep only facilities near found water bodies |
| 6 | `GET_ANCHOR_DETAILS` | federation | Get facility details for map display |
| 7 | `GET_REGION_BOUNDARIES` | spatialkg | Load Maine county boundaries |

**Note**: Same structure as samples-near-landfill-dod, but Step 4 queries `hydrologykg` for water bodies instead of `sawgraph` for samples.

## SPARQL Queries

### Step 1: Find Facility S2 Cells

**Endpoint**: `federation`
**Template**: `buildFacilityS2Query(filters, "23019")`

```sparql
SELECT DISTINCT ?s2cell WHERE {
  ?s2cell rdf:type kwg-ont:S2Cell_Level13 ;
          kwg-ont:sfContains ?facility .
  ?s2cell spatial:connectedTo kwgr:administrativeRegion.USA.23019 .
  ?facility fio:ofIndustry ?industryGroup ;
            fio:ofIndustry ?industryCode .
  ?industryCode a naics:NAICS-IndustryCode ;
                fio:subcodeOf ?industryGroup ;
                rdfs:label ?industryName .
  VALUES ?industryCode { naics:NAICS-562212 naics:NAICS-928110 }
} GROUP BY ?s2cell
```

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

### Step 3: Strict Region Filter

**Endpoint**: `spatialkg`
**Template**: `buildStrictRegionFilterQuery(s2ValuesString, "23019")`

```sparql
SELECT DISTINCT ?s2cell WHERE {
  VALUES ?s2cell { <s2cells from step 2> }
  ?s2cell spatial:connectedTo kwgr:administrativeRegion.USA.23019 .
}
```

### Step 4: Find Water Bodies in Target Area

**Endpoint**: `hydrologykg`
**Template**: `buildWaterBodyRetrievalQuery(s2ValuesString, undefined)`

No water body filters applied (Block A has no `waterBodyFilters`).

```sparql
SELECT DISTINCT ?waterBody ?wbWKT ?wbName ?s2cell WHERE {
  VALUES ?s2cell { <s2cells from step 3> }
  ?s2cell spatial:connectedTo ?waterBody .
  ?waterBody rdf:type hyf:HY_WaterBody ;
             geo:hasGeometry/geo:asWKT ?wbWKT .
  OPTIONAL { ?waterBody schema:name ?wbName . }
}
```

**Returns**: Water body URI, WKT geometry, optional name, and associated S2 cell.

### Step 5: Filter Anchors to Nearby Targets

**Endpoint**: `spatialkg`
**Template**: `buildAnchorFilterByTargetProximity(anchorS2Values, targetS2Values)`

```sparql
SELECT DISTINCT ?anchor WHERE {
  VALUES ?anchor { <facility s2cells from step 1> }
  VALUES ?target { <water body s2cells from step 4> }
  ?anchor kwg-ont:sfTouches | owl:sameAs ?target .
}
```

### Step 6: Get Facility Details

**Endpoint**: `federation`
**Template**: `buildFacilityDetailsQuery(filters, filteredAnchorS2Cells)`

```sparql
SELECT DISTINCT ?facility ?facWKT ?facilityName ?industryCode ?industryName ?s2cell WHERE {
  VALUES ?s2cell { <filtered facility s2cells from step 5> }
  ?s2cell kwg-ont:sfContains ?facility .
  ?facility fio:ofIndustry ?industryGroup ;
            fio:ofIndustry ?industryCode ;
            geo:hasGeometry/geo:asWKT ?facWKT ;
            rdfs:label ?facilityName .
  ?industryCode a naics:NAICS-IndustryCode ;
                fio:subcodeOf ?industryGroup ;
                rdfs:label ?industryName .
  VALUES ?industryCode { naics:NAICS-562212 naics:NAICS-928110 }
}
```

### Step 7: Load Region Boundaries

**Endpoint**: `spatialkg`
**Template**: `buildRegionBoundaryQuery("23")`

```sparql
SELECT ?region ?regionName ?regionWKT WHERE {
  ?region kwg-ont:administrativePartOf kwgr:administrativeRegion.USA.23 ;
          rdfs:label ?regionName ;
          geo:hasGeometry/geo:asWKT ?regionWKT .
}
```
