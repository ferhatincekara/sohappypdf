export function StarMark({ className = "size-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2.2c.4 0 .72.24.86.6l1.58 4.12c.1.26.32.47.58.56l4.28 1.18c.7.2 1 1.08.5 1.62l-3.2 3.08c-.2.2-.3.48-.26.76l.86 4.36c.14.72-.62 1.28-1.26.92L12.7 17.8a.9.9 0 0 0-.8 0l-3.82 2.2c-.64.36-1.4-.2-1.26-.92l.86-4.36c.04-.28-.06-.56-.26-.76l-3.2-3.08c-.5-.54-.2-1.42.5-1.62l4.28-1.18c.26-.09.48-.3.58-.56L11.14 2.8A.92.92 0 0 1 12 2.2Z" />
    </svg>
  );
}
