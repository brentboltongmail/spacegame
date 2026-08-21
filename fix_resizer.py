with open('index.html', 'r') as f:
    content = f.read()

old_logic = "grid.style.gridTemplateColumns = `${newWidth}% 10px 1fr`;"
new_logic = "grid.style.gridTemplateColumns = `${newWidth}fr 10px ${100 - newWidth}fr`;"

content = content.replace(old_logic, new_logic)

with open('index.html', 'w') as f:
    f.write(content)
