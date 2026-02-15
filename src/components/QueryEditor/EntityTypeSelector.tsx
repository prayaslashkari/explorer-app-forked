import type { EntityType } from '../../types/query';

interface EntityTypeSelectorProps {
  value: EntityType;
  onChange: (type: EntityType) => void;
}

const ENTITY_TYPES: { value: EntityType; label: string }[] = [
  { value: 'samples', label: 'Samples' },
  { value: 'facilities', label: 'Facilities' },
  { value: 'waterBodies', label: 'Water Bodies' },
];

export function EntityTypeSelector({ value, onChange }: EntityTypeSelectorProps) {
  return (
    <div className="entity-type-selector">
      <label>Type:</label>
      <select value={value} onChange={(e) => onChange(e.target.value as EntityType)}>
        {ENTITY_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
    </div>
  );
}
