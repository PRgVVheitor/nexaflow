export function FieldError({ error }: { error?: string | { message?: string } }) {
  if (!error) return null;
  return (
    <p className="-mt-1 text-xs text-red-300">
      {typeof error === "string" ? error : error.message}
    </p>
  );
}
