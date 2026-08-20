import requests

url = "https://api.elevenlabs.io/v1/sound-generation"
headers = {
  "xi-api-key": "sk_4ba8d9547c5ce7667ad1b2fba8fd08f2f06741b45fab0509",
  "Content-Type": "application/json"
}
data = {
  "text": "Epic cinematic space exploration ambient theme music, soaring strings, deep space drones",
  "duration_seconds": 22
}

response = requests.post(url, json=data, headers=headers)
if response.status_code == 200:
    with open("data/sfx/space_theme_22s.mp3", "wb") as f:
        f.write(response.content)
    print("Success")
else:
    print(response.text)
