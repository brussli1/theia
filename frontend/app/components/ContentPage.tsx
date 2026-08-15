/** Shared shell for the static content pages (#17): consistent heading,
 *  intro and column width. Server component. */
export default function ContentPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
      {intro && <p className="mt-2 text-sm text-slate-500">{intro}</p>}
      <div className="mt-6">{children}</div>
    </main>
  );
}
