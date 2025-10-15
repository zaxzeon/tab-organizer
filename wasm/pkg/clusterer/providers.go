package clusterer

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

// Provider produces embedding vectors for input texts via a remote service.
type Provider interface {
	Embed(texts []string) ([][]float64, error)
}

// OllamaProvider calls an Ollama-compatible embeddings endpoint.
// Expected API: POST {baseURL}/api/embeddings { model, prompt }
// See: https://github.com/ollama/ollama/blob/main/docs/api.md#generate-embeddings
type OllamaProvider struct {
	BaseURL string
	Model   string
	Client  *http.Client
}

type ollamaEmbedReq struct {
	Model  string `json:"model"`
	Prompt string `json:"prompt"`
}

type ollamaEmbedResp struct {
	Embedding []float64 `json:"embedding"`
}

func (p OllamaProvider) httpClient() *http.Client {
	if p.Client != nil {
		return p.Client
	}
	return http.DefaultClient
}

func (p OllamaProvider) Embed(texts []string) ([][]float64, error) {
	if p.BaseURL == "" || p.Model == "" {
		return nil, fmt.Errorf("ollama: missing BaseURL or Model")
	}
	out := make([][]float64, 0, len(texts))
	for _, t := range texts {
		payload := ollamaEmbedReq{Model: p.Model, Prompt: t}
		b, _ := json.Marshal(payload)
		req, err := http.NewRequest("POST", p.BaseURL+"/api/embeddings", bytes.NewReader(b))
		if err != nil {
			return nil, err
		}
		req.Header.Set("Content-Type", "application/json")
		resp, err := p.httpClient().Do(req)
		if err != nil {
			return nil, err
		}
		defer resp.Body.Close()
		if resp.StatusCode < 200 || resp.StatusCode >= 300 {
			return nil, fmt.Errorf("ollama: http %d", resp.StatusCode)
		}
		var or ollamaEmbedResp
		if err := json.NewDecoder(resp.Body).Decode(&or); err != nil {
			return nil, err
		}
		out = append(out, or.Embedding)
	}
	return out, nil
}
