import { redis } from '@/lib/redis';
import { NextResponse } from 'next/server';

const SCRIPTS_KEY = 'table-scripts';

type Script = {
  id: string;
  script: string;
  tableName: string;
  createdAt: string;
  isAlterTable: boolean;
};

export async function POST(request: Request) {
  try {
    const { script, tableName, isAlterTable } = await request.json();

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
      isAlterTable: isAlterTable || false,
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

    // Filter out the script to delete
    const updatedScripts = existingScripts.filter((script) => script.id !== id);

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
    const { id, script, tableName, isAlterTable } = await request.json();

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

    // Eliminar todos los scripts con el mismo nombre de tabla, excepto el que estamos editando
    const filteredScripts = existingScripts.filter(
      (s) => s.tableName !== tableName || s.id === id
    );

    // Obtener la fecha actual
    const currentDate = new Date().toISOString();

    // Create the updated script
    const updatedScript: Script = {
      id,
      script,
      tableName,
      createdAt: currentDate,
      isAlterTable: isAlterTable || false,
    };

    // Encontrar el índice del script que estamos editando
    const scriptIndex = filteredScripts.findIndex((s) => s.id === id);

    if (scriptIndex === -1) {
      // Si no existe, lo agregamos al final
      filteredScripts.push(updatedScript);
    } else {
      // Si existe, lo actualizamos en su posición
      filteredScripts[scriptIndex] = updatedScript;
    }

    // Save the updated scripts back to Redis
    const result = await redis.set(SCRIPTS_KEY, filteredScripts);

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
