import re

def check_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    script_match = re.search(r'<script.*?>([\s\S]*?)</script>', content)
    if not script_match:
        print('No script found')
        return
        
    js = script_match.group(1)
    
    # Remove block comments
    js = re.sub(r'/\*[\s\S]*?\*/', '', js)
    # Remove line comments
    js = re.sub(r'//.*', '', js)
    # Remove regex literals (simple heuristic)
    js = re.sub(r'/[^/\r\n]+/[gimuy]*', '', js)
    
    stack = []
    in_string = False
    string_char = ''
    escape = False
    
    lines = js.split('\n')
    for i, line in enumerate(lines):
        for char in line:
            if in_string:
                if escape:
                    escape = False
                elif char == '\\':
                    escape = True
                elif char == string_char:
                    in_string = False
            else:
                if char in ['\"', '\'', '']:
                    in_string = True
                    string_char = char
                elif char in '{[(': 
                    stack.append((char, i+1))
                elif char in '}])':
                    if not stack:
                        print(f'Unmatched closing {char} on line {i+1}')
                        return
                    top, line_num = stack.pop()
                    if (top == '{' and char != '}') or (top == '[' and char != ']') or (top == '(' and char != ')'):
                        print(f'Mismatched {char} on line {i+1}. Expected closing for {top} from line {line_num}')
                        return
    if stack:
        print(f'Unclosed {stack[-1][0]} from line {stack[-1][1]}')
    else:
        print('Brackets are balanced.')

check_file('index.html')
