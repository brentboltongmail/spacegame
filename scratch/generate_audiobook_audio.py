import asyncio
import edge_tts
import json
import os
import re

VOICE = "en-US-ChristopherNeural"
OUTPUT_DIR = "audio"
os.makedirs(OUTPUT_DIR, exist_ok=True)

with open("audiobook.html", "r", encoding="utf-8") as f:
    content = f.read()

match = re.search(r'const actsData = (\[.*?\]);\s*let currentActIndex', content, re.DOTALL)
if not match:
    print("ERROR: could not find actsData in audiobook.html")
    exit(1)

acts_data = json.loads(match.group(1))

async def generate_act_audio(act_idx, act):
    act_num = act["actNum"]
    title = act["title"]
    subtitle = act.get("subtitle", "")
    audio_path = act["audio"]
    paragraphs = act["paragraphs"]

    # Construct the full script for the narrator
    # Introduction
    header_text = f"{title}. {subtitle}." if subtitle else f"{title}."
    
    full_narration_text = header_text + "\n\n" + "\n\n".join(paragraphs)
    
    print(f"[{act_idx+1}/5] Generating narration for {title}...")
    print(f"  Target: {audio_path}")
    print(f"  Word count: {len(full_narration_text.split())} words, Character count: {len(full_narration_text)}")
    
    communicate = edge_tts.Communicate(full_narration_text, VOICE, rate="+0%")
    await communicate.save(audio_path)
    
    size = os.path.getsize(audio_path)
    print(f"  SUCCESS: Generated {audio_path} ({size:,} bytes)")

async def main():
    print(f"Starting neural audiobook voice synthesis with voice: {VOICE}")
    for idx, act in enumerate(acts_data):
        await generate_act_audio(idx, act)
    print("\nAll 5 Acts synthesized successfully!")

if __name__ == "__main__":
    asyncio.run(main())
