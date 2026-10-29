package main

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
)

type calculationRequest struct {
	Operation string   `json:"operation"`
	A         *float64 `json:"a"`
	B         *float64 `json:"b"`
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(value)
}

func handleCalculate(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.Header().Set("Allow", "POST")
		writeJSON(w, 405, map[string]string{"error": "Use POST for calculations."})
		return
	}
	if strings.Split(r.Header.Get("Content-Type"), ";")[0] != "application/json" {
		writeJSON(w, 415, map[string]string{"error": "Content-Type must be application/json."})
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, 4096)
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	var input calculationRequest
	if err := decoder.Decode(&input); err != nil {
		writeJSON(w, 400, map[string]string{"error": "Send a valid JSON object with numeric inputs."})
		return
	}
	if err := decoder.Decode(new(any)); err != io.EOF {
		writeJSON(w, 400, map[string]string{"error": "Send only one JSON object."})
		return
	}
	if input.A == nil || (input.Operation != "sqrt" && input.B == nil) {
		writeJSON(w, 400, map[string]string{"error": "Required numbers are missing."})
		return
	}
	b := 0.0
	if input.B != nil {
		b = *input.B
	}
	result, err := calculate(input.Operation, *input.A, b)
	if err != nil {
		writeJSON(w, 400, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, 200, map[string]float64{"result": result})
}

func routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/api/calculate", handleCalculate)
	mux.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			w.Header().Set("Allow", "GET")
			writeJSON(w, 405, map[string]string{"error": "Use GET for health checks."})
			return
		}
		writeJSON(w, 200, map[string]string{"status": "ok"})
	})
	mux.Handle("/", http.FileServer(http.Dir("./public")))
	return mux
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	server := &http.Server{Addr: ":" + port, Handler: routes(), ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 10 * time.Second, WriteTimeout: 10 * time.Second, IdleTimeout: 60 * time.Second}
	log.Printf("Calculator running on http://localhost:%s", port)
	log.Fatal(server.ListenAndServe())
}
