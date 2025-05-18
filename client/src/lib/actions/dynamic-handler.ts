import { 
  ActionHandler, 
  ActionHandlerConfig,
  ActionHandlerMetadata
} from './types';
import { SafeHandler } from './handlers/safe-handler';

/**
 * Create a dynamic action handler from code string
 * 
 * This function allows the creation of handlers from code received from the backend.
 * It includes safeguards to prevent harmful code execution.
 */
export async function createDynamicHandler(
  type: string,
  code: string,
  config: ActionHandlerConfig
): Promise<ActionHandler> {
  if (!code || typeof code !== 'string') {
    throw new Error('Invalid code provided for dynamic handler');
  }
  
  try {
    // First, check if the code is encrypted and decrypt if necessary
    const processedCode = await processHandlerCode(code, config);
    
    // Create a handler using the processed code
    const handlerClass = new Function(`
      "use strict";
      // Provide a limited set of utilities to prevent harmful code
      const console = { 
        log: console.log, 
        warn: console.warn,
        error: console.error
      };
      
      // No access to global objects like window, document, etc.
      // No access to setTimeout, setInterval, etc.
      
      return ${processedCode};
    `)();
    
    // Check if the result is a valid class/constructor
    if (typeof handlerClass !== 'function') {
      throw new Error('Dynamic code did not return a valid handler constructor');
    }
    
    // Create an instance
    const handler = new handlerClass(config);
    
    // Validate that it implements the ActionHandler interface
    if (!isValidActionHandler(handler)) {
      throw new Error('Dynamic handler does not implement the ActionHandler interface');
    }
    
    // Ensure the handler has proper metadata with the current type
    const currentMetadata = handler.getMetadata();
    if (currentMetadata.type !== type) {
      const updatedMetadata: ActionHandlerMetadata = {
        ...currentMetadata,
        type
      };
      
      // Update the handler's configuration with correct metadata
      handler.updateConfig({
        ...config,
        metadata: updatedMetadata
      });
    }
    
    return handler;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to create dynamic handler for ${type}: ${errorMessage}`);
    throw error;
  }
}

/**
 * Process handler code before execution
 * This can include decryption, validation, or other transformations
 */
async function processHandlerCode(code: string, config: ActionHandlerConfig): Promise<string> {
  // Check if code needs decryption
  if (code.startsWith('ENCRYPTED:')) {
    // In a real app, you would decrypt the code here
    // For example with a library like CryptoJS
    // This is a placeholder for actual decryption logic
    
    const encryptedCode = code.substring('ENCRYPTED:'.length);
    return decryptHandlerCode(encryptedCode, config.customCode || 'defaultKey');
  }
  
  // Sanitize code - basic check for harmful patterns
  const hasHarmfulPatterns = [
    /eval\s*\(/,
    /Function\s*\(/,
    /setTimeout\s*\(/,
    /setInterval\s*\(/,
    /new\s+Worker\s*\(/,
    /document\.write/,
    /localStorage\./,
    /sessionStorage\./,
    /indexedDB\./,
    /fetch\s*\(/,
    /XMLHttpRequest/,
    /WebSocket/,
    /navigator\./,
    /window\./,
    /document\./,
    /location\./
  ].some(pattern => pattern.test(code));
  
  if (hasHarmfulPatterns) {
    throw new Error('Code contains potentially harmful patterns');
  }
  
  // Code is already in plain text, just return it
  return code;
}

/**
 * Decrypt encrypted code
 */
export function decryptHandlerCode(encryptedCode: string, key: string): string {
  // This is a placeholder for actual decryption logic
  // In a real implementation, you would use a library like CryptoJS
  
  // Example implementation:
  // const bytes = CryptoJS.AES.decrypt(encryptedCode, key);
  // return bytes.toString(CryptoJS.enc.Utf8);
  
  // For demo, just return the code as-is
  return encryptedCode;
}

/**
 * Verify if an object implements the ActionHandler interface
 */
function isValidActionHandler(obj: any): obj is ActionHandler {
  return (
    obj &&
    typeof obj.execute === 'function' &&
    typeof obj.getMetadata === 'function' &&
    typeof obj.updateConfig === 'function'
  );
} 