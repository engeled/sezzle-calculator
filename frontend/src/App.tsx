import { useState, type FormEvent } from 'react'
import { calculate } from './api'

const operations = [
  { value: 'add', label: 'Add', symbol: '+' },
  { value: 'subtract', label: 'Subtract', symbol: '−' },
  { value: 'multiply', label: 'Multiply', symbol: '×' },
  { value: 'divide', label: 'Divide', symbol: '÷' },
  { value: 'power', label: 'Power', symbol: '^' },
  { value: 'sqrt', label: 'Square root', symbol: '√' },
  { value: 'percentage', label: 'Percentage', symbol: '%' },
]

export default function App() {
  const [operation, setOperation] = useState('add')
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const [result, setResult] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const selected = operations.find(item => item.value === operation)!

  function clearResult() {
    setResult(null)
    setError('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    clearResult()
    if (!a.trim() || (operation !== 'sqrt' && !b.trim())) {
      setError('Enter the required numbers.')
      return
    }
    if (!Number.isFinite(Number(a)) || (operation !== 'sqrt' && !Number.isFinite(Number(b)))) {
      setError('Enter valid, finite numbers.')
      return
    }
    setLoading(true)
    try {
      setResult(await calculate(operation, Number(a), operation === 'sqrt' ? undefined : Number(b)))
    } catch (err) {
      setError(err instanceof TypeError ? 'Could not reach the server. Please try again.' : err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main>
      <header><span className="brand-icon">=</span><span>Simple Calculator</span></header>
      <section className="intro">
        <h1>Welcome</h1>
        <p>Pick an operation, enter your numbers, and get your answer.</p>
      </section>
      <section className="calculator" aria-label="Calculator">
        <form onSubmit={handleSubmit} noValidate>
          <fieldset disabled={loading}>
            <legend>Choose an operation</legend>
            <div className="operations">
              {operations.map(item => (
                <button key={item.value} type="button" aria-pressed={operation === item.value} onClick={() => { setOperation(item.value); clearResult() }}>
                  <span aria-hidden="true">{item.symbol}</span>{item.label}
                </button>
              ))}
            </div>
            <div className="inputs">
              <label>First number<input type="number" step="any" value={a} placeholder="e.g. 24" onChange={event => { setA(event.target.value); clearResult() }} /></label>
              <span className="input-symbol" aria-hidden="true">{selected.symbol}</span>
              {operation !== 'sqrt' && <label>Second number<input type="number" step="any" value={b} placeholder="e.g. 8" onChange={event => { setB(event.target.value); clearResult() }} /></label>}
            </div>
            <button className="submit" type="submit">{loading ? 'Calculating…' : 'Calculate'}<span aria-hidden="true">→</span></button>
          </fieldset>
          {error && <p className="error" role="alert">{error}</p>}
        </form>
        <div className="result" role="status" aria-live="polite" aria-busy={loading}>
          <p className="eyebrow">YOUR RESULT</p>
          <p className={result === null ? 'answer placeholder' : 'answer'}>{result === null ? '—' : String(result)}</p>
        </div>
      </section>
    </main>
  )
}
