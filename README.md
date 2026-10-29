# Simple Calculator

A small calculator built with React, TypeScript, and Go. It supports addition, subtraction, multiplication, division, powers, square roots, and percentages.

I kept the project small so it is easy to run and follow. React handles the form and displays the answer, while Go validates the request and performs the calculation.

## Run locally

You need Node.js 24 and Go 1.24 or newer.

Start the backend in one terminal:

```sh
cd backend
go run .
```

Then start the frontend in another terminal, from the project folder:

```sh
cd frontend
npm ci
npm run dev
```

Open http://localhost:5173. The backend listens on port 8080. Vite forwards `/api` requests to it during development, so both processes need to be running. If you change the backend port with `PORT`, update the proxy in `frontend/vite.config.ts` too.

## Use Docker

From the project folder:

```sh
docker build -t simple-calculator .
docker run --rm -p 8080:8080 simple-calculator
```

Open http://localhost:8080. The image builds both parts and uses Go to serve the frontend files and API from the same address. The container runs as a non-root user.

Docker was not installed in my test environment, so I could not verify the image build. I verified the frontend build and backend separately.

## API

`POST /api/calculate` accepts JSON with an operation and two numbers. Square root only requires `a`.

```sh
curl -X POST http://localhost:8080/api/calculate -H "Content-Type: application/json" -d '{"operation":"add","a":24,"b":8}'
```

```json
{"result":32}
```

In PowerShell, the same request can be made with:

```powershell
Invoke-RestMethod http://localhost:8080/api/calculate -Method Post -ContentType 'application/json' -Body '{"operation":"add","a":24,"b":8}'
```

| Operation | Calculation | Example input |
| --- | --- | --- |
| `add` | a + b | `{"operation":"add","a":24,"b":8}` |
| `subtract` | a − b | `{"operation":"subtract","a":24,"b":8}` |
| `multiply` | a × b | `{"operation":"multiply","a":24,"b":8}` |
| `divide` | a ÷ b | `{"operation":"divide","a":24,"b":8}` |
| `power` | a raised to b | `{"operation":"power","a":2,"b":3}` |
| `sqrt` | square root of a | `{"operation":"sqrt","a":9}` |
| `percentage` | b% of a | `{"operation":"percentage","a":200,"b":10}` |

For percentage, the example returns 20. For square root, an optional `b` is ignored.

Invalid input returns HTTP 400 with a readable error:

```json
{"error":"Cannot divide by zero."}
```

Missing or null numbers, strings instead of numbers, malformed JSON, unknown fields, unsupported operations, negative square roots, and results outside the supported range also return 400. Requests must contain one JSON object and stay within 4 KB. Unsupported methods return 405, and unsupported content types return 415.

`GET /api/health` returns `{"status":"ok"}`.

## Tests and coverage

Backend:

```sh
cd backend
go test ./... -coverprofile=coverage.out
go tool cover -func=coverage.out
go tool cover -html=coverage.out -o coverage.html
go vet ./...
```

On PowerShell, quote the coverage options: `go test ./... '-coverprofile=coverage.out'` and `go tool cover '-html=coverage.out' -o coverage.html`.

Frontend:

```sh
cd frontend
npm ci
npm test
npm run coverage
npm run build
```

The backend tests cover the operations and HTTP validation. The frontend tests cover form validation, all seven operations, API requests, server errors, connection failures, loading state, and clearing old results after edits. Frontend tests use mocked HTTP responses; I also checked the running frontend against the real API in the browser.

The saved results are in [reports/coverage.md](reports/coverage.md). The backend HTML report is in `backend/coverage.html`. Running frontend coverage creates an HTML report at `frontend/coverage/index.html`.

## Project layout

```text
backend/
  calculator.go
  calculator_test.go
  main.go
  main_test.go
frontend/
  src/
    App.tsx
    App.test.tsx
    api.ts
    api.test.ts
    main.tsx
    styles.css
reports/
Dockerfile
```

## Choices and assumptions

I used Go's standard library because this API does not need a framework or extra backend dependencies. The calculation function is separate from the HTTP handler so the math can be tested without starting a server.

The frontend uses local React state and plain CSS. There is no database because the app does not need to save anything. A single calculation endpoint keeps the request format consistent for all operations.

The inputs accept negative numbers and decimals. Both layers validate input: the frontend catches missing numbers early, and the backend remains responsible for validating every API request. Inputs are disabled while a request is running to prevent duplicate submissions and avoid showing an answer for changed inputs.

Calculations use Go `float64`, so normal floating-point limitations apply. For example, 0.1 + 0.2 can return 0.30000000000000004. I display the returned number without adding rounding rules. This is intended as a general calculator, not a financial calculator with exact decimal arithmetic.

The API works with real numbers only. A negative base with a fractional exponent may produce an invalid result and will return an error. Zero raised to zero follows Go's behavior and returns 1.
