import urllib.request, urllib.error, json, time

BASE = 'http://127.0.0.1:8000/api'
TABLES = [
    'utilisateurs','clients','personnel','soins','fiches_suivi','fiches_seances',
    'rendezvous','abonnements','paiements','transactions','stocks','mouvements_stock'
]

def req(method, path, payload=None):
    url = BASE + path
    data = None
    headers = {}
    if payload is not None:
        data = json.dumps(payload).encode('utf-8')
        headers['Content-Type'] = 'application/json'
    r = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r, timeout=10) as resp:
            body = resp.read().decode('utf-8')
            if body:
                return resp.getcode(), json.loads(body)
            return resp.getcode(), None
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode('utf-8'))
        except Exception:
            return e.code, None
    except Exception as e:
        print('Request error', e)
        return None, None

def now_iso():
    return time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())

def main():
    ok = True
    for t in TABLES:
        print('Testing table', t)
        tid = f'test-{t}'
        payload = {'id': tid, 'created_at': now_iso(), 'updated_at': now_iso(), 'note': 'automated test'}
        code, body = req('POST', f'/{t}/', payload)
        print(' POST', code)
        if code not in (200,201): ok = False

        code, body = req('GET', f'/{t}/')
        print(' LIST', code, 'items=', len(body) if isinstance(body, list) else '??')
        if code != 200: ok = False

        code, body = req('GET', f'/{t}/{tid}/')
        print(' GET', code)
        if code != 200: ok = False

        payload2 = {'note': 'updated-'+now_iso(), 'updated_at': now_iso()}
        code, body = req('PUT', f'/{t}/{tid}/', payload2)
        print(' PUT', code)
        if code != 200: ok = False

        code, body = req('DELETE', f'/{t}/{tid}/')
        print(' DELETE', code)
        if code != 200: ok = False

    # export
    code, body = req('GET', '/_export')
    print('EXPORT', code, type(body))
    if code != 200 or not isinstance(body, dict): ok = False

    code, body = req('GET', '/_backups')
    print('BACKUPS', code, body)

    print('Overall ok:', ok)
    return 0 if ok else 2

if __name__ == '__main__':
    raise SystemExit(main())
