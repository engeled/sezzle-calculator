package main

import (
	"math"
	"testing"
)

func TestCalculate(t *testing.T) {
	tests := []struct {
		name, operation string
		a, b, want      float64
		wantError       bool
	}{
		{"addition", "add", 2, 3, 5, false},
		{"negative subtraction", "subtract", -2, 3, -5, false},
		{"decimal multiplication", "multiply", 1.5, 4, 6, false},
		{"division", "divide", 7, 2, 3.5, false},
		{"zero result", "multiply", 0, 9, 0, false},
		{"zero divisor", "divide", 4, 0, 0, true},
		{"power", "power", 2, 3, 8, false},
		{"square root", "sqrt", 9, 0, 3, false},
		{"negative square root", "sqrt", -1, 0, 0, true},
		{"percentage", "percentage", 200, 10, 20, false},
		{"unknown operation", "other", 1, 2, 0, true},
		{"overflow", "multiply", math.MaxFloat64, 2, 0, true},
		{"invalid power", "power", -2, 0.5, 0, true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := calculate(tt.operation, tt.a, tt.b)
			if (err != nil) != tt.wantError {
				t.Fatalf("error = %v, wantError = %v", err, tt.wantError)
			}
			if !tt.wantError && math.Abs(got-tt.want) > 1e-12 {
				t.Fatalf("got %v, want %v", got, tt.want)
			}
		})
	}
}
