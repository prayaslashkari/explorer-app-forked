import { CircleMarker, LayerGroup, Popup } from 'react-leaflet';
import type { MapFeature } from '../../types/map';
import type { LatLngExpression } from 'leaflet';
import { MapPopupContent } from './MapPopup';

interface WellLayerProps {
  features: MapFeature[];
}

export function WellLayer({ features }: WellLayerProps) {
  return (
    <LayerGroup>
      {features.map((f) => {
        if (f.geometry.type !== 'Point') return null;
        return (
          <CircleMarker
            key={f.id}
            center={f.geometry.coordinates as LatLngExpression}
            radius={4}
            pathOptions={{ color: '#8B4513', fillColor: '#A0522D', fillOpacity: 0.7, weight: 1 }}
          >
            <Popup>
              <MapPopupContent feature={f} />
            </Popup>
          </CircleMarker>
        );
      })}
    </LayerGroup>
  );
}
