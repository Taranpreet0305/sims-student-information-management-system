export async function invokeFunction<TResponse>(
  functionName: string,
  payload: Record<string, unknown>
) {
  const baseUrl = import.meta.env.VITE_FIREBASE_FUNCTIONS_URL;
  if (!baseUrl) {
    throw new Error("Missing VITE_FIREBASE_FUNCTIONS_URL");
  }

  const res = await fetch(`${baseUrl}/${functionName}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Function call failed");
  }

  return (await res.json()) as TResponse;
}
