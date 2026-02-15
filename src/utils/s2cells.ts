const S2_CELL_PREFIX = 'http://stko-kwg.geog.ucsb.edu/lod/resource/';

export function shortenS2URI(uri: string): string {
  if (uri.startsWith(S2_CELL_PREFIX)) {
    return `kwgr:${uri.slice(S2_CELL_PREFIX.length)}`;
  }
  if (uri.startsWith('kwgr:')) {
    return uri;
  }
  return `<${uri}>`;
}

export function s2CellsToValuesString(cells: string[]): string {
  return cells.map(shortenS2URI).join(' ');
}
