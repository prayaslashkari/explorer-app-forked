import { PREFIXES } from '../../constants/prefixes';

export function buildDiscoverCountiesQuery(stateCode: string): string {
  return `
    ${PREFIXES}
    SELECT DISTINCT ?county ?countyName WHERE {
      ?county kwg-ont:administrativePartOf kwgr:administrativeRegion.USA.${stateCode} ;
              rdfs:label ?countyName .
    } ORDER BY ?countyName
  `;
}

export function buildDiscoverIndustriesQuery(): string {
  return `
    ${PREFIXES}
    SELECT DISTINCT ?code ?label ?groupCode ?groupLabel WHERE {
      ?industryCode a naics:NAICS-IndustryCode ;
          rdfs:label ?label ;
          fio:subcodeOf ?group .
      ?group rdfs:label ?groupLabel .
      BIND(REPLACE(STR(?industryCode), STR(naics:NAICS-), "") AS ?code)
      BIND(REPLACE(STR(?group), STR(naics:NAICS-), "") AS ?groupCode)
    } ORDER BY ?groupCode ?code
  `;
}

export function buildDiscoverSubstancesQuery(): string {
  return `
    ${PREFIXES}
    SELECT DISTINCT ?substance ?label WHERE {
      ?observation coso:ofSubstance ?substance .
      ?substance skos:altLabel ?label .
    } ORDER BY ?label
  `;
}

export function buildDiscoverMaterialTypesQuery(): string {
  return `
    ${PREFIXES}
    SELECT DISTINCT ?matType ?label WHERE {
      ?sample coso:sampleOfMaterialType ?matType .
      ?matType rdfs:label ?label .
    } ORDER BY ?label
  `;
}
