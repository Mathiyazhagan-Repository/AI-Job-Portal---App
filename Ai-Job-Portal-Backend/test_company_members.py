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
    data = json.dumps(body).encode() if body is not None else None
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as exc:
        print(f"Error {path}: {exc.code} {exc.reason}")
        print(exc.read().decode(errors="replace"))
        return None
    except Exception as exc:
        print(f"Error {path}: {exc}")
        return None

# Find all auto recruiters
auto_recruiters = _rest("GET", "/recruiters?email=like.auto-%")
if auto_recruiters:
    print(f"Found {len(auto_recruiters)} auto recruiters.")
    for r in auto_recruiters:
        print(r["id"], r["email"])
else:
    print("No auto recruiters found.")
