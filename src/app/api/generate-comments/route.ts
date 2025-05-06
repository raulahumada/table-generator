import { NextResponse } from 'next/server';

interface Column {
  name: string;
  dataType: string;
  isPrimaryKey: boolean;
  hasForeignKey: boolean;
  foreignTable: string;
}

interface RequestBody {
  tableName: string;
  tableComment: string;
  columns: Column[];
}

export async function POST(request: Request) {
  try {
    const body: RequestBody = await request.json();
    const { tableName, tableComment, columns } = body;

    // Aquí deberías integrar con tu servicio de IA preferido
    // Por ahora, generaremos comentarios básicos basados en el nombre y tipo de la columna
    const suggestedComments = columns.map((column) => {
      let comment = `Campo que almacena `;

      // Generar comentario basado en el tipo de dato
      if (column.dataType.includes('VARCHAR2')) {
        comment += `texto de hasta ${
          column.dataType.match(/\d+/)?.[0] || '255'
        } caracteres`;
      } else if (column.dataType.includes('NUMBER')) {
        comment += `valores numéricos`;
      } else if (column.dataType === 'DATE') {
        comment += `fechas`;
      } else if (column.dataType === 'TIMESTAMP') {
        comment += `fechas y horas`;
      } else if (column.dataType === 'CLOB') {
        comment += `texto largo`;
      } else if (column.dataType === 'BLOB') {
        comment += `datos binarios`;
      } else if (column.dataType === 'CHAR(1)') {
        comment += `un carácter`;
      }

      // Agregar información sobre PK y FK
      if (column.isPrimaryKey) {
        comment += `, sirve como identificador único de la tabla`;
      }
      if (column.hasForeignKey && column.foreignTable) {
        comment += `, referencia a la tabla ${column.foreignTable}`;
      }

      return {
        columnName: column.name,
        comment: comment,
      };
    });

    return NextResponse.json(suggestedComments);
  } catch (error) {
    console.error('Error al generar comentarios:', error);
    return NextResponse.json(
      { error: 'Error al generar comentarios' },
      { status: 500 }
    );
  }
}
