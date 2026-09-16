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
        return None
    except Exception as exc:
        print(f"Error {path}: {exc}")
        return None

print("Fetching active companies from company_members...")
members = _rest("GET", "/company_members?select=*")
active_company_ids = set()
for m in members or []:
    active_company_ids.add(m.get("company_id"))

print("Fetching all companies...")
companies = _rest("GET", "/companies?select=*")
active_recruiter_ids = set()

deleted_companies = 0
for c in companies or []:
    if c.get("id") in active_company_ids:
        active_recruiter_ids.add(c.get("recruiter_id"))
    else:
        # If it's an Auto company and not active, delete it
        if "Auto" in c.get("name", ""):
            print(f"Deleting unused company: {c.get('name')} {c.get('id')}")
            _rest("DELETE", f"/companies?id=eq.{c['id']}")
            deleted_companies += 1

print(f"Deleted {deleted_companies} unused companies.")

print("Fetching all recruiters...")
recruiters = _rest("GET", "/recruiters?select=*")

deleted_recruiters = 0
for r in recruiters or []:
    if r.get("id") not in active_recruiter_ids:
        # If it's an auto recruiter and not linked to an active company, delete it
        if r.get("email", "").startswith("auto-"):
            print(f"Deleting unused auto recruiter: {r.get('email')} {r.get('id')}")
            _rest("DELETE", f"/recruiters?id=eq.{r['id']}")
            deleted_recruiters += 1

print(f"Deleted {deleted_recruiters} unused auto recruiters.")
