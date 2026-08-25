import re

with open('index.html', 'r') as f:
    content = f.read()

old_text = "Kaylen's Void Interceptor plunged through the collapsing singularity, drawing the enemy's alpha-strike and triggering an exotic-matter shockwave that imploded the wormhole. Sol is saved from the armada, but Kaylen has been hurled perhaps thousands of light-years across subspace into the unknown."
new_text = "Kaylen's void interceptor plunged through the wormhole. His gamble paid off and somehow his amulet seems to have almost known what he was thinking and closed the gate. The Sol System is saved from the armada for now, but Kaylen has been hurled across slipspace into the unknown..."

content = content.replace(old_text, new_text)

with open('index.html', 'w') as f:
    f.write(content)
