
import fcntl, time, os
from pathlib import Path
p = Path("/Users/kurrytran/frontend-repository/.harden-locks/frontend-productivity-loopdaily.lock")
f = open(p, "a+")
fcntl.flock(f.fileno(), fcntl.LOCK_EX)
f.seek(0); f.truncate(); f.write("owned=8210006b\nslug=frontend-productivity-loopdaily\npid=%d\n" % os.getpid()); f.flush()
print("HOLDING", os.getpid(), flush=True)
while True:
    time.sleep(3600)
