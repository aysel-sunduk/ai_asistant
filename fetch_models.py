import urllib.request
import json
import os

try:
    req = urllib.request.Request("https://openrouter.ai/api/v1/models", headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        free_models = [m['id'] for m in data['data'] if m['id'].endswith(':free')]
        # Sort them by some criteria or just take the first few
        print("\n".join(free_models))
except Exception as e:
    print(f"Error: {e}")
