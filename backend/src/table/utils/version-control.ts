import * as semver from 'semver';
import * as crypto from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Utility for version control and code encryption for handlers
 */
@Injectable()
export class VersionControlUtil {
  private readonly SECRET_KEY: string;
  
  constructor(private configService: ConfigService) {
    this.SECRET_KEY = this.configService.get<string>('HANDLER_ENCRYPTION_KEY', 'default-dev-secret-key');
  }

  /**
   * Compare handler versions to determine if update is needed
   */
  isUpdateNeeded(currentVersion: string, newVersion: string): boolean {
    if (!currentVersion || !newVersion) {
      return true;
    }
    
    try {
      return semver.gt(newVersion, currentVersion);
    } catch (error) {
      // If semver comparison fails, assume update is needed
      console.error('Version comparison error:', error);
      return true;
    }
  }
  
  /**
   * Generate a new semantic version based on change type
   * @param currentVersion Current version string
   * @param changeType 'major' | 'minor' | 'patch'
   */
  generateNewVersion(currentVersion: string, changeType: 'major' | 'minor' | 'patch' = 'patch'): string {
    if (!currentVersion) {
      return '1.0.0';
    }
    
    try {
      const newVersion = semver.inc(currentVersion, changeType);
      return newVersion || '1.0.0';
    } catch (error) {
      console.error('Version increment error:', error);
      return '1.0.0';
    }
  }
  
  /**
   * Encrypt handler code for secure storage
   */
  encryptCode(code: string): string {
    if (!code) return '';
    
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(
        'aes-256-cbc', 
        Buffer.from(this.SECRET_KEY.padEnd(32).slice(0, 32)), 
        iv
      );
      
      let encrypted = cipher.update(code, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      
      // Store IV with encrypted data for decryption
      return `${iv.toString('hex')}:${encrypted}`;
    } catch (error) {
      console.error('Encryption error:', error);
      return '';
    }
  }
  
  /**
   * Decrypt handler code for execution
   */
  decryptCode(encryptedCode: string): string {
    if (!encryptedCode) return '';
    
    try {
      // Check if code is encrypted (has format iv:data)
      if (!encryptedCode.includes(':')) {
        return encryptedCode; // Not encrypted
      }
      
      const [ivHex, data] = encryptedCode.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipheriv(
        'aes-256-cbc', 
        Buffer.from(this.SECRET_KEY.padEnd(32).slice(0, 32)), 
        iv
      );
      
      let decrypted = decipher.update(data, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      return '';
    }
  }
} 