package clusterer

// RemoteVectorizer uses a Provider (e.g., Ollama) to produce embeddings, then clusters via cosine similarity.
type RemoteVectorizer struct {
	Provider Provider
}

func (rv RemoteVectorizer) Vectorize(texts []string, _ []string, _ float64) []map[string]float64 {
	if rv.Provider == nil {
		return nil
	}
	embs, err := rv.Provider.Embed(texts)
	if err != nil || len(embs) == 0 {
		return nil
	}
	vecs := make([]map[string]float64, len(embs))
	for i := range embs {
		v := make(map[string]float64, len(embs[i]))
		// Represent dense vector as sparse map with dim:weight
		for d, val := range embs[i] {
			v[dimKey(d)] = val
		}
		vecs[i] = v
	}
	return vecs
}

func dimKey(i int) string { return dimPrefix + itoa(i) }

const dimPrefix = "dim:"

// tiny integer to ascii without strconv to keep wasm footprint predictable
func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	neg := n < 0
	if neg {
		n = -n
	}
	var buf [20]byte
	i := len(buf)
	for n > 0 {
		i--
		buf[i] = byte('0' + (n % 10))
		n /= 10
	}
	if neg {
		i--
		buf[i] = '-'
	}
	return string(buf[i:])
}

// cosineDense computes cosine similarity for two dense vectors.
// reserved for future use when dense cosine is needed directly
