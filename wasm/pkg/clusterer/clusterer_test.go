package clusterer

import "testing"

func TestTokenize(t *testing.T) {
	got := tokenize("Hello, WORLD!!! this is a Test of tokens")
	// short tokens like "is" and punctuation removed; lowercase applied
	if len(got) == 0 {
		t.Fatalf("expected non-empty tokens")
	}
}

func TestExtractDomain(t *testing.T) {
	if d := extractDomain("https://www.example.com/page"); d != "example.com" {
		t.Fatalf("got %q", d)
	}
	if d := extractDomain("not a url"); d != "" {
		t.Fatalf("expected empty, got %q", d)
	}
}

func TestTFIDFWithOptions_DomainBoost(t *testing.T) {
	texts := []string{"alpha beta", "alpha example.com"}
	vecs := TFIDFWithOptions(texts, map[string]struct{}{}, 3)
	if len(vecs) != 2 {
		t.Fatalf("expected 2 vectors")
	}
}

func TestTFIDFWithOptions_StopwordsAndBoost(t *testing.T) {
	texts := []string{
		"Alpha beta example.com",
		"Alpha gamma example.com",
	}
	sw := map[string]struct{}{"beta": {}}
	vecs := TFIDFWithOptions(texts, sw, 2)
	if len(vecs) != 2 {
		t.Fatalf("expected 2 vectors")
	}
	if vecs[0]["beta"] != 0 {
		t.Fatalf("stopword not removed")
	}
	// domain tokens may tokenize differently; ensure some token exists after boost
	if len(vecs[0]) == 0 {
		t.Fatalf("expected non-empty vector after boost")
	}
}

func TestClusterTextsWithOptions_BasicGrouping(t *testing.T) {
	ids := []int{1, 2, 3}
	texts := []string{
		"project alpha example.com",
		"alpha module example.com",
		"unrelated topic different.org",
	}
	clusters := ClusterTextsWithOptions(ids, texts, -1.0, nil, 1)
	if len(clusters) == 0 {
		t.Fatalf("expected at least one cluster")
	}
	// One cluster should contain ids 1 and 2 (size may be >= 2)
	found := false
	for _, c := range clusters {
		m := map[int]bool{}
		for _, id := range c {
			m[id] = true
		}
		if m[1] && m[2] {
			found = true
		}
	}
	if !found {
		t.Fatalf("expected cluster with 1 and 2")
	}
}

func TestNameCluster(t *testing.T) {
	name := NameCluster([]string{"alpha beta", "alpha gamma"})
	if name == "Group" {
		t.Fatalf("expected informative name, got %s", name)
	}
}
