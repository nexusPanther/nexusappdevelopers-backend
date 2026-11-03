declare module "ioredis" {
  export interface RedisOptions {
    host?: string;
    port?: number;
    password?: string;
    lazyConnect?: boolean;
    maxRetriesPerRequest?: number | null;
    retryStrategy?: (times: number) => number | null;
    [key: string]: any;
  }

  export default class Redis {
    constructor(options?: RedisOptions);
    constructor(url: string, options?: RedisOptions);
    status: string;
    on(event: string, listener: (...args: any[]) => void): this;
    connect(): Promise<void>;
    get(key: string): Promise<string | null>;
    set(key: string, value: string, mode?: string, duration?: number): Promise<any>;
    del(...keys: string[]): Promise<number>;
    keys(pattern: string): Promise<string[]>;
    ttl(key: string): Promise<number>;
    dbsize(): Promise<number>;
    info(section?: string): Promise<string>;
    flushdb(): Promise<string>;
    flushall(): Promise<string>;
    disconnect(): void;
    quit(): Promise<string>;
  }
}

