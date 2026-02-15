import { PREFIXES } from '../../constants/prefixes';
import type { WaterBodyFilters } from '../../types/query';

export function buildWaterBodyS2Query(filters?: WaterBodyFilters): string {
  let filterClauses = '';
  if (filters?.ftypes?.length) {
    const ftypeValues = filters.ftypes.map(f => `"${f}"`).join(' ');
    filterClauses += `VALUES ?ftype { ${ftypeValues} }\n      `;
  }

  return `
    ${PREFIXES}
    SELECT DISTINCT ?s2cell WHERE {
      ?s2cell rdf:type kwg-ont:S2Cell_Level13 ;
              kwg-ont:sfContains ?waterBody .
      ?waterBody rdf:type hyf:HY_HydroFeature .
      ${filterClauses}
    } GROUP BY ?s2cell
  `;
}

export function buildWaterBodyRetrievalQuery(
  s2ValuesString: string,
  filters?: WaterBodyFilters
): string {
  let filterClauses = '';
  if (filters?.ftypes?.length) {
    const ftypeValues = filters.ftypes.map(f => `"${f}"`).join(' ');
    filterClauses += `VALUES ?ftype { ${ftypeValues} }\n      `;
  }

  return `
    ${PREFIXES}
    SELECT DISTINCT ?waterBody ?wbWKT ?wbName WHERE {
      VALUES ?s2cell { ${s2ValuesString} }
      ?s2cell kwg-ont:sfContains ?waterBody .
      ?waterBody rdf:type hyf:HY_HydroFeature ;
                 geo:hasGeometry/geo:asWKT ?wbWKT .
      OPTIONAL { ?waterBody rdfs:label ?wbName . }
      ${filterClauses}
    }
  `;
}
