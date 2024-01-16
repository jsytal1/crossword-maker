package main

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"os"
	"path/filepath"
	"strings"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

const (
	key    = "words-5.txt"
	width  = 5
	height = 5
	empty  = "_"
)

var bucketName = os.Getenv("BUCKET_NAME")

var index = map[string]map[string]struct{}{}

// generateIndexPatternsForWord generates all possible patterns for a given word
func generateIndexPatternsForWord(word string) map[string]struct{} {
	patterns := make(map[string]struct{})
	wordLen := len(word)
	for i := 0; i < (1 << wordLen); i++ {
		var pattern strings.Builder
		for j := 0; j < wordLen; j++ {
			if i&(1<<j) != 0 {
				pattern.WriteByte(word[j])
			} else {
				pattern.WriteString(empty)
			}
		}
		patterns[pattern.String()] = struct{}{}
	}
	return patterns
}

// addWord adds a word to the index
func addWord(word string, index map[string]map[string]struct{}) {
	word = strings.ToUpper(word)
	patterns := generateIndexPatternsForWord(word)
	for pattern := range patterns {
		if _, exists := index[pattern]; !exists {
			index[pattern] = make(map[string]struct{})
		}
		index[pattern][word] = struct{}{}
	}
}

func removeWord(word string, index map[string]map[string]struct{}) {
	word = strings.ToUpper(word)
	patterns := generateIndexPatternsForWord(word)
	for pattern := range patterns {
		wordSet, exists := index[pattern]
		if exists {
			// Check if word is in the set
			_, found := wordSet[word]
			if found {
				// Remove the word from the set
				delete(wordSet, word)
				// If the set is now empty, remove the pattern from the index
				if len(wordSet) == 0 {
					delete(index, pattern)
				}
			}
		}
	}
}

func init() {
	// Initialization code here
	index = make(map[string]map[string]struct{})
	// Check if the file exists
	if _, err := os.Stat("/tmp/en-words-5.txt"); os.IsNotExist(err) {
		// Load the Shared AWS Configuration (~/.aws/config)
		cfg, err := config.LoadDefaultConfig(context.TODO())
		if err != nil {
			panic("configuration error, " + err.Error())
		}

		// Create an Amazon S3 service client
		client := s3.NewFromConfig(cfg)

		// Get the object from S3
		output, err := client.GetObject(context.TODO(), &s3.GetObjectInput{
			Bucket: aws.String(bucketName),
			Key:    aws.String(key),
		})
		if err != nil {
			panic("error getting object, " + err.Error())
		}
		defer output.Body.Close()

		// Create the file
		file, err := os.Create(filepath.Join("/tmp", "en-words-5.txt"))
		if err != nil {
			panic("unable to create file, " + err.Error())
		}
		defer file.Close()

		// Write the contents to the file
		reader := output.Body
		buf := make([]byte, 1024)
		for {
			n, err := reader.Read(buf)
			if err != nil && err != io.EOF {
				panic("read error, " + err.Error())
			}
			if n == 0 {
				break
			}

			if _, err := file.Write(buf[:n]); err != nil {
				panic("write error, " + err.Error())
			}
			file.WriteString("\n")
		}
	}

	file, err := os.Open("/tmp/en-words-5.txt")
	if err != nil {
		panic(err)
	}
	defer file.Close()

	// Create a new scanner to read the file
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		// Read each line and strip it
		word := strings.TrimSpace(scanner.Text())
		// Call the addWord function
		addWord(word, index)
	}
	// Check for errors during scanning
	if err := scanner.Err(); err != nil {
		panic(err)
	}

}

func getPatterns(arr []string) map[string]bool {
	impliedWords := make(map[string]bool)
	// Horizontal patterns
	for i := 0; i < height; i++ {
		start := width * i
		end := start + width
		pattern := strings.Join(arr[start:end], "")
		if !strings.Contains(pattern, empty) {
			impliedWords[pattern] = true
		}
	}
	// Vertical patterns
	for i := 0; i < width; i++ {
		var pattern strings.Builder
		for j := i; j < len(arr); j += width {
			pattern.WriteString(arr[j])
		}
		patternStr := pattern.String()
		if !strings.Contains(patternStr, empty) {
			impliedWords[patternStr] = true
		}
	}
	return impliedWords
}

func getExtraWords(arr []string, index map[string]map[string]struct{}) map[string]bool {
	impliedWords := getPatterns(arr)
	extraWords := make(map[string]bool)
	for word := range impliedWords {
		if _, exists := index[word]; !exists {
			extraWords[word] = true
		}
	}
	return extraWords
}

func get_valid_row_words(curr []string, index map[string]map[string]struct{}) []map[string]struct{} {
	result := make([]map[string]struct{}, 0, height)
	for i := 0; i < height; i++ {
		start := width * i
		end := start + width
		pattern := strings.Join(curr[start:end], "")
		wordSet, exists := index[pattern]
		if !exists {
			wordSet = make(map[string]struct{})
		}
		result = append(result, wordSet)
	}
	return result
}

func get_valid_col_words(curr []string, index map[string]map[string]struct{}) []map[string]struct{} {
	result := make([]map[string]struct{}, 0, width)
	for i := 0; i < width; i++ {
		var patternBuilder strings.Builder
		for j := i; j < len(curr); j += width {
			patternBuilder.WriteString(curr[j])
		}
		pattern := patternBuilder.String()
		wordSet, exists := index[pattern]
		if !exists {
			wordSet = make(map[string]struct{})
		}
		result = append(result, wordSet)
	}
	return result
}

