import http.server
import socketserver
import json
import os
import urllib.parse
from pathlib import Path

PORT = 8088
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data" / "users"

# Ensure user data directory exists
DATA_DIR.mkdir(parents=True, exist_ok=True)

class AstraGameRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS for local testing if needed
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)
        
        # Handle API Profile Load Endpoint
        if parsed_path.path == '/api/profile':
            query_params = urllib.parse.parse_qs(parsed_path.query)
            username = query_params.get('user', ['default_user'])[0]
            # Sanitize username
            clean_username = "".join(c for c in username if c.isalnum() or c in ('_', '-')).lower() or 'default_user'
            
            user_file = DATA_DIR / f"{clean_username}.json"
            
            if user_file.exists():
                try:
                    with open(user_file, 'r', encoding='utf-8') as f:
                        profile_data = json.load(f)
                except Exception as e:
                    profile_data = {"username": clean_username, "boxPositions": {}, "settings": {}, "progress": {}}
            else:
                profile_data = {
                    "username": clean_username,
                    "boxPositions": {},
                    "settings": {"controls": "mouse_follow", "maxSpeed": 500},
                    "progress": {"act": 1, "sector": "SOL OUTER RIM"}
                }

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(profile_data).encode('utf-8'))
            return

        # Fallback to standard static file serving
        return super().do_GET()

    def do_POST(self):
        parsed_path = urllib.parse.urlparse(self.path)
        
        # Handle API Profile Save Endpoint
        if parsed_path.path == '/api/profile':
            content_length = int(self.headers.get('Content-Length', 0))
            post_body = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_body.decode('utf-8'))
                username = data.get('username', 'default_user')
                clean_username = "".join(c for c in username if c.isalnum() or c in ('_', '-')).lower() or 'default_user'
                
                user_file = DATA_DIR / f"{clean_username}.json"
                with open(user_file, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2)
                
                response = {"status": "success", "message": f"Profile saved for {clean_username}", "username": clean_username}
                self.send_response(200)
            except Exception as e:
                response = {"status": "error", "message": str(e)}
                self.send_response(400)
                
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode('utf-8'))
            return

        self.send_error(404, "Endpoint not found")

def run_server():
    os.chdir(BASE_DIR)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), AstraGameRequestHandler) as httpd:
        print(f"[Solaris Horizon Server] Online & serving at http://localhost:{PORT}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[Solaris Horizon Server] Shutting down...")
            httpd.server_close()

if __name__ == '__main__':
    run_server()
