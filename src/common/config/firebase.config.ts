import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';

export class FirebaseConfig {
  private static initialized = false;

  static initialize(configService: ConfigService) {
    if (!this.initialized) {
      const serviceAccount = {
        type: 'service_account',
        project_id: configService.get<string>('FIREBASE_PROJECT_ID'),
        private_key_id: configService.get<string>('FIREBASE_PRIVATE_KEY_ID'),
        private_key: configService.get<string>('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
        client_email: configService.get<string>('FIREBASE_CLIENT_EMAIL'),
        client_id: configService.get<string>('FIREBASE_CLIENT_ID'),
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: configService.get<string>('FIREBASE_CLIENT_X509_CERT_URL'),
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      });

      this.initialized = true;
    }
  }

  static getAdmin() {
    return admin;
  }
}