func allSetsNonEmpty(rowWordSets []map[string]struct{}, colWordSets []map[string]struct{}) bool {
	for _, wordSet := range rowWordSets {
		if len(wordSet) == 0 {
			return false
		}
	}
	for _, wordSet := range colWordSets {
		if len(wordSet) == 0 {
			return false
		}
	}
	return true
}
func isComplete(curr []string) bool {
	for _, item := range curr {
		if item == empty {
			return false
		}
	}
	return true
}

func rowWords(curr []string) []string {
	result := make([]string, 0, height)
	for i := 0; i < height; i++ {
		start := width * i
		end := start + width
		result = append(result, strings.Join(curr[start:end], ""))
	}
	return result
}

func colWords(curr []string) []string {
	result := make([]string, 0, width)
	for i := 0; i < width; i++ {
		var patternBuilder strings.Builder
		for j := i; j < len(curr); j += width {
			patternBuilder.WriteString(curr[j])
		}
		result = append(result, patternBuilder.String())
	}
	return result
}

func extractPattern(curr []string, start, end, interval int) string {
	var patternBuilder strings.Builder
	for i := start; i < end; i += interval {
		patternBuilder.WriteString(curr[i])
	}
	return patternBuilder.String()
}

func backtrack(curr []string, index map[string]map[string]struct{}, solutions *[]string, limit int) {
	row_word_sets := get_valid_row_words(curr, index)
	col_word_sets := get_valid_col_words(curr, index)
	valid := allSetsNonEmpty(row_word_sets, col_word_sets)
	if !valid {
		return
	}
	complete := isComplete(curr)
	if complete {
		rowWords := rowWords(curr) // Assuming this method exists and returns []string
		colWords := colWords(curr) // Assuming this method exists and returns []string

		// Use a map to count unique words
		uniqueWords := make(map[string]struct{})
		for _, word := range append(rowWords, colWords...) {
			uniqueWords[word] = struct{}{}
		}
		uniqueWordCount := len(uniqueWords)

		if uniqueWordCount == width+height {
			*solutions = append(*solutions, strings.Join(curr, ""))
		}
		return
	}

	minSize := math.MaxInt
	var minSet map[string]struct{}
	minIndex := -1
	minEndIndex := -1
	minInterval := 1

	allSets := append(row_word_sets, col_word_sets...)

	for index, wordSet := range allSets {
		var gridIndex, endIndex, interval int
		if index < height {
			gridIndex = index * width
			interval = 1
			endIndex = gridIndex + width
		} else {
			gridIndex = index - height
			interval = width
			endIndex = gridIndex + interval*width
		}

		pattern := extractPattern(curr, gridIndex, endIndex, interval)
		if !strings.Contains(pattern, empty) {
			continue
		}

		if len(wordSet) < minSize {
			minSize = len(wordSet)
			minSet = wordSet
			minIndex = gridIndex
			minInterval = interval
			minEndIndex = endIndex
		}
	}

	back := make([]string, 0, (minEndIndex-minIndex)/minInterval)
	for i := minIndex; i < minEndIndex; i += minInterval {
		back = append(back, curr[i])
	}

	for word := range minSet {
		k := 0
		for i := minIndex; i < minEndIndex; i += minInterval {
			curr[i] = string(word[k])
			k++
		}
		backtrack(curr, index, solutions, limit) // Assuming backtrack is a method of Puzzle
		if len(*solutions) == limit {
			return
		}
	}

	// Restore the original values in curr
	k := 0
	for i := minIndex; i < minEndIndex; i += minInterval {
		curr[i] = back[k]
		k++
	}
}

func getSolutions(arr []string, limit int, index map[string]map[string]struct{}) []string {
	solutions := make([]string, 0)
	// Convert arr to uppercase
	for i := range arr {
		arr[i] = strings.ToUpper(arr[i])
	}

	extraWords := getExtraWords(arr, index)
	// Add extra words to the index
	for word := range extraWords {
		addWord(word, index)
	}

	// Backtracking algorithm would be here
	backtrack(arr, index, &solutions, limit)

	// Remove extra words from the index
	for word := range extraWords {
		removeWord(word, index)
	}

	return solutions
}

//type MyEvent struct {
//	Body struct {
//		Layout string `json:"layout"`
//	} `json:"body"`
//}

type MyEvent struct {
	Body string `json:"body"`
}

func handler(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	// No need to unmarshal the body, as it's already a struct
	var arguments map[string]interface{}
	if err := json.Unmarshal([]byte(event.Body), &arguments); err != nil {
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Body:       "Invalid request body",
		}, nil
	}

	// Extract the layout and convert it to a slice of strings
	layout, ok := arguments["layout"].(string)
	if !ok {
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Body:       "Invalid layout format",
		}, nil
	}

	str := layout
	arr := strings.Split(str, "")
	solutions := getSolutions(arr, 5, index)

	jsonArray, err := json.Marshal(solutions)
	if err != nil {
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Body:       fmt.Sprintf("Error occurred during JSON marshalling: %s", err.Error()),
		}, nil
	}

	jsonArrayString := string(jsonArray)

	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Body:       jsonArrayString,
	}, nil
}

func main() {
	lambda.Start(handler)
}
