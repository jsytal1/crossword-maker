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
	key   = "en-words.txt"
	empty = " "
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
	if _, err := os.Stat("/tmp/en-words.txt"); os.IsNotExist(err) {
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
		file, err := os.Create(filepath.Join("/tmp", "en-words.txt"))
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

	file, err := os.Open("/tmp/en-words.txt")
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

func getWords(arr []string, width int, height int, positions []map[string]int) []string {
	words := make([]string, 0, len(positions))
	for position := range positions {
		start := positions[position]["start"]
		length := positions[position]["length"]
		dir := positions[position]["dir"]
		interval := 1
		if dir == 1 {
			interval = width
		}
		var pattern strings.Builder
		for i := 0; i < length; i += 1 {
			j := start + i*interval
			pattern.WriteString(arr[j])
		}
		patternStr := pattern.String()
		words = append(words, patternStr)
	}
	return words
}

func getPatterns(arr []string, width int, height int, positions []map[string]int) map[string]bool {
	impliedWords := make(map[string]bool)
	for position := range positions {
		start := positions[position]["start"]
		length := positions[position]["length"]
		dir := positions[position]["dir"]
		interval := 1
		if dir == 1 {
			interval = width
		}
		var pattern strings.Builder
		for i := 0; i < length; i += 1 {
			j := start + i*interval
			pattern.WriteString(arr[j])
		}
		patternStr := pattern.String()
		if !strings.Contains(patternStr, empty) {
			impliedWords[patternStr] = true
		}
	}
	return impliedWords
}

func getExtraWords(arr []string, index map[string]map[string]struct{}, width int, height int, positions []map[string]int) map[string]bool {
	impliedWords := getPatterns(arr, width, height, positions)
	extraWords := make(map[string]bool)
	for word := range impliedWords {
		if _, exists := index[word]; !exists {
			extraWords[word] = true
		}
	}
	return extraWords
}

func get_valid_row_words(curr []string, index map[string]map[string]struct{}, width int, height int) []map[string]struct{} {
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

func get_valid_word_sets(curr []string, index map[string]map[string]struct{}, width int, height int, positions []map[string]int) []map[string]struct{} {
	result := make([]map[string]struct{}, 0, width)
	for position := range positions {
		start := positions[position]["start"]
		length := positions[position]["length"]
		dir := positions[position]["dir"]
		interval := 1
		if dir == 1 {
			interval = width
		}
		var pattern strings.Builder
		for i := 0; i < length; i += 1 {
			j := start + i*interval
			pattern.WriteString(curr[j])
		}
		patternStr := pattern.String()
		wordSet, exists := index[patternStr]
		if !exists {
			wordSet = make(map[string]struct{})
		}
		result = append(result, wordSet)
	}

	return result
}

func get_valid_col_words(curr []string, index map[string]map[string]struct{}, width int, height int) []map[string]struct{} {
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

func allNonEmpty(wordSets []map[string]struct{}) bool {
	for _, wordSet := range wordSets {
		if len(wordSet) == 0 {
			return false
		}
	}
	return true
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
		if strings.Contains(item, empty) {
			return false
		}
	}
	return true
}

func rowWords(curr []string, width int, height int) []string {
	result := make([]string, 0, height)
	for i := 0; i < height; i++ {
		start := width * i
		end := start + width
		result = append(result, strings.Join(curr[start:end], ""))
	}
	return result
}

func colWords(curr []string, width int, height int) []string {
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

func backtrack(curr []string, index map[string]map[string]struct{}, solutions *[]string, limit int, width int, height int, positions []map[string]int, depth int) {
	if depth > 10 {
		return
	}
	word_sets := get_valid_word_sets(curr, index, width, height, positions)
	valid := allNonEmpty(word_sets)
	if !valid {
		return
	}
	allPatterns := getWords(curr, width, height, positions)
	complete := isComplete(allPatterns)
	if complete {
		rowWords := rowWords(curr, width, height)

		// Use a map to count unique words
		uniqueWords := make(map[string]struct{})
		for _, word := range allPatterns {
			uniqueWords[word] = struct{}{}
		}
		uniqueWordCount := len(uniqueWords)

		if uniqueWordCount == len(positions) {
			*solutions = append(*solutions, strings.Join(rowWords, "\n"))
		}
		return
	}

	minSize := math.MaxInt
	minWordSetIndex := -1

	for index, wordSet := range word_sets {
		pattern := allPatterns[index]

		if !strings.Contains(pattern, empty) {
			continue
		}

		if len(wordSet) < minSize {
			minSize = len(wordSet)
			minWordSetIndex = index
		}
	}
	if minWordSetIndex == -1 {
		return
	}

	minSet := word_sets[minWordSetIndex]
	minPosition := positions[minWordSetIndex]
	minInterval := minPosition["interval"]
	minIndex := minPosition["start"]

	back := make([]string, 0, minPosition["length"])
	for i := 0; i < minPosition["length"]; i += 1 {
		j := minPosition["start"] + i*minInterval
		back = append(back, curr[j])
	}
	for word := range minSet {

		for i := 0; i < minPosition["length"]; i += 1 {
			j := minPosition["start"] + i*minInterval
			curr[j] = string(word[i])
		}

		backtrack(curr, index, solutions, limit, width, height, positions, depth+1) // Assuming backtrack is a method of Puzzle
		if len(*solutions) == limit {
			return
		}
	}

	// Restore the original values in curr
	for i := 0; i < minPosition["length"]; i += 1 {
		j := minIndex + i*minInterval
		curr[j] = back[i]
	}
}

func getSolutions(arr []string, limit int, index map[string]map[string]struct{}, width int, height int) []string {
	solutions := make([]string, 0)
	// Convert arr to uppercase
	positions := getPositions(arr, width, height)

	for i := range arr {
		arr[i] = strings.ToUpper(arr[i])
	}

	extraWords := getExtraWords(arr, index, width, height, positions)
	// Add extra words to the index
	for word := range extraWords {
		addWord(word, index)
	}

	// Backtracking algorithm would be here
	backtrack(arr, index, &solutions, limit, width, height, positions, 0)

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

func filterEmptyRows(rows []string) []string {
	filteredRows := make([]string, 0)
	for _, row := range rows {
		if row != "" {
			filteredRows = append(filteredRows, row)
		}
	}
	return filteredRows
}

func getPositions(arr []string, width int, height int) []map[string]int {
	positions := make([]map[string]int, 0)
	rows := rowWords(arr, width, height)
	for row_idx, row := range rows {
		curr_length := 0
		prev_char_idx := 0
		for char_idx, char := range row {
			prev_char_idx = char_idx
			if string(char) != "#" {
				curr_length++
			} else {
				if curr_length >= 2 {
					position := make(map[string]int)
					position["dir"] = 0
					position["row"] = row_idx
					position["col"] = char_idx - curr_length
					position["start"] = row_idx*width + char_idx - curr_length
					position["length"] = curr_length
					position["interval"] = 1
					positions = append(positions, position)
				}
				curr_length = 0
			}
		}
		if curr_length >= 2 {
			position := make(map[string]int)
			position["dir"] = 0
			position["row"] = row_idx
			position["col"] = prev_char_idx - curr_length + 1
			position["start"] = row_idx*width + prev_char_idx - curr_length + 1
			position["length"] = curr_length
			position["interval"] = 1
			positions = append(positions, position)
		}
	}
	cols := colWords(arr, width, height)
	for col_idx, col := range cols {
		curr_length := 0
		prev_char_idx := 0
		for char_idx, char := range col {
			prev_char_idx = char_idx
			if string(char) != "#" {
				curr_length++
			} else {
				if curr_length >= 2 {
					position := make(map[string]int)
					position["dir"] = 1
					position["row"] = char_idx - curr_length
					position["col"] = col_idx
					position["start"] = (char_idx-curr_length)*width + (col_idx)
					position["length"] = curr_length
					position["interval"] = width
					positions = append(positions, position)
				}
				curr_length = 0
			}
		}
		if curr_length >= 2 {
			position := make(map[string]int)
			position["dir"] = 1
			position["row"] = prev_char_idx - curr_length + 1
			position["col"] = col_idx
			position["start"] = (prev_char_idx-curr_length+1)*width + (col_idx)
			position["length"] = curr_length
			position["interval"] = width
			positions = append(positions, position)
		}
	}

	//cols := colWords(arr, width, height)

	return positions
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
	rows := strings.Split(str, "\n")
	rows = rows[:min(5, len(rows))]
	rows = filterEmptyRows(rows)

	width := 0
	for _, row := range rows {
		if len(row) > width {
			width = len(row)
		}
	}
	width = min(width, 5)
	height := len(rows)

	// Fill each row with '#' if it's shorter than width
	for i := 0; i < height; i++ {
		row := rows[i]
		if len(row) < width {
			rows[i] = row + strings.Repeat("#", width-len(row))
		} else {
			rows[i] = row[:width]
		}
	}

	str = strings.Join(rows, "")

	arr := strings.Split(str, "")
	solutions := getSolutions(arr, 5, index, width, height)

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
