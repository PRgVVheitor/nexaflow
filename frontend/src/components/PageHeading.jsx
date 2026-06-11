export function PageHeading({ description, eyebrow, title }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase text-emerald-300">{eyebrow}</p>
      <h1 className="text-3xl font-bold text-zinc-50 sm:text-4xl">{title}</h1>
      <p className="max-w-3xl text-sm leading-6 text-zinc-400">{description}</p>
    </div>
  );
}
