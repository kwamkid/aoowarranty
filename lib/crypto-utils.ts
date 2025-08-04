// lib/crypto-utils.ts
import { createHash } from 'crypto'

/**
 * Hash password using SHA-256
 * ในระบบ production ควรใช้ bcrypt หรือ argon2 แทน
 * แต่ Next.js Edge Runtime ไม่รองรับ bcrypt
 */
export function hashPassword(password: string): string {
  // เพิ่ม salt คงที่ (ในระบบจริงควรเป็น random salt)
  const salt = process.env.PASSWORD_SALT || 'warrantyhub-salt-2024'
  
  // Hash password + salt
  const hash = createHash('sha256')
    .update(password + salt)
    .digest('hex')
  
  return hash
}

/**
 * Verify password
 */
export function verifyPassword(password: string, hashedPassword: string): boolean {
  const hash = hashPassword(password)
  return hash === hashedPassword
}

/**
 * Generate random salt (for future use with bcrypt)
 */
export function generateSalt(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15)
}