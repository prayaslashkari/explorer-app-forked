import Select from 'react-select';
import type { SampleFilters as SampleFiltersType } from '../../types/query';
import { useSubstances, useMaterialTypes } from '../../hooks/useDiscoveryQueries';

interface SampleFiltersProps {
  value?: SampleFiltersType;
  onChange: (filters: SampleFiltersType) => void;
}

export function SampleFilters({ value, onChange }: SampleFiltersProps) {
  const { data: substances = [] } = useSubstances();
  const { data: materialTypes = [] } = useMaterialTypes();

  const substanceOptions = substances.map((s) => ({ value: s.uri, label: s.label }));
  const materialOptions = materialTypes.map((m) => ({ value: m.uri, label: m.label }));

  const selectedSubstances = substanceOptions.filter((o) => value?.substances?.includes(o.value));
  const selectedMaterials = materialOptions.filter((o) => value?.materialTypes?.includes(o.value));

  return (
    <div className="sample-filters">
      <div className="filter-field">
        <label>Substance:</label>
        <Select
          options={substanceOptions}
          value={selectedSubstances}
          onChange={(opts) => onChange({ ...value, substances: opts.map((o) => o.value) })}
          isMulti
          placeholder="Any substance..."
          classNamePrefix="rs"
        />
      </div>

      <div className="filter-field">
        <label>Material:</label>
        <Select
          options={materialOptions}
          value={selectedMaterials}
          onChange={(opts) => onChange({ ...value, materialTypes: opts.map((o) => o.value) })}
          isMulti
          placeholder="Any material type..."
          classNamePrefix="rs"
        />
      </div>

      <div className="filter-row">
        <div className="filter-field half">
          <label>Min (ng/L):</label>
          <input
            type="number"
            value={value?.minConcentration ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                minConcentration: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            placeholder="Min"
          />
        </div>
        <div className="filter-field half">
          <label>Max (ng/L):</label>
          <input
            type="number"
            value={value?.maxConcentration ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                maxConcentration: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            placeholder="Max"
          />
        </div>
      </div>
    </div>
  );
}
