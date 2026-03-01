import type { RegionFilter } from '../../types/query';
import { ALL_US_STATES, AVAILABLE_STATE_FIPS } from '../../constants/regions';
import { useCounties } from '../../hooks/useDiscoveryQueries';
import { FlatSelect } from './FlatSelect/FlatSelect';

interface RegionSelectorProps {
  value?: RegionFilter;
  onChange: (region: RegionFilter) => void;
}

export function RegionSelector({ value, onChange }: RegionSelectorProps) {
  const { data: counties = [], isLoading: countiesLoading } = useCounties(value?.stateCode);

  const stateOptions = ALL_US_STATES.map((s) => ({
    value: s.fips,
    label: `${s.name} (${s.abbreviation})`,
    disabled: !AVAILABLE_STATE_FIPS.has(s.fips),
  }));

  const countyOptions = counties.map((c) => ({
    value: c.code,
    label: c.name,
  }));

  return (
    <div className="region-selector">
      <div className="region-field">
        <label>State:</label>
        <FlatSelect
          options={stateOptions}
          selectedValues={value?.stateCode ? [value.stateCode] : []}
          onChange={(vals) =>
            onChange({
              ...value,
              stateCode: vals[0],
              countyCodes: undefined,
            })
          }
          isMulti={false}
          placeholder="Select state..."
        />
      </div>

      {value?.stateCode && (
        <div className="region-field">
          <label>County:</label>
          <FlatSelect
            options={countyOptions}
            selectedValues={value?.countyCodes ?? []}
            onChange={(vals) =>
              onChange({
                ...value,
                countyCodes: vals,
              })
            }
            isMulti={true}
            isLoading={countiesLoading}
            placeholder="All counties..."
          />
        </div>
      )}
    </div>
  );
}
