export function PageHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <header className="mb-7 animate-fade-in">
      <p className="mb-2 text-[10px] font-bold uppercase text-muted-foreground">{eyebrow}</p>
      <h1 className="font-display text-2xl font-semibold text-foreground md:text-3xl">{title}</h1>
      <p className="mt-2 max-w-2xl text-xs leading-5 text-muted-foreground">{description}</p>
    </header>
  );
}
