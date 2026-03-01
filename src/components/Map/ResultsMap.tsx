import { MapContainer, TileLayer, LayersControl } from 'react-leaflet';
import type { MapLayerData } from '../../hooks/useMapLayers';
import { SampleLayer } from './SampleLayer';
import { FacilityLayer } from './FacilityLayer';
import { WaterBodyLayer } from './WaterBodyLayer';
import { RegionBoundaryLayer } from './RegionBoundaryLayer';
import { MapCenterController } from './MapCenterController';
import 'leaflet/dist/leaflet.css';

interface ResultsMapProps {
  layers: MapLayerData;
}

export function ResultsMap({ layers }: ResultsMapProps) {
  const hasData =
    layers.samples.length > 0 ||
    layers.facilities.length > 0 ||
    layers.waterBodies.length > 0;

  return (
    <MapContainer
      center={[44.0, -69.0]}
      zoom={7}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Auto-center controller - renders nothing, just manages map view */}
      <MapCenterController layers={layers} />

      {hasData && (
        <LayersControl position="topright">
          {layers.samples.length > 0 && (
            <LayersControl.Overlay checked name={`Samples (${layers.samples.length})`}>
              <SampleLayer features={layers.samples} />
            </LayersControl.Overlay>
          )}

          {layers.facilities.length > 0 && (
            <LayersControl.Overlay checked name={`Facilities (${layers.facilities.length})`}>
              <FacilityLayer features={layers.facilities} />
            </LayersControl.Overlay>
          )}

          {layers.waterBodies.length > 0 && (
            <LayersControl.Overlay checked name={`Water Bodies (${layers.waterBodies.length})`}>
              <WaterBodyLayer features={layers.waterBodies} />
            </LayersControl.Overlay>
          )}

          {layers.regionBoundaries.length > 0 && (
            <LayersControl.Overlay checked name="Region Boundaries">
              <RegionBoundaryLayer features={layers.regionBoundaries} />
            </LayersControl.Overlay>
          )}
        </LayersControl>
      )}

      {!hasData && layers.regionBoundaries.length > 0 && (
        <RegionBoundaryLayer features={layers.regionBoundaries} />
      )}
    </MapContainer>
  );
}
