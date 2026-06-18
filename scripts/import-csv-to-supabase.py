#!/usr/bin/env python3
"""Import historical CSV test data into Supabase."""
import csv, json, os, sys
from urllib.request import Request, urlopen
from urllib.error import HTTPError

SUPABASE_URL = "https://qpaefxemqkuyycotytak.supabase.co"
API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwYWVmeGVtcWt1eXljb3R5dGFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MzQ5OTUsImV4cCI6MjA5NzExMDk5NX0.IGBZr2FEZD2VD1QNp4cgCPf5XSbI1ERkBESKeqsi5aw"
CSV_DIR = "/home/xd/Project/AdQuest-Verified-Attention/archive/tests"

# Developer user_ids to exclude
DEV_IDS = {'68e712dc-84d', 'bbdab2dc-424', 'e50c9ff6-a71', '807f66c1-300'}

def is_dev(uid):
    return any(uid.startswith(d) for d in DEV_IDS)

def supa_insert(table, rows):
    """Insert rows into Supabase table."""
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    data = json.dumps(rows).encode()
    req = Request(url, data=data, method='POST')
    req.add_header('apikey', API_KEY)
    req.add_header('Authorization', f'Bearer {API_KEY}')
    req.add_header('Content-Type', 'application/json')
    req.add_header('Prefer', 'return=minimal')
    try:
        resp = urlopen(req)
        return True, resp.status
    except HTTPError as e:
        body = e.read().decode()
        return False, body

def parse_csv_events(fname):
    """Parse CSV and group by session."""
    sessions = {}
    with open(fname) as f:
        for row in csv.DictReader(f):
            uid = row.get('user_id', '')
            if is_dev(uid):
                continue
            sid = row.get('session_id', '')
            if not sid:
                continue
            if sid not in sessions:
                sessions[sid] = {
                    'user_id': uid,
                    'created_at': row.get('created_at', ''),
                    'events': [],
                    'referrer': 'archive_import',
                    'device': {}
                }
            sessions[sid]['events'].append({
                'event_type': row.get('event_type', ''),
                'metadata': row.get('metadata', row.get('behavior_metrics', '{}')),
                'experiment_group': row.get('experiment_group', ''),
            })
    return sessions

def event_type_to_phase(et):
    """Map CSV event_type to Supabase phase."""
    mapping = {
        'page_view': 'primer',
        'click_video': 'video',
        'video_buffering': 'video',
        'video_challenge_shown': 'challenge',
        'video_failed_attempt': 'challenge',
        'complete_video': 'reward',
        'video_abandon': 'video_abandon',
        'click_timer': 'primer',
        'complete_timer': 'reward',
        'copy_config': 'conversion',
        'copy_config_success': 'conversion',
        'conversion_video_complete': 'reward',
        'conversion_direct_click': 'conversion',
        'conversion_wait_complete': 'reward',
    }
    return mapping.get(et, et)

def build_session_row(sid, sdata):
    """Build a Supabase session row from CSV data."""
    return {
        'id': sid,
        'user_id': sdata['user_id'],
        'created_at': sdata['created_at'],
        'referrer': sdata['referrer'],
        'device': sdata['device'],
        'input_method': 'unknown'
    }

def build_event_rows(sid, sdata):
    """Build Supabase attention_events rows from CSV events."""
    rows = []
    for evt in sdata['events']:
        phase = event_type_to_phase(evt['event_type'])
        try:
            meta = json.loads(evt['metadata']) if evt['metadata'] else {}
        except:
            meta = {}

        row = {
            'session_id': sid,
            'created_at': sdata['created_at'],
            'phase': phase,
            'was_correct': None,
            'hint_used': False,
            'challenge_attempts': meta.get('attempts', 0),
            'tab_visible_time_ms': 0,
        }

        # Extract time_on_page if available
        top = meta.get('time_on_page_sec', meta.get('time_on_page', 0))
        if top:
            row['challenge_duration_ms'] = int(top * 1000)

        rows.append(row)
    return rows

# Process all CSV files
all_sessions = {}
for fname in ['test-01_rows.csv', 'test-02_rows.csv', 'ab_test_logs_rows.csv']:
    fpath = os.path.join(CSV_DIR, fname)
    if not os.path.exists(fpath):
        print(f"Skip: {fname} not found")
        continue
    sessions = parse_csv_events(fpath)
    print(f"{fname}: {len(sessions)} real sessions")
    all_sessions.update(sessions)

print(f"\nTotal unique sessions to import: {len(all_sessions)}")

# Check what's already in Supabase
check_url = f"{SUPABASE_URL}/rest/v1/sessions?select=id"
req = Request(check_url)
req.add_header('apikey', API_KEY)
req.add_header('Authorization', f'Bearer {API_KEY}')
resp = urlopen(req)
existing = {s['id'] for s in json.loads(resp.read())}
print(f"Already in Supabase: {len(existing)} sessions")

# Filter out already-imported
to_import = {sid: s for sid, s in all_sessions.items() if sid not in existing}
print(f"New sessions to import: {len(to_import)}")

# Import in batches
BATCH = 50
session_rows = [build_session_row(sid, s) for sid, s in to_import.items()]
event_rows = []
for sid, s in to_import.items():
    event_rows.extend(build_event_rows(sid, s))

print(f"Session rows: {len(session_rows)}")
print(f"Event rows: {len(event_rows)}")

# Insert sessions
imported_sessions = 0
for i in range(0, len(session_rows), BATCH):
    batch = session_rows[i:i+BATCH]
    ok, status = supa_insert('sessions', batch)
    if ok:
        imported_sessions += len(batch)
        print(f"  Sessions: {imported_sessions}/{len(session_rows)} OK")
    else:
        print(f"  Sessions batch error: {status[:200]}")

# Insert events
imported_events = 0
for i in range(0, len(event_rows), BATCH):
    batch = event_rows[i:i+BATCH]
    ok, status = supa_insert('attention_events', batch)
    if ok:
        imported_events += len(batch)
        print(f"  Events: {imported_events}/{len(event_rows)} OK")
    else:
        print(f"  Events batch error: {status[:200]}")

print(f"\nDone! Imported {imported_sessions} sessions, {imported_events} events")
