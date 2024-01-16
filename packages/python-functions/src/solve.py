import json
import os
import boto3

BUCKET_NAME = os.environ.get('BUCKET_NAME')

KEY = 'words-5.txt'

class CrosswordMaker:
    def __init__(self, width: int, height: int, empty: str = '_'):
        self.width = width
        self.height = height
        self.empty = empty
        self.__index = {}

    def get_valid_row_words(self, arr: list):
        result = []
        for i in range(self.height):
            start = self.width * i
            end = start + self.width
            pattern = ''.join(arr[start:end])
            result.append(self.__index.get(pattern, set()))
        return result

    def get_valid_col_words(self, arr: list):
        result = []
        for i in range(self.width):
            start = i
            interval = self.width
            pattern = ''.join(arr[start::interval])
            result.append(self.__index.get(pattern, set()))
        return result

    def add_word(self, word: str):
        word = word.upper()
        patterns = self.generate_index_patterns_for_word(word)
        for pattern in patterns:
            if pattern not in self.__index:
                self.__index[pattern] = set([word])
            else:
                self.__index[pattern].add(word)
    
    def remove_word(self, word: str):
        word = word.upper()
        patterns = self.generate_index_patterns_for_word(word)
        for pattern in patterns:
            word_set = self.__index[pattern]
            if word in word_set:
                word_set.remove(word)
                if len(word_set) == 0:
                    del self.__index[pattern]

    def generate_index_patterns_for_word(self, word: str):
        patterns = set()
        for i in range(1 << len(word)):
            pattern = ""
            for j in range(len(word)):
                if i & (1 << j):
                    pattern += word[j]
                else:
                    pattern += self.empty
            patterns.add(pattern)
        return patterns

    def row_words(self, arr: list):
        return [''.join(arr[i*self.width:i*self.width+self.width]) for i in range(self.height)]
    
    def col_words(self, arr: list):
        return [''.join(arr[i::self.width]) for i in range(self.width)]

    def get_solutions_old(self, arr: list, limit: int = 10):
        solutions = []
        def backtrack(curr, i = 0):
            row_word_sets = self.get_valid_row_words(curr)
            col_word_sets = self.get_valid_col_words(curr)
            if len(solutions) == limit:
                return
            valid = all([len(word_set) != 0 for word_set in row_word_sets + col_word_sets])
            if not valid:
                return
            complete = curr.count(self.empty) == 0
            if complete:
                row_words = self.row_words(curr)
                col_words = self.col_words(curr)
                unique_word_count = len(set(row_words + col_words))
                if unique_word_count == self.width + self.height:
                    solutions.append(''.join(curr))
                return
            
            start = self.width * i
            end = start + self.width
            pattern = ''.join(curr[start:end])
            word_set = self.__index.get(pattern, set())
            back = curr[start:end]
            for word in word_set:
                curr[start:end] = word
                backtrack(curr, i + 1)
                if len(solutions) == limit:
                    return
            curr[start:end] = back
        
        arr = [char.upper() for char in arr]
        implied_words = set()
        for i in range(self.height):
            start = self.width * i
            end = start + self.width
            pattern = ''.join(arr[start:end])
            if pattern.count(self.empty) == 0:
                implied_words.add(pattern)
        for i in range(self.width):
            start = i
            interval = self.width
            pattern = ''.join(arr[start::interval])
            if pattern.count(self.empty) == 0:
                implied_words.add(pattern)
        extra_words = set()
        for word in implied_words:
            if word not in self.__index:
                extra_words.add(word)
        for word in extra_words:
            self.add_word(word)
        backtrack(arr, 0)
        for word in extra_words:
            self.remove_word(word)
        return solutions

    def get_solutions(self, arr: list, limit: int = 10):
        solutions = []
        def backtrack(curr):
            row_word_sets = self.get_valid_row_words(curr)
            col_word_sets = self.get_valid_col_words(curr)
            valid = all([len(word_set) != 0 for word_set in row_word_sets + col_word_sets])
            if not valid:
                return
            complete = curr.count(self.empty) == 0
            if complete:
                row_words = self.row_words(curr)
                col_words = self.col_words(curr)
                unique_word_count = len(set(row_words + col_words))
                if unique_word_count == self.width + self.height:
                    solutions.append(''.join(curr))
                return

            # choose set from row_word_sets and col_word_sets with smallest size
            min_size = float('inf')
            min_set = None
            min_index = -1
            min_end_index = -1
            for index, word_set in enumerate(row_word_sets + col_word_sets):
                if index < self.height:
                    grid_index = index * self.width
                    interval = 1
                    end_index = grid_index + self.width
                else:
                    grid_index = index - self.height
                    interval = self.width
                    end_index = grid_index + interval * self.width
                pattern = ''.join(curr[grid_index:end_index:interval])
                if self.empty not in pattern:
                    continue
                if len(word_set) < min_size:
                    min_size = len(word_set)
                    min_set = word_set
                    min_index = grid_index
                    min_interval = interval
                    min_end_index = end_index
            
            back = curr[min_index:min_end_index:min_interval]
            for word in min_set:
                curr[min_index:min_end_index:min_interval] = word
                backtrack(curr)
                if len(solutions) == limit:
                    return
            curr[min_index:min_end_index:min_interval] = back
        
        arr = [char.upper() for char in arr]
        implied_words = set()
        for i in range(self.height):
            start = self.width * i
            end = start + self.width
            pattern = ''.join(arr[start:end])
            if pattern.count(self.empty) == 0:
                implied_words.add(pattern)
        for i in range(self.width):
            start = i
            interval = self.width
            pattern = ''.join(arr[start::interval])
            if pattern.count(self.empty) == 0:
                implied_words.add(pattern)
        extra_words = set()
        for word in implied_words:
            if word not in self.__index:
                extra_words.add(word)
        for word in extra_words:
            self.add_word(word)
        backtrack(arr)
        for word in extra_words:
            self.remove_word(word)
        return solutions

cm = CrosswordMaker(5, 5)

# get file from tmp or s3 if not exists
# store to tmp if pulling from s3
if not os.path.exists('/tmp/en-words-5.txt'):
  s3 = boto3.client('s3')
  data = s3.get_object(Bucket=BUCKET_NAME, Key=KEY)
  contents = data['Body'].iter_lines()
  with open('/tmp/en-words-5.txt', 'wb') as f:
    for line in contents:
      f.write(line + b'\n')

# read file from tmp
with open('/tmp/en-words-5.txt', 'r') as f:
  for line in f:
    word = line.strip()
    cm.add_word(word)



def handler(event, context):
  arguments = json.loads(event['body'])
  grid = list(arguments['layout'])
  
  solutions = cm.get_solutions(grid, 1)
  return solutions