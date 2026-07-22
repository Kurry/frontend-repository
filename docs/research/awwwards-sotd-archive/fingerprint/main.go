package main

import (
	"bufio"
	"context"
	"crypto/tls"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"regexp"
	"sort"
	"strings"
	"sync"
	"time"

	wappalyzer "github.com/projectdiscovery/wappalyzergo"
)

const userAgent = "Mozilla/5.0 (compatible; AwwwardsSOTDResearch/1.0; +https://github.com/Mercor-Intelligence/frontend-repository)"

type ArchiveRecord struct {
	ArchiveRank  int      `json:"archive_rank"`
	Slug         string   `json:"slug"`
	Title        string   `json:"title"`
	AwwwardsURL  string   `json:"awwwards_url"`
	LiveURL      string   `json:"live_url"`
	AwardDate    string   `json:"award_date"`
	AwwwardsTags []string `json:"awwwards_tags"`
	Studio       string   `json:"studio"`
}

type Technology struct {
	Name        string   `json:"name"`
	Categories  []string `json:"categories"`
	Website     string   `json:"website,omitempty"`
	Description string   `json:"description,omitempty"`
	CPE         string   `json:"cpe,omitempty"`
	Source      string   `json:"source"`
}

type FeatureSignals struct {
	Canvas        bool `json:"canvas"`
	WebGL         bool `json:"webgl"`
	ThreeD        bool `json:"three_d"`
	Video         bool `json:"video"`
	Audio         bool `json:"audio"`
	SVG           bool `json:"svg"`
	Rive          bool `json:"rive"`
	Lottie        bool `json:"lottie"`
	CSSAnimation  bool `json:"css_animation"`
	SmoothScroll  bool `json:"smooth_scroll"`
	ServiceWorker bool `json:"service_worker"`
	WebAssembly   bool `json:"webassembly"`
	Model3D       bool `json:"model_3d_asset"`
}

type FingerprintResult struct {
	ArchiveRank       int               `json:"archive_rank"`
	Slug              string            `json:"slug"`
	Title             string            `json:"title"`
	AwwwardsURL       string            `json:"awwwards_url"`
	RequestedURL      string            `json:"requested_url"`
	FinalURL          string            `json:"final_url,omitempty"`
	AwardDate         string            `json:"award_date"`
	Studio            string            `json:"studio,omitempty"`
	AwwwardsTags      []string          `json:"awwwards_tags"`
	VisitStatus       string            `json:"visit_status"`
	ReachableHTML     bool              `json:"reachable_html"`
	HTTPStatus        int               `json:"http_status,omitempty"`
	ContentType       string            `json:"content_type,omitempty"`
	BytesInspected    int               `json:"bytes_inspected"`
	ResponseHeaders   map[string]string `json:"response_headers,omitempty"`
	Technologies      []Technology      `json:"technologies"`
	FeatureSignals    FeatureSignals    `json:"feature_signals"`
	ReferencedFormats map[string]int    `json:"referenced_asset_formats"`
	PageTitle         string            `json:"page_title,omitempty"`
	ErrorClass        string            `json:"error_class,omitempty"`
	Error             string            `json:"error,omitempty"`
	FingerprintedAt   string            `json:"fingerprinted_at"`
}

var (
	titleRE         = regexp.MustCompile(`(?is)<title[^>]*>(.*?)</title>`)
	urlRE           = regexp.MustCompile(`(?i)(?:src|href|poster|content)\s*=\s*["']([^"']+)["']`)
	extRE           = regexp.MustCompile(`(?i)\.([a-z0-9]{1,8})(?:[?#][^"'\s<>]*)?$`)
	assetExtensions = map[string]bool{
		"html": true, "htm": true, "css": true, "js": true, "mjs": true, "cjs": true,
		"json": true, "xml": true, "txt": true, "csv": true, "map": true, "webmanifest": true,
		"wasm": true, "glsl": true, "vert": true, "frag": true, "wgsl": true,
		"glb": true, "gltf": true, "ktx2": true, "basis": true, "hdr": true, "exr": true,
		"riv": true, "bin": true, "drc": true, "jpg": true, "jpeg": true, "png": true,
		"gif": true, "webp": true, "avif": true, "svg": true, "ico": true, "bmp": true,
		"tif": true, "tiff": true, "heic": true, "heif": true, "mp4": true, "webm": true,
		"mov": true, "m4v": true, "avi": true, "mkv": true, "ogv": true, "m3u8": true,
		"mp3": true, "wav": true, "ogg": true, "m4a": true, "aac": true, "flac": true,
		"woff": true, "woff2": true, "ttf": true, "otf": true, "eot": true,
		"pdf": true, "zip": true,
	}
)

func containsAny(body string, needles ...string) bool {
	for _, needle := range needles {
		if strings.Contains(body, needle) {
			return true
		}
	}
	return false
}

