import type { WellFilters as WellFiltersType } from '../../types/query';
import { FlatSelect } from './FlatSelect/FlatSelect';

interface WellFiltersProps {
  value?: WellFiltersType;
  onChange: (filters: WellFiltersType) => void;
}

const WELL_TYPE_OPTIONS = [
  { value: 'ISGS-Well', label: 'Illinois Wells (ISGS)' },
  { value: 'MGS-Well', label: 'Maine Wells (MGS)' },
];

export function WellFilters({ value, onChange }: WellFiltersProps) {
  return (
    <div className="well-filters">
      <div className="filter-field">
        <label>Well Source:</label>
        <FlatSelect
          options={WELL_TYPE_OPTIONS}
          selectedValues={value?.wellTypes ?? []}
          onChange={(vals) => onChange({ ...value, wellTypes: vals })}
          placeholder="All wells..."
        />
      </div>
    </div>
  );
}
