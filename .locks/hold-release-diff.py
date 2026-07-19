import fcntl, time, os
from pathlib import Path
p = Path("/Users/kurrytran/frontend-repository/.harden-locks/frontend-data-tracking-release-diff.lock")
f = open(p, "a+")
fcntl.flock(f.fileno(), fcntl.LOCK_EX)
f.seek(0); f.truncate(); f.write("owned=api-schema-revisit\nslug=frontend-data-tracking-release-diff\npid=%d\n" % os.getpid()); f.flush()
print("HOLDING", os.getpid(), flush=True)
while True:
    time.sleep(3600)
