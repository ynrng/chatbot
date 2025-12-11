# rate_limiter.py
import time
from threading import Lock

class RateLimiter:
    def __init__(self, calls_per_sec):
        self.interval = 1.0 / calls_per_sec
        self.lock = Lock()
        self.last_time = 0.0

    def wait(self):
        with self.lock:
            now = time.time()
            elapsed = now - self.last_time
            if elapsed < self.interval:
                time.sleep(self.interval - elapsed)
            self.last_time = time.time()


# shared instance for whole project
api_rate_limiter = RateLimiter(calls_per_sec=5)

def rate_limited(func):
    def wrapper(*args, **kwargs):
        api_rate_limiter.wait()
        return func(*args, **kwargs)
    return wrapper
