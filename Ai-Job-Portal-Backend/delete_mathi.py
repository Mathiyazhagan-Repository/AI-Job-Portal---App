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

# Get the ID first from profiles
p = _rest("GET", f"/profiles?email=eq.{encoded}")
user_id = None
if p and isinstance(p, list) and len(p) > 0:
    user_id = p[0].get("id")

if not user_id:
    # try Candidates
    c = _rest("GET", f"/Candidates?email=eq.{encoded}")
    if c and isinstance(c, list) and len(c) > 0:
        user_id = c[0].get("id")

if user_id:
    print(f"Deleting user {user_id}...")
    _rest("DELETE", f"/company_members?user_id=eq.{user_id}")
    _rest("DELETE", f"/companies?recruiter_id=eq.{user_id}")
    _rest("DELETE", f"/recruiters?id=eq.{user_id}")
    _rest("DELETE", f"/Candidates?id=eq.{user_id}")
    _rest("DELETE", f"/profiles?id=eq.{user_id}")
    print("Done deleting mathi@gmail.com.")
else:
    print("mathi@gmail.com not found anywhere.")

