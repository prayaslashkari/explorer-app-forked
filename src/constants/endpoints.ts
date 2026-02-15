export const ENDPOINTS = {
  sawgraph: 'https://frink.apps.renci.org/sawgraph/sparql',
  fiokg: 'https://frink.apps.renci.org/fiokg/sparql',
  spatialkg: 'https://frink.apps.renci.org/spatialkg/sparql',
  hydrologykg: 'https://frink.apps.renci.org/hydrologykg/sparql',
  federation: 'https://frink.apps.renci.org/federation/sparql',
} as const;

export type EndpointKey = keyof typeof ENDPOINTS;
