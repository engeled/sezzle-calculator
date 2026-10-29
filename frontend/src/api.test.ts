import { describe, expect, it, vi } from 'vitest'
import { calculate } from './api'

describe('calculate API', () => {
  it('posts inputs and returns the result', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ result: 5 }) })
    vi.stubGlobal('fetch', fetchMock)
    expect(await calculate('add', 2, 3)).toBe(5)
    expect(fetchMock).toHaveBeenCalledWith('/api/calculate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operation: 'add', a: 2, b: 3 }),
    })
  })

  it('does not send a second number for square root', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ result: 3 }) })
    vi.stubGlobal('fetch', fetchMock)
    await calculate('sqrt', 9)
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ operation: 'sqrt', a: 9 })
  })

  it.each([
    [{ ok: false, data: { error: 'Cannot divide by zero.' } }, 'Cannot divide by zero.'],
    [{ ok: false, data: {} }, 'Calculation failed. Please try again.'],
    [{ ok: true, data: { result: '5' } }, 'The server returned an invalid result.'],
    [{ ok: true, data: { result: Infinity } }, 'The server returned an invalid result.'],
  ])('handles an unsuccessful response', async ({ ok, data }, message) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok, json: async () => data }))
    await expect(calculate('add', 2, 3)).rejects.toThrow(message)
  })
})
