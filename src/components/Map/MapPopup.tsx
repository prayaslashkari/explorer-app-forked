import type { MapFeature } from '../../types/map';

interface MapPopupProps {
  feature: MapFeature;
}

export function MapPopupContent({ feature }: MapPopupProps) {
  const props = feature.properties;

  if (props.type === 'sample') {
    return (
      <div className="map-popup">
        <strong>Sample Point</strong>
        <div>Results: {props.resultCount}</div>
        {props.maxConcentration && <div>Max: {props.maxConcentration}</div>}
        {props.substances && <div>Substances: {String(props.substances).split('; ').slice(0, 3).join(', ')}</div>}
        {props.materials && <div>Materials: {props.materials}</div>}
      </div>
    );
  }

  if (props.type === 'facility') {
    return (
      <div className="map-popup">
        <strong>{props.name || 'Facility'}</strong>
        {props.industryName && <div>Industry: {props.industryName}</div>}
        {props.industryCode && <div>NAICS: {String(props.industryCode).split('/').pop()}</div>}
      </div>
    );
  }

  if (props.type === 'waterBody') {
    return (
      <div className="map-popup">
        <strong>{props.name || 'Surface Water Body'}</strong>
      </div>
    );
  }

  if (props.type === 'well') {
    return (
      <div className="map-popup">
        <strong>{props.name || 'Well'}</strong>
      </div>
    );
  }

  if (props.type === 'regionBoundary') {
    return (
      <div className="map-popup">
        <strong>{props.name || 'Region'}</strong>
      </div>
    );
  }

  return null;
}