func featureSignals(body []byte, tags []string) FeatureSignals {
	lower := strings.ToLower(string(body))
	tagText := strings.ToLower(strings.Join(tags, " "))
	return FeatureSignals{
		Canvas:        strings.Contains(lower, "<canvas"),
		WebGL:         containsAny(lower, "webgl", "webglrenderer") || strings.Contains(tagText, "webgl"),
		ThreeD:        containsAny(lower, "three.module", "three.min.js", "threejs", "babylon", "playcanvas", "react-three", "model-viewer") || strings.Contains(tagText, "3d"),
		Video:         strings.Contains(lower, "<video") || strings.Contains(tagText, "video"),
		Audio:         strings.Contains(lower, "<audio") || containsAny(lower, "howler", "tone.js") || containsAny(tagText, "sound-audio", "music & sound"),
		SVG:           strings.Contains(lower, "<svg"),
		Rive:          containsAny(lower, ".riv", "rive.app", "@rive-app"),
		Lottie:        containsAny(lower, "lottie", "bodymovin"),
		CSSAnimation:  containsAny(lower, "@keyframes", "animation-name", "animation-duration"),
		SmoothScroll:  containsAny(lower, "lenis", "locomotive-scroll", "smooth-scroll", "scroll-behavior:smooth"),
		ServiceWorker: containsAny(lower, "serviceworker", "service-worker", "navigator.serviceworker"),
		WebAssembly:   containsAny(lower, ".wasm", "webassembly"),
		Model3D:       containsAny(lower, ".glb", ".gltf", "model/gltf", "model-viewer"),
	}
}

func referencedFormats(body []byte) map[string]int {
	result := map[string]int{}
	for _, match := range urlRE.FindAllSubmatch(body, -1) {
		candidate := strings.ToLower(string(match[1]))
		if ext := extRE.FindStringSubmatch(candidate); len(ext) == 2 {
			if assetExtensions[ext[1]] {
				result[ext[1]]++
			}
		}
	}
	return result
}

func cleanTitle(body []byte) string {
	match := titleRE.FindSubmatch(body)
	if len(match) != 2 {
		return ""
	}
	title := regexp.MustCompile(`\s+`).ReplaceAllString(string(match[1]), " ")
	return strings.TrimSpace(title)
}

func classifyError(err error) string {
	if err == nil {
		return ""
	}
	var netErr net.Error
	if errors.As(err, &netErr) && netErr.Timeout() {
		return "timeout"
	}
	var dnsErr *net.DNSError
	if errors.As(err, &dnsErr) {
		return "dns_error"
	}
	lower := strings.ToLower(err.Error())
	switch {
	case strings.Contains(lower, "certificate"), strings.Contains(lower, "tls"):
		return "tls_error"
	case strings.Contains(lower, "redirect"):
		return "redirect_error"
	default:
		return "network_error"
	}
}

func parkingPage(body []byte) bool {
	lower := strings.ToLower(string(body))
	return containsAny(lower, "domain is for sale", "buy this domain", "parked domain", "sedoparking", "hugedomains.com")
}

func visitStatus(status int, contentType string, body []byte) (string, bool) {
	if status == http.StatusForbidden || status == http.StatusTooManyRequests {
		return "access_blocked", false
	}
	if status == http.StatusNotFound || status == http.StatusGone {
		return "not_found", false
	}
	if status >= 500 {
		return "server_error", false
	}
	if status < 200 || status >= 400 {
		return "http_error", false
	}
	lower := strings.ToLower(string(body[:min(len(body), 4096)]))
	isHTML := strings.Contains(strings.ToLower(contentType), "text/html") || strings.Contains(lower, "<html") || strings.Contains(lower, "<!doctype html")
	if !isHTML {
		return "non_html", false
	}
	if parkingPage(body) {
		return "parked", false
	}
	return "live_html", true
}

func selectedHeaders(headers http.Header) map[string]string {
	keys := []string{"server", "x-powered-by", "x-vercel-id", "x-nf-request-id", "cf-ray", "x-cache", "via", "content-security-policy"}
	result := map[string]string{}
	for _, key := range keys {
		if value := headers.Get(key); value != "" {
			result[key] = value
		}
	}
	return result
}

