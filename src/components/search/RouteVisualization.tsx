import type { Segment } from "@/lib/types/search";

interface RouteVisualizationProps {
  segments: Segment[];
  className?: string;
}

function getAirportChain(segments: Segment[]): string[] {
  if (segments.length === 0) {
    return [];
  }

  const airports = [segments[0].from];

  for (const segment of segments) {
    airports.push(segment.to);
  }

  return airports;
}

export function RouteVisualization({
  segments,
  className = "",
}: RouteVisualizationProps) {
  const airports = getAirportChain(segments);

  if (airports.length < 2) {
    return null;
  }

  const isDirect = airports.length === 2;

  return (
    <div className={`fs-route-line flex flex-wrap items-center gap-1.5 ${className}`}>
      {airports.map((airport, index) => (
        <span key={`${airport}-${index}`} className="inline-flex items-center gap-1.5">
          <span className="font-semibold text-neutral-800">{airport}</span>
          {index < airports.length - 1 ? (
            isDirect ? (
              <span
                aria-hidden="true"
                className="inline-block w-8 border-t border-dashed border-neutral-300"
              />
            ) : (
              <span aria-hidden="true" className="inline-flex items-center gap-1">
                <span className="fs-route-dot" />
                <span className="inline-block w-4 border-t border-neutral-300" />
                <span className="fs-route-dot" />
              </span>
            )
          ) : null}
        </span>
      ))}
    </div>
  );
}
