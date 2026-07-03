import { Injectable } from '@nestjs/common';
import * as path from 'path';
// firebase-admin nạp LƯỜI (dynamic import) — SDK ~40-50MB, chỉ nạp khi thật sự gửi thông báo,
// tránh ngốn RAM lúc khởi động backend trên VPS 2GB. Import type-only nên không kéo runtime vào boot.
import type * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService {
  private app: admin.app.App | null = null;
  private initTried = false;

  /** Khởi tạo Firebase Admin LƯỜI ở lần gửi đầu tiên (thay cho OnModuleInit lúc boot). */
  private async ensureInitialized(): Promise<admin.app.App | null> {
    if (this.app) return this.app;
    if (this.initTried) return this.app; // đã thử và thất bại → khỏi thử lại mỗi lần
    this.initTried = true;

    const adminSdk = await import('firebase-admin');
    if (adminSdk.apps.length) {
      this.app = adminSdk.apps[0] as admin.app.App;
      return this.app;
    }

    let credential: admin.credential.Credential | undefined;

    // 1. Ưu tiên biến môi trường (Production/Vercel)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        credential = adminSdk.credential.cert(serviceAccount);
        console.log('Firebase Admin SDK initialized from Environment Variable');
      } catch (error) {
        console.error('Error parsing FIREBASE_SERVICE_ACCOUNT env var:', error);
      }
    }

    // 2. Fallback file cục bộ (Development)
    if (!credential) {
      try {
        const serviceAccountPath = path.join(process.cwd(), 'config', 'kinhlacgiaminh-firebase-adminsdk-fbsvc-8908aedf5c.json');
        credential = adminSdk.credential.cert(serviceAccountPath);
        console.log('Firebase Admin SDK initialized from local file');
      } catch {
        console.warn('Firebase config file not found, and no environment variable provided.');
      }
    }

    if (credential) {
      this.app = adminSdk.initializeApp({ credential });
    }
    return this.app;
  }

  async sendNotification(token: string, title: string, body: string, data?: any) {
    if (!token) return;

    const app = await this.ensureInitialized();
    if (!app) return; // chưa cấu hình Firebase → bỏ qua an toàn

    const message = {
      notification: { title, body },
      data: data || {},
      token,
    };

    try {
      const response = await app.messaging().send(message);
      console.log('Successfully sent message:', response);
      return response;
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }
}
