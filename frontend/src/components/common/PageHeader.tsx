export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-8">
      {eyebrow && (
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.22em] text-[#66FCF1]/80">
          {eyebrow}
        </p>
      )}
      <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
        {title}
      </h1>
      {description && (
        <p className="mt-3 max-w-3xl text-base leading-7 text-[#C5C6C7]/65">
          {description}
        </p>
      )}
    </div>
  );
}
