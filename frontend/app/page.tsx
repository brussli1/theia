import { getBackendHealth, type BackendHealth } from "./lib/health";

function HealthRow({ label, value }: { label: string; value: string }) {
  const color =
    value === "ok" ? "text-emerald-600" : value === "degraded" ? "text-amber-600" : "text-red-600";
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className={`font-medium ${color}`}>{value}</dd>
    </div>
  );
}

export default async function Home() {
  const health: BackendHealth = await getBackendHealth();

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-8">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Theia</h1>
        <p className="mt-1 text-sm text-slate-500">
          Storefront platform for ophthalmological equipment
        </p>
        <dl className="mt-6 space-y-3 text-sm">
          <HealthRow label="Backend" value={health.status} />
          <HealthRow label="Database" value={health.database} />
        </dl>
      </div>
    </main>
  );
}
