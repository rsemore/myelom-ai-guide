declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test'
      PORT?: string,
      OPENAI_BASE_URL: string,
      OPENAI_API_KEY: string,
      DATABASE_URL: string,
      KNOWLEDGE_BASE_PATH: string,
      COOKIE_SECRET: string,
      JWT_SECRET: string,
    }
  }
}
