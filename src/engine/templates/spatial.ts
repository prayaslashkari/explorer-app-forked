import { PREFIXES } from '../../constants/prefixes';

export function buildRegionFilterQuery(
  s2ValuesString: string,
  regionCode: string
): string {
  return `
    ${PREFIXES}
    SELECT ?s2cell WHERE {
      ?s2neighbor spatial:connectedTo kwgr:administrativeRegion.USA.${regionCode} .
      VALUES ?s2neighbor { ${s2ValuesString} }
      ?s2neighbor kwg-ont:sfTouches | owl:sameAs ?s2cell .
    }
  `;
}

export function buildStrictRegionFilterQuery(
  s2ValuesString: string,
  regionCode: string
): string {
  return `
    ${PREFIXES}
    SELECT DISTINCT ?s2cell WHERE {
      VALUES ?s2cell { ${s2ValuesString} }
      ?s2cell spatial:connectedTo kwgr:administrativeRegion.USA.${regionCode} .
    }
  `;
}

export function buildNearExpansionQuery(s2ValuesString: string): string {
  return `
    ${PREFIXES}
    SELECT DISTINCT ?s2cell WHERE {
      VALUES ?s2neighbor { ${s2ValuesString} }
      ?s2neighbor kwg-ont:sfTouches | owl:sameAs ?s2cell .
      ?s2cell rdf:type kwg-ont:S2Cell_Level13 .
    }
  `;
}

export function buildRegionBoundaryQuery(regionCode: string): string {
  return `
    ${PREFIXES}
    SELECT ?region ?regionName ?regionWKT WHERE {
      ?region kwg-ont:administrativePartOf kwgr:administrativeRegion.USA.${regionCode} ;
              rdfs:label ?regionName ;
              geo:hasGeometry/geo:asWKT ?regionWKT .
    }
  `;
}
