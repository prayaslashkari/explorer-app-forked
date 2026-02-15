export interface Substance {
  uri: string;
  label: string;
}

// Fallback substances if discovery query fails
export const FALLBACK_SUBSTANCES: Substance[] = [
  { uri: 'me_egad:parameter.PFOS_A', label: 'PFOS' },
  { uri: 'me_egad:parameter.PFOA_A', label: 'PFOA' },
  { uri: 'me_egad:parameter.PFHPA_A', label: 'PFHpA' },
  { uri: 'me_egad:parameter.PFHXS_A', label: 'PFHxS' },
  { uri: 'me_egad:parameter.PFNA_A', label: 'PFNA' },
  { uri: 'me_egad:parameter.PFDA_A', label: 'PFDA' },
  { uri: 'me_egad:parameter.PFBS_A', label: 'PFBS' },
];
