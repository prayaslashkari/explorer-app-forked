import Select from 'react-select';
import type { RegionFilter } from '../../types/query';
import { US_STATES } from '../../constants/regions';
import { useCounties } from '../../hooks/useDiscoveryQueries';

interface RegionSelectorProps {
  value?: RegionFilter;
  onChange: (region: RegionFilter) => void;
}

export function RegionSelector({ value, onChange }: RegionSelectorProps) {
  const { data: counties = [], isLoading: countiesLoading } = useCounties(value?.stateCode);

  const stateOptions = US_STATES.map((s) => ({
    value: s.fips,
    label: `${s.name} (${s.abbreviation})`,
  }));

  const countyOptions = counties.map((c) => ({
    value: c.code,
    label: c.name,
  }));

  const selectedState = stateOptions.find((o) => o.value === value?.stateCode) || null;
  const selectedCounties = countyOptions.filter((o) => value?.countyCodes?.includes(o.value));

  return (
    <div className="region-selector">
      <div className="region-field">
        <label>State:</label>
        <Select
          options={stateOptions}
          value={selectedState}
          onChange={(opt) =>
            onChange({
              ...value,
              stateCode: opt?.value,
              countyCodes: undefined,
            })
          }
          isClearable
          placeholder="Select state..."
          classNamePrefix="rs"
        />
      </div>

      {value?.stateCode && (
        <div className="region-field">
          <label>County:</label>
          <Select
            options={countyOptions}
            value={selectedCounties}
            onChange={(opts) =>
              onChange({
                ...value,
                countyCodes: opts.map((o) => o.value),
              })
            }
            isMulti
            isLoading={countiesLoading}
            placeholder="All counties..."
            classNamePrefix="rs"
          />
        </div>
      )}
    </div>
  );
}
