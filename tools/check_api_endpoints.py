#!/usr/bin/env python3
import urllib.request, json
endpoints = ['clients','soins','fiches_suivi','rendezvous']
for p in endpoints:
    url = f'http://127.0.0.1:8000/api/{p}/'
    try:
        with urllib.request.urlopen(url, timeout=5) as r:
            data = json.load(r)
            print(f'OK:{p}:count={len(data)}')
    except Exception as e:
        print(f'ERR:{p}:{e}')
