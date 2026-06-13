import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Request, Response } from 'express';
import { AppModule } from '../src/app.module';
import { LoggingInterceptor } from '../src/middlewares/logging.interceptor';

const vercelRegex = /^https?:\/\/([a-z0-9-]+\.)?vercel\.app$/i;
let cachedApp: any;

async function bootstrap() {
  if (!cachedApp) {
    const app = await NestFactory.create(AppModule);
    app.enableCors(); // Already handled by vercel.json, but keep for safety
    app.useGlobalInterceptors(new LoggingInterceptor());
    await app.init();
    cachedApp = app.getHttpAdapter().getInstance();
  }
  return cachedApp;
}

export default async (req: Request, res: Response) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // Health check or static requests: return immediately to SAVE database connections
  if (req.url === '/' || req.url?.includes('favicon')) {
    res.status(200).send('Backend is running');
    return;
  }

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const app = await bootstrap();
    return app(req, res);
  } catch (err) {
    console.error('Error in bootstrap:', err);
    res.status(500).json({ 
      message: 'Internal Server Error', 
      error: err instanceof Error ? err.message : String(err) 
    });
  }
};
