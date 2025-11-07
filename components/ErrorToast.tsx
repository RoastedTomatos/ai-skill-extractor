"use client";

type ErrorToastProps = {
  message: string;
  onDismiss?: () => void;
};

export function ErrorToast({ message, onDismiss }: ErrorToastProps) {
  return (
    <div className="flex items-start gap-3 rounded-md border border-red-500/40 bg-red-900/30 p-4 text-sm text-red-100 shadow-lg">
      <span className="mt-0.5 inline-flex h-2.5 w-2.5 flex-none rounded-full bg-red-400" aria-hidden />
      <div className="flex-1">
        <p className="font-medium">Something went wrong</p>
        <p className="mt-1 text-red-200/80">{message}</p>
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-md border border-red-500/40 px-2 py-1 text-xs font-semibold text-red-100 transition hover:bg-red-500/20"
        >
          Dismiss
        </button>
      ) : null}
    </div>
  );
}

