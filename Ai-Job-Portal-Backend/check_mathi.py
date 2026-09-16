import os
import urllib.request
import urllib.parse
import json
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join("Backend", ".env"))

supabase_url = os.getenv("SUPABASE_URL")
service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
rest_base = f"{supabase_url}/rest/v1"

def _rest(method, path, body=None):
    url = f"{rest_base}{path}"
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    req = urllib.request.Request(url, data=json.dumps(body).encode() if body else None, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read()
            return json.loads(raw) if raw else None
    except Exception as e:
        print(f"Error {path}: {e}")
        return None

email = "mathi@gmail.com"
encoded = urllib.parse.quote(email, safe="")

print("--- Profiles ---")
p = _rest("GET", f"/profiles?email=eq.{encoded}")
print(json.dumps(p, indent=2))

print("\n--- Candidates ---")
c = _rest("GET", f"/Candidates?email=eq.{encoded}")
print(json.dumps(c, indent=2))

print("\n--- Recruiters ---")
# recruiters might use auth users id or email, but recruiters table usually doesn't have email in this DB? Wait, my earlier script did `email=like.auto-%` so it does.
r = _rest("GET", f"/recruiters?email=eq.{encoded}")
print(json.dumps(r, indent=2))
