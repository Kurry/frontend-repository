import fcntl, time
from pathlib import Path
p = Path("/Users/kurrytran/frontend-repository/.harden-locks/frontend-landing-readymag.lock")
f = p.open("w")
fcntl.flock(f.fileno(), fcntl.LOCK_EX)
f.write(str(59660))
f.flush()
while True:
    time.sleep(3600)
