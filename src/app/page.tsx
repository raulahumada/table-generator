'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Column {
  name: string;
  isPrimaryKey: boolean;
  isNullable: boolean;
  dataType: string;
  constraint: string;
  hasForeignKey: boolean;
  foreignTable: string;
  comment: string;
}

interface Script {
  id: string;
  tableName: string;
  script: string;
  createdAt: Date;
}

export default function Home() {
  const [tableName, setTableName] = useState('');
  const [tableComment, setTableComment] = useState('');
  const [columns, setColumns] = useState<Column[]>([
    {
      name: '',
      isPrimaryKey: false,
      isNullable: true,
      dataType: '',
      constraint: '',
      hasForeignKey: false,
      foreignTable: '',
      comment: '',
    },
  ]);
  const [previewScript, setPreviewScript] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewTitle, setPreviewTitle] = useState('');
  const [savedScripts, setSavedScripts] = useState<Script[]>([]);

  // Cargar scripts guardados al iniciar
  useEffect(() => {
    const savedScriptsFromStorage = localStorage.getItem('savedScripts');
    if (savedScriptsFromStorage) {
      try {
        const parsedScripts = JSON.parse(savedScriptsFromStorage);
        // Convertir las fechas de string a Date
        const scriptsWithDates = parsedScripts.map((script: any) => ({
          ...script,
          createdAt: new Date(script.createdAt),
        }));
        setSavedScripts(scriptsWithDates);
      } catch (error) {
        console.error('Error al cargar scripts guardados:', error);
      }
    }
  }, []);

  // Guardar scripts cuando cambien
  useEffect(() => {
    localStorage.setItem('savedScripts', JSON.stringify(savedScripts));
  }, [savedScripts]);

  const addColumn = () => {
    setColumns([
      ...columns,
      {
        name: '',
        isPrimaryKey: false,
        isNullable: true,
        dataType: '',
        constraint: '',
        hasForeignKey: false,
        foreignTable: '',
        comment: '',
      },
    ]);
  };

  const updateColumn = (index: number, field: keyof Column, value: any) => {
    const newColumns = [...columns];
    newColumns[index] = { ...newColumns[index], [field]: value };
    setColumns(newColumns);
  };

  const deleteColumn = (index: number) => {
    const newColumns = columns.filter((_, i) => i !== index);
    setColumns(newColumns);
  };

  const generateScript = () => {
    if (!tableName) {
      alert('Por favor, ingresa un nombre para la tabla');
      return;
    }

    let script = `-- Creación de la tabla ${tableName}\n`;
    if (tableComment) {
      script += `-- ${tableComment}\n\n`;
    }

    script += `CREATE TABLE ${tableName} (\n`;

    // Primero generamos las columnas
    columns.forEach((column, index) => {
      if (column.name) {
        script += `    ${column.name} ${column.dataType}`;
        if (!column.isNullable) script += ' NOT NULL';
        if (column.constraint) script += ` ${column.constraint}`;
        if (index < columns.length - 1) script += ',';
        script += '\n';
      }
    });

    // Luego agregamos las constraints de primary key
    const primaryKeys = columns
      .filter((col) => col.isPrimaryKey && col.name)
      .map((col) => col.name);

    if (primaryKeys.length > 0) {
      script += `    ,CONSTRAINT PK_${tableName} PRIMARY KEY (${primaryKeys.join(
        ', '
      )})\n`;
    }

    // Agregamos las constraints de foreign key
    columns.forEach((column, index) => {
      if (column.hasForeignKey && column.foreignTable && column.name) {
        script += `    ,CONSTRAINT FK_${tableName}_${column.name} FOREIGN KEY (${column.name})\n`;
        script += `        REFERENCES ${column.foreignTable} (${column.name})\n`;
      }
    });

    script += ');\n\n';

    // Agregamos los comentarios de la tabla
    if (tableComment) {
      script += `COMMENT ON TABLE ${tableName} IS '${tableComment}';\n`;
    }

    // Agregamos los comentarios de las columnas
    columns.forEach((column) => {
      if (column.name && column.comment) {
        script += `COMMENT ON COLUMN ${tableName}.${column.name} IS '${column.comment}';\n`;
      }
    });

    setPreviewTitle('Script de Creación de Tabla');
    setPreviewScript(script);
    setShowPreview(true);
    return script;
  };

  const generateInsertProcedure = () => {
    if (!tableName) {
      alert('Por favor, ingresa un nombre para la tabla');
      return;
    }

    const nonPrimaryColumns = columns.filter(
      (col) => !col.isPrimaryKey && col.name
    );
    const primaryColumns = columns.filter(
      (col) => col.isPrimaryKey && col.name
    );

    let script = `-- Procedimiento para insertar registros en la tabla ${tableName}\n\n`;
    script += `CREATE OR REPLACE PROCEDURE SP_INSERT_${tableName}\n`;
    script += `(\n`;

    // Parámetros para las columnas no PK
    nonPrimaryColumns.forEach((column, index) => {
      script += `    P_${column.name} IN ${column.dataType}`;
      if (index < nonPrimaryColumns.length - 1) script += ',';
      script += '\n';
    });

    script += `) AS\n`;
    script += `BEGIN\n`;
    script += `    INSERT INTO ${tableName}\n`;
    script += `    (\n`;

    // Lista de columnas
    columns.forEach((column, index) => {
      if (column.name) {
        script += `        ${column.name}`;
        if (index < columns.length - 1) script += ',';
        script += '\n';
      }
    });

    script += `    )\n`;
    script += `    VALUES\n`;
    script += `    (\n`;

    // Valores para las columnas
    columns.forEach((column, index) => {
      if (column.name) {
        if (column.isPrimaryKey) {
          script += `        ${tableName}_SEQ.NEXTVAL`;
        } else {
          script += `        P_${column.name}`;
        }
        if (index < columns.length - 1) script += ',';
        script += '\n';
      }
    });

    script += `    );\n`;
    script += `    COMMIT;\n`;
    script += `EXCEPTION\n`;
    script += `    WHEN OTHERS THEN\n`;
    script += `        ROLLBACK;\n`;
    script += `        RAISE;\n`;
    script += `END SP_INSERT_${tableName};\n`;
    script += `/`;

    setPreviewTitle('Procedimiento de Inserción');
    setPreviewScript(script);
    setShowPreview(true);
  };

  const generateUpdateProcedure = () => {
    if (!tableName) {
      alert('Por favor, ingresa un nombre para la tabla');
      return;
    }

    const nonPrimaryColumns = columns.filter(
      (col) => !col.isPrimaryKey && col.name
    );
    const primaryColumns = columns.filter(
      (col) => col.isPrimaryKey && col.name
    );

    if (primaryColumns.length === 0) {
      alert(
        'La tabla debe tener al menos una columna como Primary Key para generar el procedimiento de UPDATE'
      );
      return;
    }

    let script = `-- Procedimiento para actualizar registros en la tabla ${tableName}\n\n`;
    script += `CREATE OR REPLACE PROCEDURE SP_UPDATE_${tableName}\n`;
    script += `(\n`;

    // Parámetros para todas las columnas
    columns.forEach((column, index) => {
      script += `    P_${column.name} IN ${column.dataType}`;
      if (index < columns.length - 1) script += ',';
      script += '\n';
    });

    script += `) AS\n`;
    script += `BEGIN\n`;
    script += `    UPDATE ${tableName}\n`;
    script += `    SET\n`;

    // Columnas a actualizar (todas menos las PK)
    nonPrimaryColumns.forEach((column, index) => {
      script += `        ${column.name} = P_${column.name}`;
      if (index < nonPrimaryColumns.length - 1) script += ',';
      script += '\n';
    });

    // Condición WHERE con las PK
    script += `    WHERE\n`;
    primaryColumns.forEach((column, index) => {
      script += `        ${column.name} = P_${column.name}`;
      if (index < primaryColumns.length - 1) script += '\n        AND';
      script += '\n';
    });

    script += `    ;\n\n`;
    script += `    IF SQL%ROWCOUNT = 0 THEN\n`;
    script += `        RAISE_APPLICATION_ERROR(-20001, 'No se encontró el registro a actualizar');\n`;
    script += `    END IF;\n\n`;
    script += `    COMMIT;\n`;
    script += `EXCEPTION\n`;
    script += `    WHEN OTHERS THEN\n`;
    script += `        ROLLBACK;\n`;
    script += `        RAISE;\n`;
    script += `END SP_UPDATE_${tableName};\n`;
    script += `/`;

    setPreviewTitle('Procedimiento de Actualización');
    setPreviewScript(script);
    setShowPreview(true);
  };

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(previewScript)
      .then(() => {
        alert('Script copiado al portapapeles');
      })
      .catch((err) => {
        console.error('Error al copiar el script:', err);
        alert('Error al copiar el script');
      });
  };

  const saveScript = () => {
    try {
      const script = generateScript();
      if (typeof script !== 'string') {
        throw new Error('El script generado no es una cadena de texto válida');
      }

      const newScript: Script = {
        id: Date.now().toString(),
        tableName,
        script,
        createdAt: new Date(),
      };

      setSavedScripts((prev) => [...prev, newScript]);
      alert('Script guardado exitosamente');
    } catch (error) {
      console.error('Error al guardar el script:', error);
      alert('Error al guardar el script');
    }
  };

  const loadScript = (savedScript: Script) => {
    // Limpiar el estado actual
    setTableName(savedScript.tableName);
    // No limpiar el comentario de la tabla aquí
    setColumns([
      {
        name: '',
        isPrimaryKey: false,
        isNullable: true,
        dataType: '',
        constraint: '',
        hasForeignKey: false,
        foreignTable: '',
        comment: '',
      },
    ]);

    // Extraer información del script
    const lines = savedScript.script.split('\n');
    const newColumns: Column[] = [];

    lines.forEach((line) => {
      // Buscar líneas de columnas
      if (line.trim().startsWith('CREATE TABLE')) {
        // Extraer comentario de tabla si existe
        const tableCommentMatch = savedScript.script.match(
          /COMMENT ON TABLE .* IS '(.*)'/
        );
        if (tableCommentMatch) {
          setTableComment(tableCommentMatch[1]);
        }
      } else if (line.trim().startsWith('COMMENT ON COLUMN')) {
        // Extraer comentarios de columnas
        const columnCommentMatch = line.match(
          /COMMENT ON COLUMN .*\.(.*) IS '(.*)'/
        );
        if (columnCommentMatch) {
          const columnName = columnCommentMatch[1];
          const comment = columnCommentMatch[2];
          const columnIndex = newColumns.findIndex(
            (col) => col.name === columnName
          );
          if (columnIndex !== -1) {
            newColumns[columnIndex].comment = comment;
          }
        }
      } else if (
        line.trim() &&
        !line.trim().startsWith('--') &&
        !line.trim().startsWith(')') &&
        !line.trim().startsWith('CONSTRAINT') &&
        !line.includes('COMMENT')
      ) {
        // Extraer información de columnas
        const columnMatch = line.match(
          /^\s*(\w+)\s+(\w+(?:\(\d+\))?)(?:\s+(NOT NULL))?/
        );
        if (columnMatch) {
          const [, name, dataType, isNullable] = columnMatch;
          newColumns.push({
            name,
            dataType,
            isNullable: !isNullable,
            isPrimaryKey: false,
            constraint: '',
            hasForeignKey: false,
            foreignTable: '',
            comment: '',
          });
        }
      }
    });

    // Extraer primary keys
    const pkMatch = savedScript.script.match(/PRIMARY KEY \((.*)\)/);
    if (pkMatch) {
      const pkColumns = pkMatch[1].split(',').map((col) => col.trim());
      newColumns.forEach((col) => {
        if (pkColumns.includes(col.name)) {
          col.isPrimaryKey = true;
        }
      });
    }

    setColumns(newColumns);
    alert('Script cargado en el editor');
  };

  return (
    <div className="min-h-screen p-4">
      <div className="w-full">
        <h1 className="text-2xl font-bold mb-6">
          Generador de Scripts SQL para Oracle
        </h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Información de la Tabla</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="tableName">Nombre de la Tabla</Label>
              <Input
                id="tableName"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                placeholder="nombre_tabla"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tableComment">
                Comentario General de la Tabla
              </Label>
              <Textarea
                id="tableComment"
                value={tableComment}
                onChange={(e) => setTableComment(e.target.value)}
                placeholder="Descripción general de la tabla y su propósito"
                className="min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Columnas de la Tabla</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">
                      Nombre del Campo
                    </TableHead>
                    <TableHead className="w-[150px]">Primary Key</TableHead>
                    <TableHead className="w-[150px]">Nulleable</TableHead>
                    <TableHead className="w-[200px]">Tipo de Dato</TableHead>
                    <TableHead className="w-[200px]">Constraint</TableHead>
                    <TableHead className="w-[150px]">Foreign Key</TableHead>
                    <TableHead className="w-[200px]">
                      Tabla Referencia
                    </TableHead>
                    <TableHead className="w-[250px]">
                      Comentario del Campo
                    </TableHead>
                    <TableHead className="w-[150px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {columns.map((column, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Input
                          value={column.name}
                          onChange={(e) =>
                            updateColumn(index, 'name', e.target.value)
                          }
                          placeholder="nombre_campo"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={column.isPrimaryKey}
                          onCheckedChange={(checked) =>
                            updateColumn(index, 'isPrimaryKey', checked)
                          }
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={column.isNullable}
                          onCheckedChange={(checked) =>
                            updateColumn(index, 'isNullable', checked)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={column.dataType}
                          onValueChange={(value) =>
                            updateColumn(index, 'dataType', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NUMBER">NUMBER</SelectItem>
                            <SelectItem value="VARCHAR2(255)">
                              VARCHAR2(255)
                            </SelectItem>
                            <SelectItem value="CLOB">CLOB</SelectItem>
                            <SelectItem value="DATE">DATE</SelectItem>
                            <SelectItem value="TIMESTAMP">TIMESTAMP</SelectItem>
                            <SelectItem value="NUMBER(10,2)">
                              NUMBER(10,2)
                            </SelectItem>
                            <SelectItem value="CHAR(1)">CHAR(1)</SelectItem>
                            <SelectItem value="BLOB">BLOB</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={column.constraint}
                          onChange={(e) =>
                            updateColumn(index, 'constraint', e.target.value)
                          }
                          placeholder="UNIQUE, CHECK, etc."
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={column.hasForeignKey}
                          onCheckedChange={(checked) =>
                            updateColumn(index, 'hasForeignKey', checked)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={column.foreignTable}
                          onChange={(e) =>
                            updateColumn(index, 'foreignTable', e.target.value)
                          }
                          placeholder="nombre_tabla_referencia"
                          disabled={!column.hasForeignKey}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={column.comment}
                          onChange={(e) =>
                            updateColumn(index, 'comment', e.target.value)
                          }
                          placeholder="Descripción del campo"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteColumn(index)}
                          disabled={columns.length === 1}
                        >
                          Eliminar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 flex gap-4 flex-wrap">
              <Button onClick={addColumn} variant="outline">
                Agregar Columna
              </Button>
              <Button onClick={generateScript}>Generar Script de Tabla</Button>
              <Button onClick={generateInsertProcedure} variant="secondary">
                Generar Procedimiento INSERT
              </Button>
              <Button onClick={generateUpdateProcedure} variant="secondary">
                Generar Procedimiento UPDATE
              </Button>
              <Button onClick={saveScript} variant="secondary">
                Guardar Script
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de scripts guardados */}
        {savedScripts.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Scripts Guardados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {savedScripts.map((savedScript) => (
                  <div
                    key={savedScript.id}
                    className="border rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">{savedScript.tableName}</h3>
                      <span className="text-sm text-gray-500">
                        {savedScript.createdAt.toLocaleString()}
                      </span>
                    </div>
                    <pre className="bg-white p-4 rounded overflow-auto max-h-40">
                      {savedScript.script}
                    </pre>
                    <div className="mt-2 flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPreviewScript(savedScript.script);
                          setPreviewTitle(`Script de ${savedScript.tableName}`);
                          setShowPreview(true);
                        }}
                      >
                        Ver
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(savedScript.script);
                          alert('Script copiado al portapapeles');
                        }}
                      >
                        Copiar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadScript(savedScript)}
                      >
                        Cargar en Editor
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSavedScripts((prev) =>
                            prev.filter((s) => s.id !== savedScript.id)
                          );
                        }}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-10xl">
            <DialogHeader>
              <DialogTitle>{previewTitle}</DialogTitle>
              <DialogDescription>
                Revisa el script generado antes de copiarlo
              </DialogDescription>
            </DialogHeader>
            <div className="relative">
              <pre className="p-4 bg-gray-100 rounded-md overflow-auto max-h-[60vh]">
                {previewScript}
              </pre>
              <Button
                onClick={copyToClipboard}
                variant="outline"
                className="absolute top-2 right-2"
              >
                Copiar Script
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
