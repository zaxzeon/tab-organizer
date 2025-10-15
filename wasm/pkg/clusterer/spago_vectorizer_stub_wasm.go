//go:build js && wasm
// +build js,wasm

package clusterer

// SpagoVectorizer is a no-op stub for wasm builds.
// Non-wasm implementation can live in a separate file without the js/wasm tag.
type SpagoVectorizer struct{}

func (SpagoVectorizer) Vectorize(texts []string, _ []string, _ float64) []map[string]float64 {
	return nil
}
