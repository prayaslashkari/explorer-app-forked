# Samples Near Landfills & DOD Sites in Penobscot and Knox County

> Identify PFAS sample points near Solid Waste Landfills (NAICS 562212) and National Security / DOD facilities (NAICS 928110) in Penobscot and Knox counties, Maine.

**ID**: `samples-near-landfill-dod-penobscot-knox`

## Analysis Question

| Part | Configuration |
|------|--------------|
| **Block A** (target) | Samples in Maine (state FIPS: 23), counties: Penobscot (23019), Knox (23013) |
| **Relationship** | Near (1 hop) |
| **Block C** (anchor) | Facilities — NAICS 562212 (Solid Waste Landfill), 928110 (National Security) |

## Pipeline Steps

| # | Step Type | Endpoint | Description |
|---|-----------|----------|-------------|
| 1 | `GET_S2_FOR_ANCHOR` | federation | Find S2 cells containing landfill/DOD facilities in Penobscot county |
| 2 | `EXPAND_S2_NEAR` | spatialkg | Expand to neighboring S2 cells (1 hop) |
| 3 | `FILTER_S2_POST_SPATIAL` | spatialkg | Strict filter expanded cells to Penobscot county |
| 4 | `FIND_TARGET_ENTITIES` | sawgraph | Find samples in the expanded area |
| 5 | `FILTER_ANCHOR_TO_NEARBY_TARGETS` | spatialkg | Keep only facilities near found samples |
| 6 | `GET_ANCHOR_DETAILS` | federation | Get facility details for map display |
| 7 | `GET_REGION_BOUNDARIES` | spatialkg | Load Maine county boundaries |

**Note**: Block A has county codes `['23019', '23013']`. The planner uses `countyCodes[0]` (23019) as the region code. Block C has no region, so Block A's region code `23019` is used as `preExpandRegion` for Step 1. Block A's region triggers the strict filter in Step 3.

## SPARQL Queries

### Step 1: Find Facility S2 Cells

**Endpoint**: `federation`
**Template**: `buildFacilityS2Query(filters, "23019")`

Both NAICS codes (562212, 928110) are 6-digit codes, so they're treated as **specific codes** (matched via `?industryCode`).

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

Filters expanded cells to only those within Penobscot county. This prevents the 1-hop expansion from leaking into neighboring counties.

```sparql
SELECT DISTINCT ?s2cell WHERE {
  VALUES ?s2cell { <s2cells from step 2> }
  ?s2cell spatial:connectedTo kwgr:administrativeRegion.USA.23019 .
}
```

### Step 4: Find Samples in Target Area

**Endpoint**: `sawgraph`
**Template**: `buildSampleRetrievalQuery(s2ValuesString, undefined)`

No sample filters applied.

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
  VALUES ?s2cell { <s2cells from step 3> }
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

### Step 5: Filter Anchors to Nearby Targets

**Endpoint**: `spatialkg`
**Template**: `buildAnchorFilterByTargetProximity(anchorS2Values, targetS2Values)`

```sparql
SELECT DISTINCT ?anchor WHERE {
  VALUES ?anchor { <facility s2cells from step 1> }
  VALUES ?target { <sample s2cells from step 4> }
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

**Returns**: All counties in Maine with boundary geometries.
