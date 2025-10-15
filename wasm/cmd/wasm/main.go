//go:build js && wasm
// +build js,wasm

package main

import (
	"encoding/json"
	"syscall/js"
	"taborganizer/wasm/pkg/clusterer"
)

// GroupTabs(jsonTabs, threshold, optionsJson) -> json clusters
func groupTabs(this js.Value, args []js.Value) any {
	if len(args) < 3 {
		return "[]"
	}
	var tabs []clusterer.Tab
	if err := json.Unmarshal([]byte(args[0].String()), &tabs); err != nil {
		return "[]"
	}
	th := args[1].Float()
	if th <= 0 {
		th = 0.4
	}
	// Parse options (stopwords, domainBoost)
	var opts struct {
		Stopwords   []string `json:"stopwords"`
		DomainBoost float64  `json:"domainBoost"`
	}
	_ = json.Unmarshal([]byte(args[2].String()), &opts)

	ids := make([]int, len(tabs))
	texts := make([]string, len(tabs))
	for i, t := range tabs {
		ids[i] = t.ID
		texts[i] = t.Title + " " + t.URL
	}
	clusters := clusterer.ClusterTextsWithOptions(ids, texts, th, opts.Stopwords, opts.DomainBoost)
	out := make([]clusterer.Cluster, 0, len(clusters))
	for _, c := range clusters {
		subset := make([]string, 0, len(c))
		for _, id := range c {
			for j, tab := range tabs {
				if tab.ID == id {
					subset = append(subset, texts[j])
					break
				}
			}
		}
		out = append(out, clusterer.Cluster{TabIDs: c, Name: clusterer.NameCluster(subset)})
	}
	b, _ := json.Marshal(out)
	return string(b)
}

func main() {
	js.Global().Set("GroupTabs", js.FuncOf(groupTabs))
	select {}
}
