export async function calculate(operation: string, a: number, b?: number): Promise<number> {
  const response = await fetch('/api/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operation, a, b }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Calculation failed. Please try again.')
  if (typeof data.result !== 'number' || !Number.isFinite(data.result)) {
    throw new Error('The server returned an invalid result.')
  }
  return data.result
}
