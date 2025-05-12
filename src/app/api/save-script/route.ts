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
    const existingScripts = (await redis.get<Script[]>(SCRIPTS_KEY)) || [];

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
        error: error instanceof Error ? error.message : 'Failed to save script',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const scripts = (await redis.get<Script[]>(SCRIPTS_KEY)) || [];
    return NextResponse.json({ success: true, scripts });
  } catch (error) {
    console.error('Error fetching scripts:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch scripts',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Script ID is required' },
        { status: 400 }
      );
    }

    // Get existing scripts
    const existingScripts = (await redis.get<Script[]>(SCRIPTS_KEY)) || [];

    console.log('existingScripts', existingScripts);

    // Filter out the script to delete
    const updatedScripts = existingScripts.filter((script) => script.id !== id);

    console.log('updatedScripts', updatedScripts);

    // Save the updated scripts back to Redis
    const result = await redis.set(SCRIPTS_KEY, updatedScripts);

    if (result !== 'OK') {
      throw new Error('Failed to update Redis');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting script:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to delete script',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { id, script, tableName } = await request.json();

    if (!id || !script || !tableName) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID, script y nombre de tabla son requeridos',
        },
        { status: 400 }
      );
    }

    // Get existing scripts
    const existingScripts = (await redis.get<Script[]>(SCRIPTS_KEY)) || [];

    // Find the script to update
    const scriptIndex = existingScripts.findIndex((s) => s.id === id);

    if (scriptIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Script no encontrado' },
        { status: 404 }
      );
    }

    // Remove all scripts with the same table name
    const filteredScripts = existingScripts.filter(
      (s) => s.tableName !== tableName
    );

    // Create the updated script
    const updatedScript: Script = {
      ...existingScripts[scriptIndex],
      script,
      tableName,
    };

    // Add the updated script to the filtered list
    const updatedScripts = [...filteredScripts, updatedScript];

    // Save the updated scripts back to Redis
    const result = await redis.set(SCRIPTS_KEY, updatedScripts);

    if (result !== 'OK') {
      throw new Error('Failed to update Redis');
    }

    return NextResponse.json({ success: true, script: updatedScript });
  } catch (error) {
    console.error('Error updating script:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to update script',
      },
      { status: 500 }
    );
  }
}
