import { airportCount } from "@/lib/airports";
import { mockItineraryCount } from "@/lib/mock/itineraries";
import { getSchengenCountryCodes } from "@/lib/schengen";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">
        FlightScore
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        Foundation skeleton
      </h1>
      <p className="mt-4 text-neutral-600">
        The application is running. Search, scoring, and provider integration
        will be added in later phases.
      </p>
      <dl className="mt-8 space-y-3 border-t border-neutral-200 pt-6 text-sm text-neutral-700">
        <div className="flex justify-between gap-4">
          <dt>Airports loaded</dt>
          <dd className="font-medium text-neutral-900">{airportCount}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Mock itineraries</dt>
          <dd className="font-medium text-neutral-900">{mockItineraryCount}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Schengen country codes</dt>
          <dd className="font-medium text-neutral-900">
            {getSchengenCountryCodes().length}
          </dd>
        </div>
      </dl>
    </main>
  );
}
