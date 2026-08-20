import requests

url = "https://api.elevenlabs.io/v1/music/stream"
headers = {
  "xi-api-key": "sk_4ba8d9547c5ce7667ad1b2fba8fd08f2f06741b45fab0509",
  "Content-Type": "application/json"
}
data = {
  "prompt": "Epic cinematic space exploration ambient theme music, soaring strings, deep space drones",
  "music_length_ms": 120000, # 2 minutes
  "model_id": "music_v1"
}

response = requests.post(url, json=data, headers=headers)
if response.status_code == 200:
    with open("data/sfx/space_theme_120s.mp3", "wb") as f:
        f.write(response.content)
    print("Success")
else:
    print(response.text)
