package clusterer

import (
	"math"
	"net/url"
	"sort"
	"strings"
)

type Tab struct {
	ID    int    `json:"id"`
	Title string `json:"title"`
	URL   string `json:"url"`
}

type Cluster struct {
	TabIDs []int  `json:"tabIds"`
	Name   string `json:"name"`
}

// Vectorizer converts free-form texts into sparse vectors of term weights.
// Implementations should be deterministic for identical inputs.
type Vectorizer interface {
	Vectorize(texts []string, stopwords []string, domainBoost float64) []map[string]float64
}

var currentVectorizer Vectorizer = TFIDFVectorizer{}

// SetVectorizer allows swapping vectorization backend (e.g., spago embeddings, remote service).
// This is safe to call during init or before use from JS.
func SetVectorizer(v Vectorizer) { currentVectorizer = v }

func tokenize(s string) []string {
	s = strings.ToLower(s)
	var b strings.Builder
	for _, r := range s {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == ' ' {
			b.WriteRune(r)
		} else {
			b.WriteRune(' ')
		}
	}
	parts := strings.Fields(b.String())
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if len(p) > 2 {
			out = append(out, p)
		}
	}
	return out
}

// extractDomain finds a URL in free-form text and returns its hostname without www.
func extractDomain(s string) string {
	idx := strings.LastIndex(s, "http://")
	if idx == -1 {
		idx = strings.LastIndex(s, "https://")
	}
	if idx == -1 {
		return ""
	}
	end := len(s)
	for i := idx; i < len(s); i++ {
		if s[i] == ' ' || s[i] == '\n' || s[i] == '\t' {
			end = i
			break
		}
	}
	raw := s[idx:end]
	u, err := url.Parse(raw)
	if err != nil {
		return ""
	}
	host := u.Hostname()
	if host == "" {
		return ""
	}
	return strings.TrimPrefix(host, "www.")
}

// TFIDFWithOptions returns sparse vectors per document with optional stopword removal and domain boosting.
// TFIDFVectorizer is the default pure-Go vectorizer.
type TFIDFVectorizer struct{}

func TFIDFWithOptions(texts []string, stopwords map[string]struct{}, domainBoost float64) []map[string]float64 {
	docs := make([][]string, len(texts))
	for i, t := range texts {
		toks := tokenize(t)
		if len(stopwords) > 0 {
			filtered := make([]string, 0, len(toks))
			for _, tok := range toks {
				if _, blocked := stopwords[tok]; !blocked {
					filtered = append(filtered, tok)
				}
			}
			toks = filtered
		}
		if domainBoost > 1 {
			dom := extractDomain(t)
			if dom != "" {
				dTok := tokenize(dom)
				extra := int(domainBoost) - 1
				for n := 0; n < extra; n++ {
					toks = append(toks, dTok...)
				}
			}
		}
		docs[i] = toks
	}
	tf := make([]map[string]float64, len(docs))
	df := map[string]int{}
	for i, doc := range docs {
		tf[i] = map[string]float64{}
		seen := map[string]bool{}
		for _, term := range doc {
			tf[i][term] += 1
			if !seen[term] {
				df[term]++
				seen[term] = true
			}
		}
	}
	idf := map[string]float64{}
	n := float64(len(docs))
	for term, dfi := range df {
		idf[term] = math.Log(n / (float64(dfi) + 1))
	}
	vecs := make([]map[string]float64, len(docs))
	for i := range docs {
		v := map[string]float64{}
		for term, c := range tf[i] {
			v[term] = c * idf[term]
		}
		vecs[i] = v
	}
	return vecs
}

// Vectorize implements Vectorizer for TFIDFVectorizer.
func (TFIDFVectorizer) Vectorize(texts []string, stopwords []string, domainBoost float64) []map[string]float64 {
	sm := map[string]struct{}{}
	for _, s := range stopwords {
		sm[s] = struct{}{}
	}
	return TFIDFWithOptions(texts, sm, domainBoost)
}

func cosine(a, b map[string]float64) float64 {
	terms := map[string]struct{}{}
	for k := range a {
		terms[k] = struct{}{}
	}
	for k := range b {
		terms[k] = struct{}{}
	}
	var dot, na, nb float64
	for k := range terms {
		av := a[k]
		bv := b[k]
		dot += av * bv
		na += av * av
		nb += bv * bv
	}
	if na == 0 || nb == 0 {
		return 0
	}
	return dot / (math.Sqrt(na) * math.Sqrt(nb))
}

// Agglomerative average-linkage clustering with threshold cut.
func ClusterTextsWithOptions(ids []int, texts []string, threshold float64, stop []string, domBoost float64) [][]int {
	// Use pluggable vectorizer
	vecs := currentVectorizer.Vectorize(texts, stop, domBoost)
	// precompute similarities
	sim := make([][]float64, len(vecs))
	for i := range vecs {
		sim[i] = make([]float64, len(vecs))
	}
	for i := 0; i < len(vecs); i++ {
		for j := i + 1; j < len(vecs); j++ {
			s := cosine(vecs[i], vecs[j])
			sim[i][j] = s
			sim[j][i] = s
		}
	}
	// trivial greedy threshold grouping (fast path) for baseline
	used := make([]bool, len(ids))
	var clusters [][]int
	for i := range ids {
		if used[i] {
			continue
		}
		used[i] = true
		cur := []int{ids[i]}
		for j := range ids {
			if used[j] || j == i {
				continue
			}
			if sim[i][j] >= threshold {
				cur = append(cur, ids[j])
				used[j] = true
			}
		}
		if len(cur) > 1 {
			clusters = append(clusters, cur)
		}
	}
	return clusters
}

func NameCluster(texts []string) string {
	freq := map[string]int{}
	for _, t := range texts {
		for _, tok := range tokenize(t) {
			freq[tok]++
		}
	}
	if len(freq) == 0 {
		return "Group"
	}
	type kv struct {
		k string
		v int
	}
	arr := make([]kv, 0, len(freq))
	for k, v := range freq {
		arr = append(arr, kv{k, v})
	}
	sort.Slice(arr, func(i, j int) bool { return arr[i].v > arr[j].v })
	top := arr[0].k
	return strings.ToUpper(top[:1]) + top[1:] + " Group"
}
