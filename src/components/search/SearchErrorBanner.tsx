interface SearchErrorBannerProps {
  message: string;
}

export function SearchErrorBanner({ message }: SearchErrorBannerProps) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-rose-200/80 bg-rose-50 px-4 py-3 text-sm text-rose-900"
    >
      {message}
    </div>
  );
}
