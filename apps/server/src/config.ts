import dotenv from 'dotenv';
import path from 'path';

// Load .env file
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  jwtSecret: process.env.JWT_SECRET || 'nebula_jwt_hyper_secure_quantum_signature_2046_key',
  sessionSecret: process.env.SESSION_SECRET || 'nebula_session_encryption_seed_orbit_alpha_9',
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  uploadDir: path.resolve(process.cwd(), process.env.UPLOAD_DIR || './uploads'),
  maxFileSize: 50 * 1024 * 1024, // 50MB
  stunServerUrl: process.env.STUN_SERVER_URL || 'stun:stun.l.google.com:19302',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  aiModel: process.env.AI_MODEL || 'gpt-4o',
};
