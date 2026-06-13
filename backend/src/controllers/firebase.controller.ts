import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as path from 'path';

@Injectable()
export class FirebaseService implements OnModuleInit {
  onModuleInit() {
    if (!admin.apps.length) {
      let credential;

      // 1. Try to load from Environment Variable (for Production/Vercel)
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
          const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
          credential = admin.credential.cert(serviceAccount);
          console.log('Firebase Admin SDK initialized from Environment Variable');
        } catch (error) {
          console.error('Error parsing FIREBASE_SERVICE_ACCOUNT env var:', error);
        }
      }

      // 2. Fallback to local file (for Development)
      if (!credential) {
        try {
          const serviceAccountPath = path.join(process.cwd(), 'config', 'kinhlacgiaminh-firebase-adminsdk-fbsvc-8908aedf5c.json');
          credential = admin.credential.cert(serviceAccountPath);
          console.log('Firebase Admin SDK initialized from local file');
        } catch (error) {
          console.warn('Firebase config file not found, and no environment variable provided.');
        }
      }

      if (credential) {
        admin.initializeApp({
          credential: credential,
        });
      }
    }
  }

  async sendNotification(token: string, title: string, body: string, data?: any) {
    if (!token) return;

    const message = {
      notification: {
        title,
        body,
      },
      data: data || {},
      token,
    };

    try {
      const response = await admin.messaging().send(message);
      console.log('Successfully sent message:', response);
      return response;
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }
}
