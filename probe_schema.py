import json, urllib.request

env = {}
for line in open(r'f:\AI Job Portal\Ai-Job-Portal-Backend\Backend\.env', encoding='utf-8'):
    if '=' in line and not line.strip().startswith('#'):
        k, v = line.strip().split('=', 1)
        env[k] = v
base = env['SUPABASE_URL']
key = env['SUPABASE_SERVICE_ROLE_KEY']
for table in ['profiles', 'candidates', 'jobs', 'saved_jobs', 'applications', 'interviews', 'resumes', 'looking_for']:
    url = f'{base}/rest/v1/{table}?select=* &limit=3'
    req = urllib.request.Request(url, headers={'apikey': key, 'Authorization': f'Bearer {key}'}, method='GET')
    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            rows = json.loads(r.read().decode('utf-8', 'replace'))
            print(f'TABLE {table} STATUS {r.status} TYPE {type(rows).__name__}')
            if isinstance(rows, list):
                print(json.dumps(rows[0], default=str)[:600] if rows else '[]')
    except Exception as e:
        print(f'TABLE {table} ERR {type(e).__name__}: {e}')
