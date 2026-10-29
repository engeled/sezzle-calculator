package main

import (
	"encoding/json"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestCalculateAPI(t *testing.T) {
	tests := []struct {
		name, method, body, contentType string
		status                          int
		want                            float64
	}{
		{"success", "POST", `{"operation":"add","a":2,"b":3}`, "application/json", 200, 5},
		{"zero is valid", "POST", `{"operation":"add","a":0,"b":0}`, "application/json; charset=utf-8", 200, 0},
		{"unary", "POST", `{"operation":"sqrt","a":16}`, "application/json", 200, 4},
		{"unary with b", "POST", `{"operation":"sqrt","a":16,"b":2}`, "application/json", 200, 4},
		{"division by zero", "POST", `{"operation":"divide","a":2,"b":0}`, "application/json", 400, 0},
		{"unknown", "POST", `{"operation":"wat","a":2,"b":1}`, "application/json", 400, 0},
		{"missing a", "POST", `{"operation":"add","b":3}`, "application/json", 400, 0},
		{"missing b", "POST", `{"operation":"add","a":3}`, "application/json", 400, 0},
		{"null", "POST", `null`, "application/json", 400, 0},
		{"null input", "POST", `{"operation":"add","a":null,"b":3}`, "application/json", 400, 0},
		{"string", "POST", `{"operation":"add","a":"2","b":3}`, "application/json", 400, 0},
		{"malformed", "POST", `{`, "application/json", 400, 0},
		{"trailing JSON", "POST", `{"operation":"add","a":1,"b":2} {}`, "application/json", 400, 0},
		{"trailing junk", "POST", `{"operation":"add","a":1,"b":2} x`, "application/json", 400, 0},
		{"unknown field", "POST", `{"operation":"add","a":1,"b":2,"extra":1}`, "application/json", 400, 0},
		{"too large", "POST", strings.Repeat(" ", 4097) + `{}`, "application/json", 400, 0},
		{"out of range", "POST", `{"operation":"add","a":1e400,"b":2}`, "application/json", 400, 0},
		{"method", "GET", ``, "application/json", 405, 0},
		{"media type", "POST", `{}`, "text/plain", 415, 0},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			r := httptest.NewRequest(tt.method, "/api/calculate", strings.NewReader(tt.body))
			r.Header.Set("Content-Type", tt.contentType)
			w := httptest.NewRecorder()
			routes().ServeHTTP(w, r)
			if w.Code != tt.status {
				t.Fatalf("status %d: %s", w.Code, w.Body.String())
			}
			if w.Header().Get("Content-Type") != "application/json" {
				t.Fatal("expected JSON response")
			}
			var body map[string]any
			if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
				t.Fatal(err)
			}
			if tt.status == 200 {
				if body["result"] != tt.want {
					t.Fatalf("unexpected result: %v", body)
				}
			} else if body["error"] == nil {
				t.Fatal("missing error message")
			}
		})
	}
}

func TestHealth(t *testing.T) {
	for _, method := range []string{"GET", "POST"} {
		w := httptest.NewRecorder()
		routes().ServeHTTP(w, httptest.NewRequest(method, "/api/health", nil))
		want := 200
		if method == "POST" {
			want = 405
		}
		if w.Code != want {
			t.Fatalf("status = %d", w.Code)
		}
	}
}
