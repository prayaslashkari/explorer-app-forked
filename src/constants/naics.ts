export interface NaicsIndustry {
  code: string;
  label: string;
  groupCode?: string;
  groupLabel?: string;
}

// Fallback NAICS codes if discovery query fails
export const FALLBACK_NAICS: NaicsIndustry[] = [
  { code: '3253', label: 'Pesticide, Fertilizer, and Other Agricultural Chemical Manufacturing', groupCode: '3253', groupLabel: 'Agricultural Chemical Manufacturing' },
  { code: '5622', label: 'Waste Treatment and Disposal', groupCode: '5622', groupLabel: 'Waste Treatment and Disposal' },
  { code: '562212', label: 'Solid Waste Landfill', groupCode: '5622', groupLabel: 'Waste Treatment and Disposal' },
  { code: '562211', label: 'Hazardous Waste Treatment and Disposal', groupCode: '5622', groupLabel: 'Waste Treatment and Disposal' },
  { code: '928110', label: 'National Security', groupCode: '9281', groupLabel: 'National Security and International Affairs' },
  { code: '332812', label: 'Metal Coating, Engraving, and Allied Services to Manufacturers', groupCode: '3328', groupLabel: 'Coating, Engraving, Heat Treating, and Allied Activities' },
  { code: '322121', label: 'Paper (except Newsprint) Mills', groupCode: '3221', groupLabel: 'Pulp, Paper, and Paperboard Mills' },
  { code: '424690', label: 'Other Chemical and Allied Products Merchant Wholesalers', groupCode: '4246', groupLabel: 'Chemical and Allied Products Merchant Wholesalers' },
];
