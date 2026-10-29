FROM node:24-alpine AS frontend
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM golang:1.27-alpine AS backend
WORKDIR /app
COPY backend/ ./
RUN CGO_ENABLED=0 go build -o /calculator .

FROM alpine:3.23
WORKDIR /app
RUN adduser -D calculator
COPY --from=backend /calculator ./calculator
COPY --from=frontend /app/dist ./public
USER calculator
EXPOSE 8080
CMD ["./calculator"]
