# Verification results

| Layer | Coverage | Details |
| --- | --- | --- |
| Frontend | 93.93% lines, 94.87% statements, 94.44% branches, 100% functions | 18 passing tests |
| Backend | 90.6% statements | 34 passing test cases across calculation, API, and health tests |

The backend calculation function, JSON response helper, calculation handler, and routing function each have 100% statement coverage. The server startup function is not covered by unit tests.

Saved reports:

- [Backend HTML report](../backend/coverage.html)
- [Backend coverage profile](../backend/coverage.out)
- [Frontend JSON summary](frontend-coverage.json)

Also verified: TypeScript compilation, Vite production build, `go vet`, and a calculation through the running frontend and Go API. Docker was unavailable and the image has not been built here.

To regenerate the reports, use the commands in the README. Coverage measures the included application files; frontend startup and styling are checked through the build and browser review.
