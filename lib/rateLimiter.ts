export class RateLimiter {
  private capacity: number;
  private refillMs: number;
  private tokens: number;
  private queue: Array<{
    fn: () => Promise<any>;
    resolve: (v: any) => void;
    reject: (e: any) => void;
  }>;
  private intervalId?: NodeJS.Timeout;

  constructor(maxRequests: number, perMilliseconds: number) {
    this.capacity = maxRequests;
    this.refillMs = perMilliseconds;
    this.tokens = maxRequests;
    this.queue = [];
    // refill tokens periodically
    this.intervalId = setInterval(() => {
      this.tokens = this.capacity;
      this.processQueue();
    }, this.refillMs);
  }

  private processQueue() {
    while (this.tokens > 0 && this.queue.length > 0) {
      const item = this.queue.shift()!;
      this.tokens--;
      item
        .fn()
        .then(item.resolve)
        .catch(item.reject);
    }
  }

  schedule<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      // try to process immediately if tokens available
      this.processQueue();
    });
  }

  stop() {
    if (this.intervalId) clearInterval(this.intervalId);
  }
}

// convenience wrapper (example: 5 requests per second)
const defaultLimiter = new RateLimiter(9, 1000*60);

export function rateLimitedFetch(...options: Parameters<typeof fetch>) {
  console.log('rateLimitedFetch called for url:', ...options);
  return defaultLimiter.schedule(() => fetch(...options));
}