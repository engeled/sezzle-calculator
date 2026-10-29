import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from './App'

function mockResponse(result: number) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ result }) }))
}

async function fillNumbers(a = '24', b = '8') {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('First number'), a)
  await user.type(screen.getByLabelText('Second number'), b)
  return user
}

describe('Calculator', () => {
  it('requires inputs before calling the server', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: 'Calculate' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Enter the required numbers.')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each([
    ['Add', 'add', 32], ['Subtract', 'subtract', 16], ['Multiply', 'multiply', 192],
    ['Divide', 'divide', 3], ['Power', 'power', 110075314176], ['Percentage', 'percentage', 1.92],
  ])('calculates %s through the API', async (label, operation, result) => {
    mockResponse(result)
    render(<App />)
    const user = await fillNumbers()
    await user.click(screen.getByRole('button', { name: label }))
    await user.click(screen.getByRole('button', { name: 'Calculate' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(String(result)))
    expect(fetch).toHaveBeenCalledWith('/api/calculate', expect.objectContaining({ body: JSON.stringify({ operation, a: 24, b: 8 }) }))
  })

  it('calculates square root with one input', async () => {
    mockResponse(3)
    render(<App />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Square root' }))
    expect(screen.queryByLabelText('Second number')).not.toBeInTheDocument()
    await user.type(screen.getByLabelText('First number'), '9')
    await user.click(screen.getByRole('button', { name: 'Calculate' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('3'))
  })

  it('shows server validation errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'Cannot divide by zero.' }) }))
    render(<App />)
    const user = await fillNumbers('4', '0')
    await user.click(screen.getByRole('button', { name: 'Divide' }))
    await user.click(screen.getByRole('button', { name: 'Calculate' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Cannot divide by zero.')
  })

  it('shows connection errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    render(<App />)
    const user = await fillNumbers()
    await user.click(screen.getByRole('button', { name: 'Calculate' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not reach the server.')
  })

  it('prevents duplicate submissions while waiting', async () => {
    let resolveResponse!: (value: unknown) => void
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(resolve => { resolveResponse = resolve })))
    render(<App />)
    const user = await fillNumbers()
    await user.click(screen.getByRole('button', { name: 'Calculate' }))
    expect(screen.getByRole('button', { name: 'Calculating…' })).toBeDisabled()
    expect(screen.getByLabelText('First number')).toBeDisabled()
    resolveResponse({ ok: true, json: async () => ({ result: 32 }) })
    await waitFor(() => expect(screen.getByRole('button', { name: 'Calculate' })).toBeEnabled())
  })

  it('clears the previous result when inputs change', async () => {
    mockResponse(32)
    render(<App />)
    const user = await fillNumbers()
    await user.click(screen.getByRole('button', { name: 'Calculate' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('32'))
    fireEvent.change(screen.getByLabelText('Second number'), { target: { value: '5' } })
    expect(screen.getByRole('status')).toHaveTextContent('—')
  })
})
