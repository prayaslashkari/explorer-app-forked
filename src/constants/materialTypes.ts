export interface MaterialType {
  uri: string;
  label: string;
}

// Fallback material types if discovery query fails
export const FALLBACK_MATERIAL_TYPES: MaterialType[] = [
  { uri: 'me_egad_data:sampleMaterialType.GW', label: 'Groundwater (GW)' },
  { uri: 'me_egad_data:sampleMaterialType.DW', label: 'Drinking Water (DW)' },
  { uri: 'me_egad_data:sampleMaterialType.SW', label: 'Surface Water (SW)' },
  { uri: 'me_egad_data:sampleMaterialType.SO', label: 'Soil (SO)' },
  { uri: 'me_egad_data:sampleMaterialType.SL', label: 'Sludge (SL)' },
  { uri: 'me_egad_data:sampleMaterialType.LE', label: 'Leachate (LE)' },
];
