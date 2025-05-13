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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Database,
  ArrowUp,
  ArrowDown,
  Loader2,
  Settings,
  FileCode,
  CheckCircle2,
  AlertCircle,
  ClipboardCopy,
  Pencil,
  Trash2,
  ArrowUpDown,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import React from 'react';

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
  createdAt: string;
  isAlterTable: boolean;
  type?: 'CREATE TABLE' | 'ALTER TABLE';
}

export default function Home() {
  const [tableName, setTableName] = useState('');
  const [tableComment, setTableComment] = useState('');
  const [isAlterTable, setIsAlterTable] = useState(false);
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
  const [isGeneratingComments, setIsGeneratingComments] = useState(false);
  const [isSavingToRedis, setIsSavingToRedis] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [scriptToDelete, setScriptToDelete] = useState<Script | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    type: 'success' | 'error';
    title: string;
    description: string;
  }>({
    type: 'success',
    title: '',
    description: '',
  });
  const [editingScriptId, setEditingScriptId] = useState<string | null>(null);
  const [keySequence, setKeySequence] = useState('');
  const [showEasterEgg, setShowEasterEgg] = useState(false);

  // Estados para filtrado y ordenamiento
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'create' | 'alter'>(
    'all'
  );
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Script;
    direction: 'asc' | 'desc';
  }>({ key: 'createdAt', direction: 'desc' });

  // Función para ordenar y filtrar scripts
  const sortedScripts = React.useMemo(() => {
    const sorted = [...savedScripts]
      .map((script) => ({
        ...script,
        type: script.isAlterTable
          ? ('ALTER TABLE' as const)
          : ('CREATE TABLE' as const),
      }))
      .sort((a, b) => {
        if (sortConfig.key === 'type') {
          const typeA = a.isAlterTable ? 'ALTER TABLE' : 'CREATE TABLE';
          const typeB = b.isAlterTable ? 'ALTER TABLE' : 'CREATE TABLE';
          return sortConfig.direction === 'asc'
            ? typeA.localeCompare(typeB)
            : typeB.localeCompare(typeA);
        }
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });

    return sorted
      .filter((script) =>
        script.tableName.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter((script) => {
        if (typeFilter === 'all') return true;
        if (typeFilter === 'alter') return script.isAlterTable;
        return !script.isAlterTable;
      });
  }, [savedScripts, sortConfig, searchTerm, typeFilter]);

  const requestSort = (key: keyof Script) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      setKeySequence((prev) => {
        const newSequence = prev + event.key.toLowerCase();

        // Si la secuencia contiene "milei", activar el easter egg
        if (newSequence.includes('milei')) {
          setShowEasterEgg(true);
          return '';
        }

        // Mantener solo los últimos 10 caracteres para no acumular memoria
        return newSequence.slice(-10);
      });
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Load scripts from Redis when component mounts
  useEffect(() => {
    const fetchScripts = async () => {
      try {
        const response = await fetch('/api/save-script');
        const data = await response.json();
        if (data.success) {
          setSavedScripts(data.scripts);
        } else {
          console.error('Failed to fetch scripts:', data.error);
        }
      } catch (error) {
        console.error('Error fetching scripts:', error);
      }
    };

    fetchScripts();
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

    // Si se intenta marcar un campo PK como NULLEABLE, ignorar el cambio
    if (field === 'isNullable' && newColumns[index].isPrimaryKey) {
      return;
    }

    newColumns[index] = { ...newColumns[index], [field]: value };

    // Si se está actualizando isPrimaryKey a true, establecer isNullable como false
    if (field === 'isPrimaryKey' && value === true) {
      newColumns[index].isNullable = false;
    }

    setColumns(newColumns);
  };

  const deleteColumn = (index: number) => {
    const newColumns = columns.filter((_, i) => i !== index);
    setColumns(newColumns);
  };

  const moveColumn = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === columns.length - 1)
    ) {
      return;
    }

    const newColumns = [...columns];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    // Intercambiar las columnas
    [newColumns[index], newColumns[newIndex]] = [
      newColumns[newIndex],
      newColumns[index],
    ];

    setColumns(newColumns);
  };

  const addAuditFields = () => {
    const auditFields: Column[] = [
      {
        name: 'DCOMPDATE',
        isPrimaryKey: false,
        isNullable: true,
        dataType: 'DATE',
        constraint: '',
        hasForeignKey: false,
        foreignTable: '',
        comment:
          'Fecha del computador en que se crea o actualiza el registro. // Computer date when the record is updated or created.',
      },
      {
        name: 'DNULLDATE',
        isPrimaryKey: false,
        isNullable: true,
        dataType: 'DATE',
        constraint: '',
        hasForeignKey: false,
        foreignTable: '',
        comment:
          'Fecha de anulación del registro. // Date when the record is cancelled.',
      },
      {
        name: 'NUSERCODE',
        isPrimaryKey: false,
        isNullable: true,
        dataType: 'NUMBER(5)',
        constraint: '',
        hasForeignKey: false,
        foreignTable: '',
        comment:
          'Código del usuario que crea o actualiza el registro. // Code of the user creating or updating the record.',
      },
    ];

    // Verificar si los campos de auditoría ya existen
    const existingColumns = columns.map((col) => col.name);
    const newAuditFields = auditFields.filter(
      (field) => !existingColumns.includes(field.name)
    );

    if (newAuditFields.length === 0) {
      setAlertConfig({
        type: 'error',
        title: 'Advertencia',
        description: 'Los campos de auditoría ya han sido agregados',
      });
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return;
    }

    // Insertar los campos de auditoría al final
    setColumns((prevColumns) => [...prevColumns, ...newAuditFields]);
  };

  const addKeyFields = () => {
    const keyFields: Column[] = [
      {
        name: 'SCERTYPE',
        isPrimaryKey: true,
        isNullable: false,
        dataType: 'CHAR(1)',
        constraint: '',
        hasForeignKey: false,
        foreignTable: '',
        comment: 'Tipo de registro. // Type of Record.',
      },
      {
        name: 'NBRANCH',
        isPrimaryKey: true,
        isNullable: false,
        dataType: 'NUMBER(5)',
        constraint: '',
        hasForeignKey: false,
        foreignTable: '',
        comment: 'Código del ramo comercial. // Code of the line of business.',
      },
      {
        name: 'NPRODUCT',
        isPrimaryKey: true,
        isNullable: false,
        dataType: 'NUMBER(5)',
        constraint: '',
        hasForeignKey: false,
        foreignTable: '',
        comment: 'Código del producto. // Code of the product.',
      },
      {
        name: 'NPOLICY',
        isPrimaryKey: true,
        isNullable: false,
        dataType: 'NUMBER(10)',
        constraint: '',
        hasForeignKey: false,
        foreignTable: '',
        comment:
          'Número que identifica la póliza/cotización/solicitud. // Number identifying the Policy/Quotation/Application.',
      },
    ];

    // Verificar si los campos de llave ya existen
    const existingColumns = columns.map((col) => col.name);
    const newKeyFields = keyFields.filter(
      (field) => !existingColumns.includes(field.name)
    );

    if (newKeyFields.length === 0) {
      setAlertConfig({
        type: 'error',
        title: 'Advertencia',
        description: 'Los campos de llave ya han sido agregados',
      });
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return;
    }

    // Insertar los campos de llave al principio
    setColumns((prevColumns) => [...newKeyFields, ...prevColumns]);
  };

  const generateScript = () => {
    if (!tableName) {
      setAlertConfig({
        type: 'error',
        title: 'Error',
        description: 'Por favor, ingresa un nombre para la tabla',
      });
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return;
    }

    let script = '';
    const primaryKeys = columns
      .filter((col) => col.isPrimaryKey && col.name)
      .map((col) => col.name);

    const hasPrimaryKeys = primaryKeys.length > 0;

    if (!isAlterTable) {
      script = `-- Creación de la tabla ${tableName}\n`;
      if (tableComment) {
        script += `-- ${tableComment}\n\n`;
      }

      // Solo agregar el bloque de eliminación si no estamos editando un script existente
      if (!editingScriptId) {
        script += `DECLARE\n`;
        script += `  v_count NUMBER;\n`;
        script += `BEGIN\n`;
        script += `  SELECT COUNT(*) INTO v_count FROM user_tables WHERE table_name = '${tableName}';\n`;
        script += `  IF v_count > 0 THEN\n`;
        script += `    EXECUTE IMMEDIATE 'DROP TABLE ${tableName} CASCADE CONSTRAINTS';\n`;
        script += `  END IF;\n`;
        script += `END;\n`;
        script += `/\n\n`;
      }

      script += `CREATE TABLE ${tableName} (\n`;

      // Primero generamos las columnas
      columns.forEach((column, index) => {
        if (column.name) {
          script += `    ${column.name} ${column.dataType}`;
          if (!column.isNullable) script += ' NOT NULL';
          if (column.constraint) script += ` ${column.constraint}`;
          script += ',\n';
        }
      });

      // Quitamos la última coma y cerramos el paréntesis
      script = script.slice(0, -2) + '\n);\n\n';

      // Si hay PKs, primero creamos el índice
      if (hasPrimaryKeys) {
        script += `CREATE UNIQUE INDEX INSUDB.XPK${tableName} ON INSUDB.${tableName}\n`;
        script += `(${primaryKeys.join(', ')})\n`;
        script += `LOGGING\n`;
        script += `TABLESPACE INDICE1\n`;
        script += `PCTFREE    10\n`;
        script += `INITRANS   2\n`;
        script += `MAXTRANS   255\n`;
        script += `STORAGE    (\n`;
        script += `            INITIAL          128K\n`;
        script += `            NEXT             1M\n`;
        script += `            MINEXTENTS       1\n`;
        script += `            MAXEXTENTS       UNLIMITED\n`;
        script += `            PCTINCREASE      0\n`;
        script += `            BUFFER_POOL      DEFAULT\n`;
        script += `            FLASH_CACHE      DEFAULT\n`;
        script += `            CELL_FLASH_CACHE DEFAULT\n`;
        script += `           )\n`;
        script += `NOPARALLEL;\n\n`;

        // Luego agregamos la constraint de primary key
        script += `ALTER TABLE ${tableName} ADD (\n`;
        script += `  CONSTRAINT XPK${tableName}\n`;
        script += `  PRIMARY KEY\n`;
        script += `  (${primaryKeys.join(', ')})\n`;
        script += `  USING INDEX INSUDB.XPK${tableName}\n`;
        script += `  ENABLE VALIDATE\n`;
        script += `);\n\n`;
      }

      // Agregamos las constraints de foreign key
      columns.forEach((column) => {
        if (column.hasForeignKey && column.foreignTable && column.name) {
          script += `ALTER TABLE ${tableName} ADD CONSTRAINT FK_${tableName}_${column.name}\n`;
          script += `    FOREIGN KEY (${column.name})\n`;
          script += `    REFERENCES ${column.foreignTable} (${column.name});\n\n`;
        }
      });
    } else {
      // Generar script ALTER TABLE
      if (tableComment) {
        script += `COMMENT ON TABLE ${tableName} IS '${tableComment}';\n\n`;
      }

      // Generar ALTER TABLE para cada columna
      columns.forEach((column) => {
        if (column.name) {
          script += `ALTER TABLE ${tableName} ADD ${column.name} ${column.dataType}`;
          if (!column.isNullable) script += ' NOT NULL';
          if (column.constraint) script += ` ${column.constraint}`;
          script += ';\n';
        }
      });

      // Si hay PKs, primero creamos el índice
      if (hasPrimaryKeys) {
        script += `\nCREATE UNIQUE INDEX INSUDB.XPK${tableName} ON INSUDB.${tableName}\n`;
        script += `(${primaryKeys.join(', ')})\n`;
        script += `LOGGING\n`;
        script += `TABLESPACE INDICE1\n`;
        script += `PCTFREE    10\n`;
        script += `INITRANS   2\n`;
        script += `MAXTRANS   255\n`;
        script += `STORAGE    (\n`;
        script += `            INITIAL          128K\n`;
        script += `            NEXT             1M\n`;
        script += `            MINEXTENTS       1\n`;
        script += `            MAXEXTENTS       UNLIMITED\n`;
        script += `            PCTINCREASE      0\n`;
        script += `            BUFFER_POOL      DEFAULT\n`;
        script += `            FLASH_CACHE      DEFAULT\n`;
        script += `            CELL_FLASH_CACHE DEFAULT\n`;
        script += `           )\n`;
        script += `NOPARALLEL;\n\n`;

        // Luego agregamos la constraint de primary key
        script += `ALTER TABLE ${tableName} ADD (\n`;
        script += `  CONSTRAINT XPK${tableName}\n`;
        script += `  PRIMARY KEY\n`;
        script += `  (${primaryKeys.join(', ')})\n`;
        script += `  USING INDEX INSUDB.XPK${tableName}\n`;
        script += `  ENABLE VALIDATE\n`;
        script += `);\n\n`;
      }

      // Agregar foreign key constraints
      columns.forEach((column) => {
        if (column.hasForeignKey && column.foreignTable && column.name) {
          script += `\nALTER TABLE ${tableName} ADD CONSTRAINT FK_${tableName}_${column.name}\n`;
          script += `    FOREIGN KEY (${column.name})\n`;
          script += `    REFERENCES ${column.foreignTable} (${column.name});\n`;
        }
      });
    }

    // Agregamos los comentarios de las columnas
    columns.forEach((column) => {
      if (column.name && column.comment) {
        script += `COMMENT ON COLUMN ${tableName}.${column.name} IS '${column.comment}';\n`;
      }
    });

    setPreviewTitle(
      isAlterTable ? 'Script de ALTER TABLE' : 'Script de Creación de Tabla'
    );
    setPreviewScript(script);
    setShowPreview(true);
    return script;
  };

  const generateInsertProcedure = () => {
    if (!tableName) {
      setAlertConfig({
        type: 'error',
        title: 'Error',
        description: 'Por favor, ingresa un nombre para la tabla',
      });
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
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
      setAlertConfig({
        type: 'error',
        title: 'Error',
        description: 'Por favor, ingresa un nombre para la tabla',
      });
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return;
    }

    const nonPrimaryColumns = columns.filter(
      (col) => !col.isPrimaryKey && col.name
    );
    const primaryColumns = columns.filter(
      (col) => col.isPrimaryKey && col.name
    );

    if (primaryColumns.length === 0) {
      setAlertConfig({
        type: 'error',
        title: 'Error',
        description:
          'La tabla debe tener al menos una columna como Primary Key para generar el procedimiento de UPDATE',
      });
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
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
        setAlertConfig({
          type: 'success',
          title: 'Éxito',
          description: 'Script copiado al portapapeles',
        });
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000);
      })
      .catch((err) => {
        console.error('Error al copiar el script:', err);
        setAlertConfig({
          type: 'error',
          title: 'Error',
          description: 'Error al copiar el script',
        });
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000);
      });
  };

  const loadScript = (savedScript: Script) => {
    // Limpiar el estado actual
    setTableName(savedScript.tableName);
    setEditingScriptId(savedScript.id);
    setIsAlterTable(savedScript.isAlterTable || false);

    const lines = savedScript.script.split('\n');
    const newColumns: Column[] = [];
    let currentTableComment = '';
    let isInsideDropBlock = false;
    let isInsideCreateTable = false;

    // Procesar cada línea del script
    lines.forEach((line) => {
      const trimmedLine = line.trim();

      // Ignorar el bloque DECLARE/BEGIN/END
      if (
        trimmedLine.startsWith('DECLARE') ||
        trimmedLine.startsWith('BEGIN')
      ) {
        isInsideDropBlock = true;
        return;
      }
      if (isInsideDropBlock) {
        if (trimmedLine === 'END;' || trimmedLine === '/') {
          isInsideDropBlock = false;
        }
        return;
      }

      // Detectar CREATE TABLE
      if (trimmedLine.startsWith('CREATE TABLE')) {
        isInsideCreateTable = true;
        return;
      }

      // Extraer comentario de tabla
      const tableCommentMatch = trimmedLine.match(
        /COMMENT ON TABLE .* IS '(.*)'/
      );
      if (tableCommentMatch) {
        currentTableComment = tableCommentMatch[1];
        setTableComment(currentTableComment);
        return;
      }

      // Extraer comentarios de columnas
      const columnCommentMatch = trimmedLine.match(
        /COMMENT ON COLUMN .*\.(.*) IS '(.*)'/
      );
      if (columnCommentMatch) {
        const columnName = columnCommentMatch[1].trim();
        const comment = columnCommentMatch[2];
        const existingColumn = newColumns.find(
          (col) => col.name === columnName
        );
        if (existingColumn) {
          existingColumn.comment = comment;
        }
        return;
      }

      // Procesar definiciones de columnas
      if (savedScript.isAlterTable) {
        // Para ALTER TABLE
        const alterColumnMatch = trimmedLine.match(
          /ALTER TABLE .* ADD (\w+) ([\w()]+)( NOT NULL)?/
        );
        if (alterColumnMatch) {
          const [, name, dataType, notNull] = alterColumnMatch;
          newColumns.push({
            name,
            dataType,
            isPrimaryKey: false,
            isNullable: !notNull,
            constraint: '',
            hasForeignKey: false,
            foreignTable: '',
            comment: '',
          });
        }

        // Procesar PRIMARY KEY en ALTER TABLE
        const pkMatch = trimmedLine.match(
          /ADD CONSTRAINT .* PRIMARY KEY \((.*)\)/
        );
        if (pkMatch) {
          const pkColumns = pkMatch[1].split(',').map((col) => col.trim());
          newColumns.forEach((col) => {
            if (pkColumns.includes(col.name)) {
              col.isPrimaryKey = true;
              col.isNullable = false;
            }
          });
        }

        // Procesar FOREIGN KEY en ALTER TABLE
        const fkMatch = trimmedLine.match(
          /ADD CONSTRAINT .* FOREIGN KEY \((.*)\) REFERENCES (.*) \((.*)\)/
        );
        if (fkMatch) {
          const [, columnName, foreignTable] = fkMatch;
          const column = newColumns.find(
            (col) => col.name === columnName.trim()
          );
          if (column) {
            column.hasForeignKey = true;
            column.foreignTable = foreignTable.trim();
          }
        }
      } else {
        // Para CREATE TABLE, solo procesar columnas dentro del bloque de creación
        if (isInsideCreateTable && trimmedLine === ');') {
          isInsideCreateTable = false;
          return;
        }

        if (isInsideCreateTable) {
          const columnMatch = trimmedLine.match(
            /^\s*(\w+)\s+(\w+(?:\(\d+(?:,\d+)?\))?)/
          );
          if (columnMatch && !trimmedLine.startsWith('CONSTRAINT')) {
            const [, name, dataType] = columnMatch;
            const isNotNull = trimmedLine.includes('NOT NULL');
            const isPK = trimmedLine.toLowerCase().includes('primary key');

            newColumns.push({
              name,
              dataType,
              isPrimaryKey: isPK,
              isNullable: !isNotNull && !isPK,
              constraint: '',
              hasForeignKey: false,
              foreignTable: '',
              comment: '',
            });
          }

          // Procesar PRIMARY KEY en CREATE TABLE
          const pkMatch = trimmedLine.match(/PRIMARY KEY\s*\((.*?)\)/);
          if (pkMatch) {
            const pkColumns = pkMatch[1].split(',').map((col) => col.trim());
            newColumns.forEach((col) => {
              if (pkColumns.includes(col.name)) {
                col.isPrimaryKey = true;
                col.isNullable = false;
              }
            });
          }

          // Procesar FOREIGN KEY en CREATE TABLE
          const fkMatch = trimmedLine.match(
            /FOREIGN KEY\s*\((.*?)\)\s*REFERENCES\s*(.*?)\s*\((.*?)\)/
          );
          if (fkMatch) {
            const [, columnName, foreignTable] = fkMatch;
            const column = newColumns.find(
              (col) => col.name === columnName.trim()
            );
            if (column) {
              column.hasForeignKey = true;
              column.foreignTable = foreignTable.trim();
            }
          }
        }
      }
    });

    // Si no se encontraron columnas, agregar una vacía
    if (newColumns.length === 0) {
      newColumns.push({
        name: '',
        isPrimaryKey: false,
        isNullable: true,
        dataType: '',
        constraint: '',
        hasForeignKey: false,
        foreignTable: '',
        comment: '',
      });
    }

    setColumns(newColumns);
    setAlertConfig({
      type: 'success',
      title: 'Éxito',
      description: 'Script cargado en el editor',
    });
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  const saveScript = async () => {
    try {
      const script = generateScript();
      if (typeof script !== 'string') {
        throw new Error('El script generado no es una cadena de texto válida');
      }

      setPreviewScript(script);
      setPreviewTitle('Script de Creación de Tabla');
      setShowPreview(true);
    } catch (error) {
      console.error('Error al generar el script:', error);
      setAlertConfig({
        type: 'error',
        title: 'Error',
        description: 'Error al generar el script',
      });
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    }
  };

  const generateAISuggestedComments = async () => {
    if (!tableName) {
      setAlertConfig({
        type: 'error',
        title: 'Error',
        description: 'Por favor, ingresa un nombre para la tabla primero',
      });
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return;
    }

    setIsGeneratingComments(true);
    try {
      const columnsWithNames = columns.filter((col) => col.name);
      if (columnsWithNames.length === 0) {
        setAlertConfig({
          type: 'error',
          title: 'Error',
          description: 'Por favor, ingresa al menos una columna con nombre',
        });
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000);
        return;
      }

      const response = await fetch('/api/generate-comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tableName,
          tableComment,
          columns: columnsWithNames.map((col) => ({
            name: col.name,
            dataType: col.dataType,
            isPrimaryKey: col.isPrimaryKey,
            hasForeignKey: col.hasForeignKey,
            foreignTable: col.foreignTable,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Error al generar comentarios');
      }

      const suggestedComments = await response.json();

      // Actualizar los comentarios de las columnas
      const newColumns = columns.map((col) => {
        const suggestedComment = suggestedComments.find(
          (s: any) => s.columnName === col.name
        );
        if (suggestedComment) {
          return { ...col, comment: suggestedComment.comment };
        }
        return col;
      });

      setColumns(newColumns);
      setAlertConfig({
        type: 'success',
        title: 'Éxito',
        description: 'Comentarios generados exitosamente',
      });
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    } catch (error) {
      console.error('Error al generar comentarios:', error);
      setAlertConfig({
        type: 'error',
        title: 'Error',
        description:
          'Error al generar comentarios. Por favor, intenta de nuevo.',
      });
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    } finally {
      setIsGeneratingComments(false);
    }
  };

  return (
    <div className="min-h-screen p-4 bg-background">
      <div className="w-full max-w-[1800px] mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-foreground tracking-tight animate-fade-in">
          Generador de Scripts SQL para Oracle
        </h1>

        <Card className="mb-8 shadow-xl border-border/50 bg-card/95 animate-scale-in">
          <CardHeader className="bg-muted/30 border-b border-border/50 px-8 py-6">
            <CardTitle className="text-2xl text-foreground font-semibold">
              Información de la Tabla
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid gap-8 w-full">
              <div className="grid gap-3 animate-slide-in">
                <Label
                  htmlFor="tableName"
                  className="text-base font-medium text-foreground"
                >
                  Nombre de la Tabla
                </Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="tableName"
                    value={tableName}
                    onChange={(e) => setTableName(e.target.value)}
                    placeholder="nombre_tabla"
                    className="w-full bg-muted/50 border-border/50 h-12 text-lg px-4 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  />
                  <div className="flex items-center gap-2 bg-yellow-50/80 dark:bg-yellow-950/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800/30 transition-all duration-200 hover:bg-yellow-50 dark:hover:bg-yellow-950/30">
                    <Checkbox
                      id="isAlterTable"
                      checked={isAlterTable}
                      onCheckedChange={(checked) =>
                        setIsAlterTable(checked as boolean)
                      }
                      className="w-5 h-5 data-[state=checked]:bg-yellow-600 data-[state=checked]:border-yellow-600"
                    />
                    <Label
                      htmlFor="isAlterTable"
                      className="text-base font-medium text-yellow-800 dark:text-yellow-200 whitespace-nowrap cursor-pointer"
                    >
                      Generar como ALTER TABLE
                    </Label>
                  </div>
                </div>
              </div>

              {isAlterTable && (
                <div className="bg-yellow-50/80 dark:bg-yellow-950/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800/30">
                  <p className="text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    <span>
                      Los campos se agregarán usando comandos ALTER TABLE ADD
                    </span>
                  </p>
                </div>
              )}

              <div
                className="grid gap-3 animate-slide-in"
                style={{ animationDelay: '100ms' }}
              >
                <Label
                  htmlFor="tableComment"
                  className="text-base font-medium text-foreground"
                >
                  Comentario General de la Tabla
                </Label>
                <Textarea
                  id="tableComment"
                  value={tableComment}
                  onChange={(e) => setTableComment(e.target.value)}
                  placeholder="Descripción general de la tabla y su propósito"
                  className="w-full min-h-[140px] bg-muted/50 border-border/50 text-base p-4 resize-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="shadow-md animate-scale-in"
          style={{ animationDelay: '200ms' }}
        >
          <CardHeader className="bg-muted/50">
            <CardTitle className="text-xl">Columnas de la Tabla</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="rounded-md border overflow-x-auto w-full">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[300px]">
                      Nombre del Campo
                    </TableHead>
                    <TableHead className="w-[120px] text-center">
                      Primary Key
                    </TableHead>
                    <TableHead className="w-[120px] text-center">
                      Nulleable
                    </TableHead>
                    <TableHead className="w-[200px]">Tipo de Dato</TableHead>
                    <TableHead className="w-[200px]">Constraint</TableHead>
                    <TableHead className="w-[120px] text-center">
                      Foreign Key
                    </TableHead>
                    <TableHead className="w-[250px]">
                      Tabla Referencia
                    </TableHead>
                    <TableHead className="w-[400px]">
                      Comentario del Campo
                    </TableHead>
                    <TableHead className="w-[120px] text-center">
                      Acciones
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {columns.map((column, index) => (
                    <TableRow
                      key={index}
                      className="hover:bg-muted/50 transition-all duration-200 animate-slide-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input
                            value={column.name}
                            onChange={(e) =>
                              updateColumn(index, 'name', e.target.value)
                            }
                            placeholder="nombre_campo"
                            className="w-full transition-all duration-200"
                          />
                          <div className="flex flex-col">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => moveColumn(index, 'up')}
                              disabled={index === 0}
                              className="h-8 w-8 transition-transform hover:scale-110"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => moveColumn(index, 'down')}
                              disabled={index === columns.length - 1}
                              className="h-8 w-8 transition-transform hover:scale-110"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={column.isPrimaryKey}
                          onCheckedChange={(checked) =>
                            updateColumn(index, 'isPrimaryKey', checked)
                          }
                          className="scale-125"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={column.isNullable}
                          onCheckedChange={(checked) =>
                            updateColumn(index, 'isNullable', checked)
                          }
                          disabled={column.isPrimaryKey}
                          className="scale-125"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={column.dataType}
                          onValueChange={(value) =>
                            updateColumn(index, 'dataType', value)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NUMBER">NUMBER</SelectItem>
                            <SelectItem value="NUMBER(5)">NUMBER(5)</SelectItem>
                            <SelectItem value="NUMBER(9,6)">
                              NUMBER(9,6)
                            </SelectItem>
                            <SelectItem value="NUMBER(10)">
                              NUMBER(10)
                            </SelectItem>
                            <SelectItem value="NUMBER(10,2)">
                              NUMBER(10,2)
                            </SelectItem>
                            <SelectItem value="NUMBER(18,6)">
                              NUMBER(18,6)
                            </SelectItem>
                            <SelectItem value="NUMBER(20)">
                              NUMBER(20)
                            </SelectItem>

                            <SelectItem value="VARCHAR2(255)">
                              VARCHAR2(255)
                            </SelectItem>
                            <SelectItem value="CLOB">CLOB</SelectItem>
                            <SelectItem value="DATE">DATE</SelectItem>
                            <SelectItem value="TIMESTAMP">TIMESTAMP</SelectItem>
                            <SelectItem value="CHAR(1)">CHAR(1)</SelectItem>
                            <SelectItem value="CHAR(12)">CHAR(12)</SelectItem>
                            <SelectItem value="CHAR(20)">CHAR(20)</SelectItem>
                            <SelectItem value="CHAR(30)">CHAR(30)</SelectItem>
                            <SelectItem value="BLOB">BLOB</SelectItem>
                            <SelectItem value="GENERIC">GENERIC</SelectItem>
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
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={column.hasForeignKey}
                          onCheckedChange={(checked) =>
                            updateColumn(index, 'hasForeignKey', checked)
                          }
                          className="scale-125"
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
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={column.comment}
                          onChange={(e) =>
                            updateColumn(index, 'comment', e.target.value)
                          }
                          placeholder="Descripción del campo"
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteColumn(index)}
                          disabled={columns.length === 1}
                          className="transition-all duration-200 hover:scale-105"
                        >
                          Eliminar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-6 flex gap-4 flex-wrap">
              <Button onClick={addColumn} variant="outline">
                Agregar Columna
              </Button>
              <Button onClick={addKeyFields} variant="outline">
                Agregar Campos Llave
              </Button>
              <Button onClick={addAuditFields} variant="outline">
                Agregar Campos Auditoría
              </Button>

              <Button onClick={generateInsertProcedure} variant="secondary">
                Generar Procedimiento INSERT
              </Button>
              <Button onClick={generateUpdateProcedure} variant="secondary">
                Generar Procedimiento UPDATE
              </Button>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="secondary"
                      disabled={true}
                      className="cursor-not-allowed transition-all duration-200 group"
                    >
                      <Settings className="mr-2 h-4 w-4 group-hover:animate-spin" />
                      Generar Comentarios con IA
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Funcionalidad en desarrollo</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button
                onClick={saveScript}
                variant="default"
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                <FileCode className="mr-2 h-4 w-4" />
                {editingScriptId
                  ? 'Actualizar Script'
                  : 'Generar Script de Tabla'}
              </Button>
              <Button
                className="bg-teal-500 hover:bg-teal-600 text-white"
                onClick={async () => {
                  if (!previewScript || !tableName) {
                    setAlertConfig({
                      type: 'error',
                      title: 'Error',
                      description:
                        'Por favor, genera un script y proporciona un nombre de tabla primero',
                    });
                    setShowAlert(true);
                    setTimeout(() => setShowAlert(false), 3000);
                    return;
                  }
                  try {
                    setIsSavingToRedis(true);
                    const response = await fetch('/api/save-script', {
                      method: editingScriptId ? 'PUT' : 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        id: editingScriptId,
                        script: previewScript,
                        tableName: tableName,
                        isAlterTable: isAlterTable,
                      }),
                    });

                    const result = await response.json();

                    if (result.success) {
                      if (editingScriptId) {
                        // Actualizar el script existente en la lista
                        setSavedScripts((prev) =>
                          prev.map((s) =>
                            s.id === editingScriptId ? result.script : s
                          )
                        );
                        setEditingScriptId(null);
                      } else {
                        // Agregar el nuevo script a la lista
                        setSavedScripts((prev) => [...prev, result.script]);
                      }
                      setAlertConfig({
                        type: 'success',
                        title: 'Éxito',
                        description: editingScriptId
                          ? 'Script actualizado en Redis exitosamente'
                          : 'Script guardado en Redis exitosamente',
                      });
                      setShowAlert(true);
                      setTimeout(() => setShowAlert(false), 3000);
                    } else {
                      throw new Error(result.error || 'Error desconocido');
                    }
                  } catch (error) {
                    console.error('Error saving to Redis:', error);
                    setAlertConfig({
                      type: 'error',
                      title: 'Error',
                      description:
                        error instanceof Error
                          ? error.message
                          : 'Error al guardar el script en Redis',
                    });
                    setShowAlert(true);
                    setTimeout(() => setShowAlert(false), 3000);
                  } finally {
                    setIsSavingToRedis(false);
                  }
                }}
                disabled={isSavingToRedis}
              >
                <Database className="mr-2 h-4 w-4" />
                {isSavingToRedis ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingScriptId
                      ? 'Actualizando en base de datos...'
                      : 'Guardando en base de datos...'}
                  </>
                ) : editingScriptId ? (
                  'Actualizar en Base de Datos'
                ) : (
                  'Guardar en Base de Datos'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de scripts guardados */}
        {savedScripts.length > 0 && (
          <Card className="mt-8 shadow-md">
            <CardHeader className="bg-muted/50">
              <CardTitle className="text-xl">Scripts Guardados</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4 mb-4">
                  <Input
                    placeholder="Buscar por nombre de tabla..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                  <Select
                    value={typeFilter}
                    onValueChange={(value: 'all' | 'create' | 'alter') =>
                      setTypeFilter(value)
                    }
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filtrar por tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los tipos</SelectItem>
                      <SelectItem value="create">CREATE TABLE</SelectItem>
                      <SelectItem value="alter">ALTER TABLE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => requestSort('tableName')}
                        >
                          <div className="flex items-center gap-2">
                            Nombre de Tabla
                            {sortConfig.key === 'tableName' ? (
                              <span className="text-primary">
                                {sortConfig.direction === 'asc' ? (
                                  <ArrowUp className="h-4 w-4" />
                                ) : (
                                  <ArrowDown className="h-4 w-4" />
                                )}
                              </span>
                            ) : (
                              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => requestSort('type')}
                        >
                          <div className="flex items-center gap-2">
                            Tipo
                            {sortConfig.key === 'type' ? (
                              <span className="text-primary">
                                {sortConfig.direction === 'asc' ? (
                                  <ArrowUp className="h-4 w-4" />
                                ) : (
                                  <ArrowDown className="h-4 w-4" />
                                )}
                              </span>
                            ) : (
                              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => requestSort('createdAt')}
                        >
                          <div className="flex items-center gap-2">
                            Fecha de Creación
                            {sortConfig.key === 'createdAt' ? (
                              <span className="text-primary">
                                {sortConfig.direction === 'asc' ? (
                                  <ArrowUp className="h-4 w-4" />
                                ) : (
                                  <ArrowDown className="h-4 w-4" />
                                )}
                              </span>
                            ) : (
                              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedScripts.map((script) => (
                        <TableRow key={script.id}>
                          <TableCell className="font-medium">
                            {script.tableName}
                          </TableCell>
                          <TableCell>
                            {script.isAlterTable ? (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800/30">
                                ALTER TABLE
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800/30">
                                CREATE TABLE
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(script.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setPreviewScript(script.script);
                                        setPreviewTitle(
                                          `Script de ${script.tableName}`
                                        );
                                        setShowPreview(true);
                                      }}
                                    >
                                      <FileCode className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Ver Script</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        navigator.clipboard.writeText(
                                          script.script
                                        );
                                        setAlertConfig({
                                          type: 'success',
                                          title: 'Éxito',
                                          description:
                                            'Script copiado al portapapeles',
                                        });
                                        setShowAlert(true);
                                        setTimeout(
                                          () => setShowAlert(false),
                                          3000
                                        );
                                      }}
                                    >
                                      <ClipboardCopy className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Copiar al Portapapeles</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => loadScript(script)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Editar Script</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => {
                                        setScriptToDelete(script);
                                        setShowDeleteConfirm(true);
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Eliminar Script</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-[95vw] w-full max-h-[90vh] min-w-[800px]">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-xl flex items-center gap-2">
                <FileCode className="h-5 w-5" />
                {previewTitle}
              </DialogTitle>
              <DialogDescription>
                Revisa el script generado antes de copiarlo
              </DialogDescription>
            </DialogHeader>
            <div className="relative flex-1 min-h-[60vh]">
              <div className="absolute inset-0 p-6">
                <div className="relative h-full bg-muted rounded-lg">
                  <pre className="absolute inset-0 p-6 overflow-auto font-mono text-sm whitespace-pre">
                    {previewScript}
                  </pre>
                  <div className="absolute top-4 right-4 z-10 flex gap-2">
                    <Button
                      onClick={copyToClipboard}
                      variant="secondary"
                      className="flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow"
                    >
                      <ClipboardCopy className="h-4 w-4" />
                      Copiar Script
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Confirmar Eliminación</DialogTitle>
              <DialogDescription>
                ¿Estás seguro que deseas eliminar el script de la tabla{' '}
                {scriptToDelete?.tableName}? Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-4 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setScriptToDelete(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (!scriptToDelete) return;

                  try {
                    const response = await fetch('/api/save-script', {
                      method: 'DELETE',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        id: scriptToDelete.id,
                      }),
                    });

                    const result = await response.json();

                    if (result.success) {
                      const updatedScripts = savedScripts.filter(
                        (s) => s.id !== scriptToDelete.id
                      );
                      setSavedScripts(updatedScripts);
                      setAlertConfig({
                        type: 'success',
                        title: 'Éxito',
                        description: 'Script eliminado exitosamente',
                      });
                      setShowAlert(true);
                      setTimeout(() => setShowAlert(false), 3000);
                    } else {
                      throw new Error(result.error || 'Error desconocido');
                    }
                  } catch (error) {
                    console.error('Error al eliminar el script:', error);
                    setAlertConfig({
                      type: 'error',
                      title: 'Error',
                      description:
                        error instanceof Error
                          ? error.message
                          : 'Error al eliminar el script',
                    });
                    setShowAlert(true);
                    setTimeout(() => setShowAlert(false), 3000);
                  } finally {
                    setShowDeleteConfirm(false);
                    setScriptToDelete(null);
                  }
                }}
              >
                Eliminar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showEasterEgg} onOpenChange={setShowEasterEgg}>
          <DialogContent className="max-w-[800px] w-full">
            <DialogHeader>
              <DialogTitle className="text-xl">
                ¡Easter Egg Encontrado! 🎉
              </DialogTitle>
            </DialogHeader>
            <div className="relative" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src="https://www.youtube.com/embed/R26BSXAbRiY?autoplay=1"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </DialogContent>
        </Dialog>

        {showAlert && (
          <div className="fixed bottom-4 right-4 z-50">
            <Alert
              className={
                alertConfig.type === 'success'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }
            >
              {alertConfig.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertTitle
                className={
                  alertConfig.type === 'success'
                    ? 'text-green-800'
                    : 'text-red-800'
                }
              >
                {alertConfig.title}
              </AlertTitle>
              <AlertDescription
                className={
                  alertConfig.type === 'success'
                    ? 'text-green-700'
                    : 'text-red-700'
                }
              >
                {alertConfig.description}
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
    </div>
  );
}
