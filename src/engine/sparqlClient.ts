import { ENDPOINTS, type EndpointKey } from '../constants/endpoints';
import type { SparqlResultSet, SparqlRow } from '../types/sparql';

export async function executeSparql(
  endpoint: EndpointKey,
  query: string
): Promise<SparqlRow[]> {
  const url = ENDPOINTS[endpoint];

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sparql-query',
      'Accept': 'application/sparql-results+json',
    },
    body: query,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`SPARQL error ${response.status}: ${text.slice(0, 200)}`);
  }

  const json: SparqlResultSet = await response.json();
  return transformSparqlResults(json);
}

function transformSparqlResults(json: SparqlResultSet): SparqlRow[] {
  return json.results.bindings.map((binding) => {
    const row: SparqlRow = {};
    for (const key of Object.keys(binding)) {
      row[key] = binding[key].value;
    }
    return row;
  });
}
