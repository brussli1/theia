export type BackendHealth = {
  status: "ok" | "degraded" | "unavailable";
  database: "ok" | "unavailable";
};

const UNAVAILABLE: BackendHealth = { status: "unavailable", database: "unavailable" };

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

export async function getBackendHealth(): Promise<BackendHealth> {
  try {
    const response = await fetch(`${BACKEND_URL}/health`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return UNAVAILABLE;
    }
    return (await response.json()) as BackendHealth;
  } catch {
    return UNAVAILABLE;
  }
}
