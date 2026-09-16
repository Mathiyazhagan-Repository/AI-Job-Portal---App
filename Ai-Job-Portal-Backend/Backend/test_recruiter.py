import os
from app.looking_for import _config
from app.recruiter import _get_recruiter_company
url, key, rest_base = _config()
# Get a recruiter id
from app.looking_for import _rest
profiles = _rest("GET", "/profiles?role=eq.recruiter", rest_base=rest_base, service_key=key)
if profiles:
    rid = profiles[0]["id"]
    print("Testing recruiter_id:", rid)
    cid = _get_recruiter_company(rid, rest_base, key)
    print("Returned company_id:", cid)
    
    # Check if they are in company_members
    members = _rest("GET", f"/company_members?user_id=eq.{rid}", rest_base=rest_base, service_key=key)
    print("Members:", members)
