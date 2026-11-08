import subprocess
import sys
from datetime import datetime


def run(script):
    print("running", script)
    result = subprocess.run([sys.executable, script])
    if result.returncode != 0:
        print("stopped because", script, "failed")
        sys.exit(1)


print("start", datetime.now().isoformat(timespec="seconds"))
run("make_data.py")
run("load_data.py")
run("check_kpis.py")
run("export_data.py")
run("weekly_summary.py")
print("done", datetime.now().isoformat(timespec="seconds"))