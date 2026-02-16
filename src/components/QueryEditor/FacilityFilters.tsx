import Select from 'react-select';
import type { FacilityFilters as FacilityFiltersType } from '../../types/query';
import { useIndustries } from '../../hooks/useDiscoveryQueries';

interface FacilityFiltersProps {
  value?: FacilityFiltersType;
  onChange: (filters: FacilityFiltersType) => void;
}

export function FacilityFilters({ value, onChange }: FacilityFiltersProps) {
  const { data: industries = [] } = useIndustries();

  const industryOptions = industries.map((i) => ({
    value: i.code,
    label: i.code.length <= 4
      ? `${i.code} - ${i.label} (Group)`
      : `${i.code} - ${i.label}`,
  }));

  const selectedIndustries = industryOptions.filter((o) =>
    value?.industryCodes?.includes(o.value)
  );

  return (
    <div className="facility-filters">
      <div className="filter-field">
        <label>Industry (NAICS):</label>
        <Select
          options={industryOptions}
          value={selectedIndustries}
          onChange={(opts) => onChange({ ...value, industryCodes: opts.map((o) => o.value) })}
          isMulti
          placeholder="Any industry..."
          classNamePrefix="rs"
        />
      </div>
    </div>
  );
}
