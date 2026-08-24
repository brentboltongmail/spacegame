import os
import json
import urllib.request
import time

API_KEY = "sk_4ba8d9547c5ce7667ad1b2fba8fd08f2f06741b45fab0509"
VOICES_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "voices.json")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "audio", "cinematics", "titan_gate")

os.makedirs(OUTPUT_DIR, exist_ok=True)

with open(VOICES_FILE, "r", encoding="utf-8") as f:
    voices_registry = json.load(f)

CHAR_MAP = voices_registry["characters"]

TITAN_GATE_DIALOGUE = [
    {
        "id": "titan_gate_01_elias",
        "char_key": "elias_vance",
        "speaker": "Elias Vance",
        "role": "Mars Comms",
        "text": "Kaylen! Kaylen, do you read me?! The long-range sensors on Mars just went red—The Crest is gone from the grid! Report in, kid!"
    },
    {
        "id": "titan_gate_02_kaylen",
        "char_key": "kaylen_vance",
        "speaker": "Kaylen Vance",
        "role": "Void Interceptor Cockpit",
        "text": "Elias... they wiped out the fleet. The kinetic rounds bounced right off their hulls. They're lining up their dreadnoughts on the rift right now."
    },
    {
        "id": "titan_gate_03_elias",
        "char_key": "elias_vance",
        "speaker": "Elias Vance",
        "role": "Mars Comms",
        "text": "Then break off and burn hard for the outer moons! Divert everything to afterburners! I'm spooling the freighter down in the slums—I will come get you, son!"
    },
    {
        "id": "titan_gate_04_kaylen",
        "char_key": "kaylen_vance",
        "speaker": "Kaylen Vance",
        "role": "Void Interceptor Cockpit",
        "text": "You know my fuel reserves, Elias. I can't outrun them. If those dreadnoughts cross this threshold, Sol doesn't have a defense left. Earth won't last twenty minutes."
    },
    {
        "id": "titan_gate_05_elias",
        "char_key": "elias_vance",
        "speaker": "Elias Vance",
        "role": "Mars Comms",
        "text": "No... No, look at the telemetry! The gravitational shear inside that ring is tearing atoms apart! You take that interceptor in there, you'll be vaporized!"
    },
    {
        "id": "titan_gate_06_kaylen",
        "char_key": "kaylen_vance",
        "speaker": "Kaylen Vance",
        "role": "Void Interceptor Cockpit",
        "text": "It's vibrating, Elias. The pendant you found me with... it's singing with the gate. It's the same frequency. It knows what to do."
    },
    {
        "id": "titan_gate_07_elias",
        "char_key": "elias_vance",
        "speaker": "Elias Vance",
        "role": "Mars Comms",
        "text": "Kaylen, listen to me! You don't know what that thing is—what you are! I promised myself I'd keep you safe from all this... Don't you throw your life away for a war that isn't yours!"
    },
    {
        "id": "titan_gate_08_kaylen",
        "char_key": "kaylen_vance",
        "speaker": "Kaylen Vance",
        "role": "Void Interceptor Cockpit",
        "text": "You gave me twenty years, old man. You taught me how to fly, how to fight, and how to fix broken things. Earth is my home because you're on it."
    },
    {
        "id": "titan_gate_09_elias",
        "char_key": "elias_vance",
        "speaker": "Elias Vance",
        "role": "Mars Comms",
        "text": "Kaylen, NO! Turn the ship around! KAYLEN—"
    },
    {
        "id": "titan_gate_10_kaylen",
        "char_key": "kaylen_vance",
        "speaker": "Kaylen Vance",
        "role": "Void Interceptor Cockpit",
        "text": "Someone has to shut the door, old man. ... See you on the other side, Dad...."
    },
    {
        "id": "titan_arrival_01_kaylen",
        "char_key": "kaylen_vance",
        "speaker": "Kaylen Vance",
        "role": "Void Interceptor Cockpit",
        "text": "What is going on?! We are being attacked! By... by... I don't know who!"
    },
    {
        "id": "titan_arrival_02_kaylen",
        "char_key": "kaylen_vance",
        "speaker": "Kaylen Vance",
        "role": "Void Interceptor Cockpit",
        "text": "They're attacking Titan! Actually... it looks like they're looking for something..."
    },
    {
        "id": "titan_arrival_03_kaylen",
        "char_key": "kaylen_vance",
        "speaker": "Kaylen Vance",
        "role": "Void Interceptor Cockpit",
        "text": "There is a giant ring... an ancient artifact?! What are they doing?!"
    },
    {
        "id": "titan_arrival_04_kaylen",
        "char_key": "kaylen_vance",
        "speaker": "Kaylen Vance",
        "role": "Void Interceptor Cockpit",
        "text": "Oh no... The Crest!! NOOO!!"
    }
]

def generate_cinematic_dialogue():
    print(f"Generating {len(TITAN_GATE_DIALOGUE)} cinematic lines via ElevenLabs API...")
    manifest = []
    
    for item in TITAN_GATE_DIALOGUE:
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
                        "audio": f"audio/cinematics/titan_gate/{out_filename}",
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
