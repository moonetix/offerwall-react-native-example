// Talks to YOUR server only. The app never calls api.moonetix.com itself,
// because creating a session needs the API key.

export type Reward = {
  offer: string;
  reward: string;
  status: 'credited' | 'reversed';
  at: string;
};

export type Account = {
  userId: string;
  email: string;
  // Kept as text so decimal rewards like 0.375 show exactly.
  balance: string;
  currency: string;
  history: Reward[];
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string) {
    super(`HTTP ${status}: ${code}`);
    this.status = status;
    this.code = code;
  }

  get signedOut(): boolean {
    return this.status === 401;
  }
}

export class EarnApi {
  private readonly base: string;
  // Your own sign-in credential. Kept in memory in this example; use secure storage
  // (for example expo-secure-store) if you keep users signed in across restarts.
  private authToken: string | null = null;

  constructor(baseUrl: string) {
    this.base = baseUrl.replace(/\/+$/, '');
  }

  get signedIn(): boolean {
    return this.authToken !== null;
  }

  async register(email: string, password: string, over16: boolean): Promise<void> {
    const { token } = await this.send<{ token: string }>('POST', '/api/register', { email, password, over16 });
    this.authToken = token;
  }

  async signIn(email: string, password: string): Promise<void> {
    const { token } = await this.send<{ token: string }>('POST', '/api/login', { email, password });
    this.authToken = token;
  }

  async signOut(): Promise<void> {
    try {
      await this.send('POST', '/api/logout');
    } finally {
      this.authToken = null;
    }
  }

  me(): Promise<Account> {
    return this.send<Account>('GET', '/api/me');
  }

  // Asks YOUR server for a fresh token. Your server calls POST /v1/session with the API key,
  // for the signed-in user only. Never cache it: a token works once and for 10 minutes.
  async fetchMoonetixToken(): Promise<string> {
    const { token } = await this.send<{ token: string }>('POST', '/api/moonetix/session');
    return token;
  }

  private async send<T>(method: string, path: string, body?: object): Promise<T> {
    const headers: Record<string, string> = {};
    if (this.authToken) headers.Authorization = `Bearer ${this.authToken}`;
    if (body) headers['Content-Type'] = 'application/json';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    let res: Response;
    try {
      res = await fetch(this.base + path, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      if (res.status === 401) this.authToken = null;
      throw new ApiError(res.status, typeof data.error === 'string' ? data.error : `http_${res.status}`);
    }
    return data as T;
  }
}
