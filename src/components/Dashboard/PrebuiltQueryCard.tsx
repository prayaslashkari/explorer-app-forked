import { useState } from 'react';
import type { PrebuiltQuery } from '../../constants/prebuiltQueries';

interface PrebuiltQueryCardProps {
  query: PrebuiltQuery;
  onClick: () => void;
}

const TAG_COLORS: Record<string, string> = {
  Samples: '#2b6cb0',
  Facilities: '#2f855a',
  'Water Bodies': '#2b6cb0',
  Near: '#805ad5',
  Downstream: '#d69e2e',
  Upstream: '#dd6b20',
};

function getTagColor(tag: string): string {
  for (const [key, color] of Object.entries(TAG_COLORS)) {
    if (tag.includes(key)) return color;
  }
  return '#718096';
}

const MAX_VISIBLE_TAGS = 3;

export function PrebuiltQueryCard({ query, onClick }: PrebuiltQueryCardProps) {
  const [expanded, setExpanded] = useState(false);

  const visibleTags = query.tags.slice(0, MAX_VISIBLE_TAGS);
  const hiddenCount = query.tags.length - MAX_VISIBLE_TAGS;

  return (
    <div className="query-card" onClick={onClick}>
      <h3 className="query-card-title">{query.title}</h3>

      <button
        className="query-card-toggle"
        onClick={(e) => {
          e.stopPropagation();
          setExpanded(!expanded);
        }}
      >
        See More Details {expanded ? '\u25B4' : '\u25BE'}
      </button>

      {expanded && <p className="query-card-desc">{query.description}</p>}

      <div className="query-card-tags">
        {visibleTags.map((tag) => (
          <span
            key={tag}
            className="query-tag"
            style={{ color: getTagColor(tag) }}
          >
            {tag}
          </span>
        ))}
        {hiddenCount > 0 && (
          <span className="query-tag query-tag-more">+{hiddenCount}</span>
        )}
      </div>
    </div>
  );
}
