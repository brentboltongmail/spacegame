import os
import json
import urllib.request
import time

API_KEY = "sk_4ba8d9547c5ce7667ad1b2fba8fd08f2f06741b45fab0509"
VOICES_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "voices.json")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "audio", "cinematics", "mission_1")

os.makedirs(OUTPUT_DIR, exist_ok=True)

with open(VOICES_FILE, "r", encoding="utf-8") as f:
    voices_registry = json.load(f)

CHAR_MAP = voices_registry["characters"]

MISSION_1_DIALOGUE = [
    {
        "id": "mission1_01_elias",
        "char_key": "elias_vance",
        "speaker": "Elias Vance",
        "role": "The Crest Comms",
        "text": "Alright, kid. Let's see if those stabilizer tweaks I made hold up. Fly around Saturn, clear those 3 training rings, and shoot down 3 target drones I set up near the rings."
    },
    {
        "id": "mission1_02_kaylen",
        "char_key": "kaylen_vance",
        "speaker": "Kaylen Vance",
        "role": "Void Interceptor Cockpit",
        "text": "Copy that, old man. Controls are stiff, but responsive. Rings and drones cleared."
    },
    {
        "id": "mission1_03_elias",
        "char_key": "elias_vance",
        "speaker": "Elias Vance",
        "role": "The Crest Comms",
        "text": "Good. Now dock back at The Crest."
    }
]

def generate_cinematic_dialogue():
    print(f"Generating {len(MISSION_1_DIALOGUE)} cinematic lines via ElevenLabs API...")
    manifest = []
    
    for item in MISSION_1_DIALOGUE:
        char_info = CHAR_MAP[item["char_key"]]
        voice_id = char_info["voice_id"]
        out_filename = f"{item['id']}.mp3"
        out_path = os.path.join(OUTPUT_DIR, out_filename)
        
        payload = {
            "text": item["text"],
            "model_id": "eleven_turbo_v2_5",
            "voice_settings": char_info.get("settings", {
                "stability": 0.5,
                "similarity_boost": 0.8
            })
        }
        
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "xi-api-key": API_KEY,
                "Content-Type": "application/json"
            }
        )
        
        for attempt in range(1, 4):
            print(f"-> Generating line '{item['id']}' for {item['speaker']} ({char_info['voice_name']} - {voice_id}) [Attempt {attempt}]...", flush=True)
            try:
                with urllib.request.urlopen(req, timeout=30) as resp:
                    audio_data = resp.read()
                    with open(out_path, "wb") as out_f:
                        out_f.write(audio_data)
                    print(f"   [SUCCESS] Saved {out_filename} ({len(audio_data)} bytes)", flush=True)
                    
                    manifest.append({
                        "id": item["id"],
                        "speaker": item["speaker"],
                        "role": item["role"],
                        "text": item["text"],
                        "audio": f"audio/cinematics/mission_1/{out_filename}",
                        "voice_id": voice_id,
                        "voice_name": char_info["voice_name"],
                        "size_bytes": len(audio_data)
                    })
                    break
            except Exception as e:
                print(f"   [ERROR] Failed attempt {attempt} for {item['id']}: {e}", flush=True)
                if attempt < 3:
                    time.sleep(2)
        
        time.sleep(0.3)
    
    manifest_path = os.path.join(OUTPUT_DIR, "manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as mf:
        json.dump(manifest, mf, indent=2)
    print(f"\nSaved cinematic dialogue manifest to {manifest_path}")

if __name__ == "__main__":
    generate_cinematic_dialogue()
