import http.server
import socketserver
import json
import os
import urllib.parse
import sys
from pathlib import Path

# Ensure stdout and stderr handles exist even when running via windowless pythonw.exe
if sys.stdout is None:
    sys.stdout = open(os.devnull, 'w')
if sys.stderr is None:
    sys.stderr = open(os.devnull, 'w')

PORT = 8088
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data" / "users"

# Ensure user data directory exists
DATA_DIR.mkdir(parents=True, exist_ok=True)

DEFAULT_BOX_POSITIONS = {
    "hud-camera-card": {"x": -140, "y": 949},
    "hud-radar-card": {"x": 25, "y": 85},
    "drag-sector-objective": {"x": 24, "y": -32},
    "hud-top-target-card": {"x": -16, "y": -75},
    "hud-controls-card": {"x": -24, "y": -32},
    "hud-shield-card": {"x": -25, "y": 85}
}

DEFAULT_PROGRESS = {
    "currentMission": "Mission 1",
    "playerCredits": 125000,
    "playerHp": 100,
    "shieldPercent": 100,
    "landingPhase": 6,
    "isLandingSequenceActive": True,
    "inHangerZone": True,
    "isDocked": True,
    "currentSpeed": 0,
    "targetSpeed": 0,
    "mission1": {
        "active": True,
        "stage": 0,
        "enemiesDestroyed": 0,
        "clearedRings": [False, False, False, False],
        "enemies": []
    },
    "mission2": {"active": False, "stage": 0, "enemiesDestroyed": 0, "enemies": []},
    "mission3": {"active": False}
}

def get_user_file(username: str) -> Path:
    # Allow alphanumeric, spaces, underscores, hyphens, and dots, while stripping forbidden filesystem characters
    safe_name = "".join(c for c in username.strip() if c not in r'/\:*?"<>|').strip()
    if not safe_name:
        safe_name = 'default_user'
    
    # 1. Exact match
    exact_file = DATA_DIR / f"{safe_name}.json"
    if exact_file.exists():
        return exact_file

    # 2. Case-insensitive / space-normalized match
    target_norm = safe_name.lower().replace('_', ' ').replace('-', ' ').strip()
    if DATA_DIR.exists():
        for f in DATA_DIR.glob('*.json'):
            if f.stem.lower() == safe_name.lower() or f.stem.lower().replace('_', ' ').replace('-', ' ').strip() == target_norm:
                return f
            try:
                with open(f, 'r', encoding='utf-8') as jf:
                    data = json.load(jf)
                    if data.get('username', '').lower().strip() == username.lower().strip():
                        return f
            except Exception:
                pass

    return exact_file

class AstraGameRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS for local testing
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        
        # Prevent aggressive browser caching so all HTML, JS, and 3D asset updates load immediately
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
            
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        # Disable conditional 304 caching so browser refresh always fetches live files from disk
        if 'If-Modified-Since' in self.headers:
            del self.headers['If-Modified-Since']
        if 'If-None-Match' in self.headers:
            del self.headers['If-None-Match']

        parsed_path = urllib.parse.urlparse(self.path)
        
        # Handle API Profile Load Endpoint
        if parsed_path.path == '/api/profile':
            query_params = urllib.parse.parse_qs(parsed_path.query)
            username = query_params.get('user', ['default_user'])[0].strip() or 'default_user'
            user_file = get_user_file(username)
            
            if user_file.exists():
                try:
                    with open(user_file, 'r', encoding='utf-8') as f:
                        profile_data = json.load(f)
                        if not profile_data.get("boxPositions"):
                            profile_data["boxPositions"] = DEFAULT_BOX_POSITIONS
                        if not profile_data.get("progress"):
                            profile_data["progress"] = DEFAULT_PROGRESS
                except Exception as e:
                    profile_data = {"username": username, "boxPositions": DEFAULT_BOX_POSITIONS, "settings": {}, "progress": DEFAULT_PROGRESS}
            else:
                profile_data = {
                    "username": username,
                    "boxPositions": DEFAULT_BOX_POSITIONS,
                    "settings": {"controls": "mouse_follow", "maxSpeed": 500},
                    "progress": DEFAULT_PROGRESS
                }

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(profile_data).encode('utf-8'))
            return

        # Handle API Profile List Endpoint
        if parsed_path.path == '/api/profiles':
            profiles = []
            if DATA_DIR.exists():
                for f in DATA_DIR.glob('*.json'):
                    p_name = f.stem
                    p_mission = "Mission 1"
                    try:
                        with open(f, 'r', encoding='utf-8') as pf:
                            p_data = json.load(pf)
                            if p_data.get('username'):
                                p_name = p_data.get('username')
                            prog = p_data.get('progress', {})
                            if isinstance(prog, dict):
                                p_mission = prog.get('currentMission') or prog.get('mission') or f"Mission {prog.get('act', 1)}"
                    except Exception:
                        pass
                    profiles.append({"name": p_name, "mission": p_mission})
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"profiles": profiles}).encode('utf-8'))
            return

        # Fallback to standard static file serving
        return super().do_GET()

    def do_POST(self):
        parsed_path = urllib.parse.urlparse(self.path)
        
        # Handle API Debug Logger Endpoint
        if parsed_path.path == '/api/log':
            content_length = int(self.headers.get('Content-Length', 0))
            post_body = self.rfile.read(content_length)
            try:
                log_data = json.loads(post_body.decode('utf-8'))
                msg = log_data.get('message', '')
                log_str = f"[JS DEBUG] {msg}"
                print(log_str, flush=True)
                with open(BASE_DIR / "server.log", "a", encoding="utf-8") as f:
                    f.write(log_str + "\n")
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(b'{"status":"ok"}')
            except Exception as e:
                self.send_response(400)
                self.end_headers()
            return

        # Handle API Profile Save Endpoint
        if parsed_path.path == '/api/profile':
            content_length = int(self.headers.get('Content-Length', 0))
            post_body = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_body.decode('utf-8'))
                username = str(data.get('username', 'default_user')).strip() or 'default_user'
                user_file = get_user_file(username)
                with open(user_file, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2)
                
                response = {"status": "success", "message": f"Profile saved for {username}", "username": username}
                self.send_response(200)
            except Exception as e:
                response = {"status": "error", "message": str(e)}
                self.send_response(400)
                
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode('utf-8'))
            return

        # Handle API Profile Rename Endpoint
        if parsed_path.path == '/api/rename_profile':
            content_length = int(self.headers.get('Content-Length', 0))
            post_body = self.rfile.read(content_length)
            try:
                data = json.loads(post_body.decode('utf-8'))
                old_user = str(data.get('old_username', '')).strip()
                new_user = str(data.get('new_username', '')).strip()
                
                if old_user and new_user:
                    old_file = get_user_file(old_user)
                    safe_new = "".join(c for c in new_user if c not in r'/\:*?"<>|').strip() or 'default_user'
                    new_file = DATA_DIR / f"{safe_new}.json"
                    
                    if old_file.exists():
                        with open(old_file, 'r', encoding='utf-8') as f:
                            profile_data = json.load(f)
                        profile_data['username'] = new_user
                        with open(new_file, 'w', encoding='utf-8') as f:
                            json.dump(profile_data, f, indent=2)
                        if old_file != new_file and old_file.exists():
                            old_file.unlink()
                        
                        response = {"status": "success", "username": new_user}
                        self.send_response(200)
                    else:
                        response = {"status": "error", "message": "Profile not found"}
                        self.send_response(404)
                else:
                    response = {"status": "error", "message": "Invalid usernames"}
                    self.send_response(400)
            except Exception as e:
                response = {"status": "error", "message": str(e)}
                self.send_response(400)

            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode('utf-8'))
            return

        self.send_error(404, "Endpoint not found")

    def do_DELETE(self):
        parsed_path = urllib.parse.urlparse(self.path)
        
        # Handle API Profile Delete Endpoint
        if parsed_path.path == '/api/profile':
            query_params = urllib.parse.parse_qs(parsed_path.query)
            username = query_params.get('user', [''])[0].strip()
            
            if username:
                user_file = get_user_file(username)
                if user_file.exists():
                    user_file.unlink()
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(b'{"status":"success"}')
                return
        
        self.send_error(404, "Endpoint not found")

class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True

def run_server():
    os.chdir(BASE_DIR)
    for attempt in range(5):
        try:
            with ReusableTCPServer(("", PORT), AstraGameRequestHandler) as httpd:
                print(f"[Solaris Horizon Server] Online & serving at http://localhost:{PORT}", flush=True)
                httpd.serve_forever()
                break
        except OSError as e:
            if attempt < 4:
                import time
                print(f"[Solaris Horizon Server] Port {PORT} busy, retrying in 1s ({attempt + 1}/5)...", flush=True)
                time.sleep(1)
            else:
                print(f"[Solaris Horizon Server] Port error: {e}", flush=True)
                raise e
        except Exception as e:
            print(f"[Solaris Horizon Server] Fatal error: {e}", flush=True)
            break

if __name__ == '__main__':
    run_server()
