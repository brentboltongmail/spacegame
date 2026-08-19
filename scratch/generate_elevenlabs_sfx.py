import urllib.request
import json
import os

API_KEY = "sk_4ba8d9547c5ce7667ad1b2fba8fd08f2f06741b45fab0509"
URL = "https://api.elevenlabs.io/v1/sound-generation"

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "sfx")
os.makedirs(OUTPUT_DIR, exist_ok=True)

PROMPTS = {
    "laser_fire.mp3": {
        "text": "Crisp futuristic sci-fi plasma laser beam weapon pulse blast, sharp high-tech energy ray firing, sci-fi starship beam weapon, clean high frequency zap, no drums no thud",
        "duration_seconds": 0.6,
        "prompt_influence": 0.55
    },
    "ship_explosion.mp3": {
        "text": "Massive deep space fighter ship explosion, booming sub bass detonation, tearing metal shrapnel and fiery energy shockwave rumble",
        "duration_seconds": 2.5,
        "prompt_influence": 0.4
    },
    "laser_hit.mp3": {
        "text": "High-energy plasma laser impact on heavy titanium armor plate, sci-fi metal spark hit sizzle",
        "duration_seconds": 0.5,
        "prompt_influence": 0.4
    },
    "engine_hum.mp3": {
        "text": "Deep futuristic starship ion engine continuous low rumble and sub-light thruster whine loop",
        "duration_seconds": 4.0,
        "prompt_influence": 0.3
    }
}

def generate_sfx():
    for filename, config in PROMPTS.items():
        out_path = os.path.join(OUTPUT_DIR, filename)
        print(f"Generating ElevenLabs SFX: {filename}...")
        req = urllib.request.Request(
            URL,
            data=json.dumps(config).encode('utf-8'),
            headers={
                "xi-api-key": API_KEY,
                "Content-Type": "application/json"
            }
        )
        try:
            with urllib.request.urlopen(req) as response:
                audio_data = response.read()
                with open(out_path, "wb") as f:
                    f.write(audio_data)
                print(f"SUCCESS: Generated {filename} ({len(audio_data)} bytes)")
        except Exception as e:
            print(f"ERROR: Failed to generate {filename}: {e}")

if __name__ == "__main__":
    generate_sfx()
