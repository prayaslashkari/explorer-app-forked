import type { SparqlRow } from '../types/sparql';
import type { MapFeature } from '../types/map';
import type { LatLngExpression } from 'leaflet';

function parseWKTPoint(wkt: string): LatLngExpression | null {
  const match = wkt.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
  if (!match) return null;
  const lon = parseFloat(match[1]);
  const lat = parseFloat(match[2]);
  return [lat, lon];
}

function parseWKTLineString(wkt: string): LatLngExpression[] | null {
  const match = wkt.match(/LINESTRING\s*\((.+)\)/i);
  if (!match) return null;
  return match[1].split(',').map((pair) => {
    const [lon, lat] = pair.trim().split(/\s+/).map(Number);
    return [lat, lon] as LatLngExpression;
  });
}

function parseWKTPolygon(wkt: string): LatLngExpression[][] | null {
  const match = wkt.match(/POLYGON\s*\(\((.+)\)\)/i);
  if (!match) return null;
  const rings = match[1].split('),(').map((ring) =>
    ring.split(',').map((pair) => {
      const [lon, lat] = pair.trim().split(/\s+/).map(Number);
      return [lat, lon] as LatLngExpression;
    })
  );
  return rings;
}

function nonNull<T>(val: T | null | undefined): val is T {
  return val != null;
}

export function transformSamplesToFeatures(rows: SparqlRow[]): MapFeature[] {
  return rows
    .filter((r) => r.spWKT)
    .map((row): MapFeature | null => {
      const coords = parseWKTPoint(row.spWKT);
      if (!coords) return null;
      return {
        id: row.sp,
        geometry: { type: 'Point', coordinates: coords },
        properties: {
          type: 'sample',
          resultCount: row.resultCount || '0',
          maxConcentration: row.max || '',
          substances: row.substances || '',
          materials: row.materials || '',
        },
      };
    })
    .filter(nonNull);
}

export function transformFacilitiesToFeatures(rows: SparqlRow[]): MapFeature[] {
  return rows
    .filter((r) => r.facWKT)
    .map((row): MapFeature | null => {
      const coords = parseWKTPoint(row.facWKT);
      if (!coords) return null;
      return {
        id: row.facility,
        geometry: { type: 'Point', coordinates: coords },
        properties: {
          type: 'facility',
          name: row.facilityName || '',
          industryCode: row.industryCode || '',
          industryName: row.industryName || '',
        },
      };
    })
    .filter(nonNull);
}

export function transformWaterBodiesToFeatures(rows: SparqlRow[]): MapFeature[] {
  return rows
    .filter((r) => r.wbWKT)
    .map((row): MapFeature | null => {
      const wkt = row.wbWKT;
      let geometry: MapFeature['geometry'];

      const pointCoords = parseWKTPoint(wkt);
      if (pointCoords) {
        geometry = { type: 'Point', coordinates: pointCoords };
      } else {
        const lineCoords = parseWKTLineString(wkt);
        if (lineCoords) {
          geometry = { type: 'LineString', coordinates: lineCoords };
        } else {
          const polyCoords = parseWKTPolygon(wkt);
          if (polyCoords) {
            geometry = { type: 'Polygon', coordinates: polyCoords };
          } else {
            return null;
          }
        }
      }

      return {
        id: row.waterBody,
        geometry,
        properties: {
          type: 'waterBody',
          name: row.wbName || 'Unknown Water Body',
        },
      };
    })
    .filter(nonNull);
}

export function transformRegionBoundaries(rows: SparqlRow[]): MapFeature[] {
  return rows
    .filter((r) => r.regionWKT)
    .map((row): MapFeature | null => {
      const wkt = row.regionWKT;
      const polyCoords = parseWKTPolygon(wkt);
      if (!polyCoords) return null;

      return {
        id: row.region,
        geometry: { type: 'Polygon', coordinates: polyCoords },
        properties: {
          type: 'regionBoundary',
          name: row.regionName || '',
        },
      };
    })
    .filter(nonNull);
}
