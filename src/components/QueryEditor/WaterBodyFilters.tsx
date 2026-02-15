import Select from 'react-select';
import type { WaterBodyFilters as WaterBodyFiltersType } from '../../types/query';

interface WaterBodyFiltersProps {
  value?: WaterBodyFiltersType;
  onChange: (filters: WaterBodyFiltersType) => void;
}

const FTYPE_OPTIONS = [
  { value: 'StreamRiver', label: 'Stream / River' },
  { value: 'LakePond', label: 'Lake / Pond' },
  { value: 'Reservoir', label: 'Reservoir' },
  { value: 'Swamp', label: 'Swamp / Marsh' },
  { value: 'Estuary', label: 'Estuary' },
];

export function WaterBodyFilters({ value, onChange }: WaterBodyFiltersProps) {
  const selectedFtypes = FTYPE_OPTIONS.filter((o) => value?.ftypes?.includes(o.value));

  return (
    <div className="waterbody-filters">
      <div className="filter-field">
        <label>Water Type:</label>
        <Select
          options={FTYPE_OPTIONS}
          value={selectedFtypes}
          onChange={(opts) => onChange({ ...value, ftypes: opts.map((o) => o.value) })}
          isMulti
          placeholder="Any water type..."
          classNamePrefix="rs"
        />
      </div>
    </div>
  );
}
