import { redis } from '@/lib/redis';
import { NextResponse } from 'next/server';

const SCRIPTS_KEY = 'table-scripts';

type Script = {
  id: string;
  script: string;
  tableName: string;
  createdAt: string;
};

export async function POST(request: Request) {
  try {
    const { script, tableName } = await request.json();

    if (!script || !tableName) {
      return NextResponse.json(
        { success: false, error: 'Script and table name are required' },
        { status: 400 }
      );
    }

    // Get existing scripts
    const existingScripts = await redis.get<Script[]>(SCRIPTS_KEY) || [];

    // Create new script entry
    const newScript: Script = {
      id: Date.now().toString(),
      script,
      tableName,
      createdAt: new Date().toISOString(),
    };

    // Add new script to array
    const updatedScripts = [...existingScripts, newScript];
    const result = await redis.set(SCRIPTS_KEY, updatedScripts);
    
    if (result !== 'OK') {
      throw new Error('Failed to save to Redis');
    }

    return NextResponse.json({ success: true, script: newScript });
  } catch (error) {
    console.error('Error saving script:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to save script'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const scripts = await redis.get<Script[]>(SCRIPTS_KEY) || [];
    return NextResponse.json({ success: true, scripts });
  } catch (error) {
    console.error('Error fetching scripts:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch scripts'
      },
      { status: 500 }
    );
  }
}
