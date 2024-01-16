
def get_solutions(arr: list):
    solutions = []

    def backtrack(curr: list, i: int):
        if i > 2:
            return
        solutions.append(''.join(curr))
        
        back = curr[0]
        curr[0] = ''
        backtrack(curr, i + 1)
        curr[0] = back
        
    
    backtrack(arr, 0)
    return solutions
    
print(get_solutions(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']))