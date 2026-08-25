const fs = require('fs');
const acorn = require('acorn');
const html = fs.readFileSync('index.html', 'utf8');
const scripts = html.match(/<script\b[^>]*>([\s\S]*?)<\/script>/gm) || [];

scripts.forEach((s, i) => {
    const code = s.replace(/<script\b[^>]*>/, '').replace(/<\/script>/, '');
    try {
        acorn.parse(code, {ecmaVersion: 2022});
    } catch(e) {
        console.error('Syntax error in script ' + i + ' at index ' + e.pos + ' (line ' + e.loc.line + '): ' + e.message);
        process.exit(1);
    }
});
console.log('No JS syntax errors');