func fingerprint(ctx context.Context, client *http.Client, detector *wappalyzer.Wappalyze, record ArchiveRecord, bodyLimit int64) FingerprintResult {
	result := FingerprintResult{
		ArchiveRank:       record.ArchiveRank,
		Slug:              record.Slug,
		Title:             record.Title,
		AwwwardsURL:       record.AwwwardsURL,
		RequestedURL:      record.LiveURL,
		AwardDate:         record.AwardDate,
		Studio:            record.Studio,
		AwwwardsTags:      record.AwwwardsTags,
		VisitStatus:       "pending",
		Technologies:      []Technology{},
		ReferencedFormats: map[string]int{},
		FingerprintedAt:   time.Now().UTC().Truncate(time.Second).Format(time.RFC3339),
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, record.LiveURL, nil)
	if err != nil {
		result.VisitStatus = "invalid_url"
		result.ErrorClass = "invalid_url"
		result.Error = err.Error()
		return result
	}
	req.Header.Set("User-Agent", userAgent)
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.1")
	resp, err := client.Do(req)
	if err != nil {
		result.ErrorClass = classifyError(err)
		result.VisitStatus = result.ErrorClass
		result.Error = err.Error()
		return result
	}
	defer resp.Body.Close()
	body, readErr := io.ReadAll(io.LimitReader(resp.Body, bodyLimit))
	if readErr != nil {
		result.VisitStatus = "read_error"
		result.ErrorClass = "read_error"
		result.Error = readErr.Error()
		return result
	}
	result.FinalURL = resp.Request.URL.String()
	result.HTTPStatus = resp.StatusCode
	result.ContentType = resp.Header.Get("Content-Type")
	result.BytesInspected = len(body)
	result.ResponseHeaders = selectedHeaders(resp.Header)
	result.VisitStatus, result.ReachableHTML = visitStatus(resp.StatusCode, result.ContentType, body)
	result.PageTitle = cleanTitle(body)
	result.FeatureSignals = featureSignals(body, record.AwwwardsTags)
	result.ReferencedFormats = referencedFormats(body)

	if result.ReachableHTML {
		matches := detector.FingerprintWithInfo(map[string][]string(resp.Header), body)
		names := make([]string, 0, len(matches))
		for name := range matches {
			names = append(names, name)
		}
		sort.Strings(names)
		for _, name := range names {
			info := matches[name]
			categories := append([]string(nil), info.Categories...)
			sort.Strings(categories)
			result.Technologies = append(result.Technologies, Technology{
				Name: name, Categories: categories, Website: info.Website,
				Description: info.Description, CPE: info.CPE, Source: "wappalyzergo",
			})
		}
	}
	return result
}

func loadArchive(path string) ([]ArchiveRecord, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()
	var records []ArchiveRecord
	scanner := bufio.NewScanner(file)
	scanner.Buffer(make([]byte, 64*1024), 4*1024*1024)
	for scanner.Scan() {
		var record ArchiveRecord
		if err := json.Unmarshal(scanner.Bytes(), &record); err != nil {
			return nil, err
		}
		records = append(records, record)
	}
	return records, scanner.Err()
}

func loadCompleted(path string) map[int]bool {
	completed := map[int]bool{}
	file, err := os.Open(path)
	if err != nil {
		return completed
	}
	defer file.Close()
	scanner := bufio.NewScanner(file)
	scanner.Buffer(make([]byte, 64*1024), 8*1024*1024)
	for scanner.Scan() {
		var row struct {
			ArchiveRank int `json:"archive_rank"`
		}
		if json.Unmarshal(scanner.Bytes(), &row) == nil {
			completed[row.ArchiveRank] = true
		}
	}
	return completed
}

func main() {
	archivePath := flag.String("archive", "", "Awwwards archive JSONL")
	outputPath := flag.String("output", "", "resumable fingerprint JSONL")
	workers := flag.Int("workers", 24, "concurrent sites")
	timeout := flag.Duration("timeout", 20*time.Second, "per-site request timeout")
	bodyLimit := flag.Int64("body-limit", 4*1024*1024, "maximum bytes inspected per site")
	flag.Parse()
	if *archivePath == "" || *outputPath == "" {
		flag.Usage()
		os.Exit(2)
	}
	records, err := loadArchive(*archivePath)
	if err != nil {
		panic(err)
	}
	completed := loadCompleted(*outputPath)
	detector, err := wappalyzer.New()
	if err != nil {
		panic(err)
	}
	transport := &http.Transport{
		Proxy:                 http.ProxyFromEnvironment,
		DialContext:           (&net.Dialer{Timeout: 8 * time.Second, KeepAlive: 20 * time.Second}).DialContext,
		TLSClientConfig:       &tls.Config{MinVersion: tls.VersionTLS12},
		TLSHandshakeTimeout:   8 * time.Second,
		ResponseHeaderTimeout: 10 * time.Second,
		MaxIdleConns:          *workers * 2,
		IdleConnTimeout:       30 * time.Second,
	}
	client := &http.Client{
		Transport: transport,
		Timeout:   *timeout,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			if len(via) >= 8 {
				return fmt.Errorf("redirect limit exceeded")
			}
			return nil
		},
	}
	output, err := os.OpenFile(*outputPath, os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0o644)
	if err != nil {
		panic(err)
	}
	defer output.Close()
	encoder := json.NewEncoder(output)
	encoder.SetEscapeHTML(false)

	jobs := make(chan ArchiveRecord)
	results := make(chan FingerprintResult)
	var workerGroup sync.WaitGroup
	for range *workers {
		workerGroup.Add(1)
		go func() {
			defer workerGroup.Done()
			for record := range jobs {
				ctx, cancel := context.WithTimeout(context.Background(), *timeout)
				results <- fingerprint(ctx, client, detector, record, *bodyLimit)
				cancel()
			}
		}()
	}
	go func() {
		for _, record := range records {
			if !completed[record.ArchiveRank] {
				jobs <- record
			}
		}
		close(jobs)
		workerGroup.Wait()
		close(results)
	}()

	written := len(completed)
	for result := range results {
		if err := encoder.Encode(result); err != nil {
			panic(err)
		}
		written++
		if written%100 == 0 || written == len(records) {
			fmt.Printf("fingerprinted %d/%d\n", written, len(records))
		}
	}
}
