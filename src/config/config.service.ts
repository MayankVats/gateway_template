import { Injectable } from '@nestjs/common';

interface ConfigData {
  ENV: string;
  PORT: number;
  DATABASE_URL: string;
}

@Injectable()
export class ConfigService {
  private config: ConfigData;

  constructor() {
    this.loadFromEnv();
  }

  public loadFromEnv() {
    this.config = this.parseConfigFromEnv(process.env);
  }

  private parseConfigFromEnv(env: NodeJS.ProcessEnv): ConfigData {
    return {
      ENV: env.NODE_ENV || 'dev',
      PORT: parseInt(env.PORT) || 3000,
      DATABASE_URL: env.DATABASE_URL,
    };
  }

  public get(): Readonly<ConfigData> {
    return this.config;
  }
}
