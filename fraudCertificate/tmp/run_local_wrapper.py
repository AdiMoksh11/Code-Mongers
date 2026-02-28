import requests
import os
import subprocess

ROOT = os.path.dirname(os.path.dirname(__file__))
url = 'https://ik.imagekit.io/wl9xamwdr/credexa/credential_1759248681882_pDRMtbYmx'
resp = requests.get(url, stream=True)
if resp.status_code != 200:
    print('Download failed', resp.status_code)
    raise SystemExit(1)

tmp = os.path.join(ROOT, 'tmp_test_img.png')
with open(tmp, 'wb') as f:
    for chunk in resp.iter_content(1024):
        f.write(chunk)

print('Downloaded to', tmp)
proc = subprocess.run(['python', os.path.join(ROOT, 'run_predict_single.py'), '--image', tmp], capture_output=True, text=True, cwd=ROOT)
print('Return code:', proc.returncode)
print('STDOUT:', proc.stdout[:1000])
print('STDERR:', proc.stderr[:1000])
