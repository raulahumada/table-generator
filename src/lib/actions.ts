'use server';

import { redis } from './redis';

export type SaveScriptResponse = {
  success: boolean;
  id?: string;
  error?: string;
};

export async function saveScript(script: string): Promise<SaveScriptResponse> {
  'use server';
  
  if (!script) {
    return { success: false, error: 'No script provided' };
  }

  try {
    const scriptId = `script:${Date.now()}`;
    const result = await redis.set(scriptId, script);
    
    if (result !== 'OK') {
      throw new Error('Failed to save to Redis');
    }

    return { success: true, id: scriptId };
  } catch (error) {
    console.error('Error saving script:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to save script'
    };
  }
}
