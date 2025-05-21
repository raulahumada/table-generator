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
  FileSpreadsheet,
  X,
  Copy,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ui/theme-toggle';
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
  tableComment?: string;
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

    // Animación para el nuevo elemento agregado
    setTimeout(() => {
      const rows = document.querySelectorAll('tbody tr');
      if (rows.length > 0) {
        const lastRow = rows[rows.length - 1];
        lastRow.classList.add('slide-in');
        setTimeout(() => {
          lastRow.classList.remove('slide-in');
        }, 500);
      }
    }, 10);
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
    // Agregar animación al botón de copiar
    const copyButton = document.querySelector('#copy-button');
    if (copyButton) {
      copyButton.classList.add('scale-in');
      setTimeout(() => {
        copyButton.classList.remove('scale-in');
      }, 300);
    }

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

  const copyWithFormat = (script: Script) => {
    const currentDate = new Date();
    const formattedDate = `${currentDate
      .getDate()
      .toString()
      .padStart(2, '0')}-${(currentDate.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${currentDate.getFullYear()}`;

    let path = '';
    if (script.isAlterTable) {
      path = `VisualTiMELife\\vt-bbdd\\INSUDB\\DataManipulation\\01_${formattedDate}_ALTER_TABLE_${script.tableName}.sql`;
    } else {
      path = `VisualTiMELife\\vt-bbdd\\DataDefinition\\01_${formattedDate}_CREATE_TABLE_${script.tableName}.sql`;
    }

    navigator.clipboard
      .writeText(path)
      .then(() => {
        setAlertConfig({
          type: 'success',
          title: 'Éxito',
          description: 'Ruta copiada al portapapeles',
        });
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000);
      })
      .catch((err) => {
        console.error('Error al copiar:', err);
        setAlertConfig({
          type: 'error',
          title: 'Error',
          description: 'Error al copiar la ruta',
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
    // Cargar el comentario de la tabla si existe
    setTableComment(savedScript.tableComment || '');

    const lines = savedScript.script.split('\n');
    const newColumns: Column[] = [];
    let currentTableComment = savedScript.tableComment || '';
    let isInsideDropBlock = false;
    let isInsideCreateTable = false;
    let currentColumn: Column | null = null;
    let pkColumns: string[] = [];
    let collectingPkColumns = false;

    // Procesar cada línea del script
    lines.forEach((line) => {
      const trimmedLine = line.trim();

      // Detectar comienzo de definición de PRIMARY KEY
      if (trimmedLine.includes('PRIMARY KEY')) {
        collectingPkColumns = true;
      }

      // Capturar las columnas de PK en formato (col1, col2)
      if (collectingPkColumns) {
        const colMatch = trimmedLine.match(/\(\s*(.*?)\s*\)/);
        if (colMatch) {
          const cols = colMatch[1].split(',').map((col) => col.trim());
          pkColumns = [...pkColumns, ...cols];
          collectingPkColumns = false;
        }
      }

      // Detectar PKs en la definición de constraint en una sola línea
      const pkConstraintMatch = trimmedLine.match(
        /PRIMARY KEY\s*\(\s*(.*?)\s*\)/i
      );
      if (pkConstraintMatch) {
        const cols = pkConstraintMatch[1].split(',').map((col) => col.trim());
        pkColumns = [...pkColumns, ...cols];
      }

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
            isPrimaryKey: pkColumns.includes(name),
            isNullable: !notNull,
            constraint: '',
            hasForeignKey: false,
            foreignTable: '',
            comment: '',
          });
        }
      } else {
        // Para CREATE TABLE
        if (isInsideCreateTable) {
          if (trimmedLine === ');') {
            isInsideCreateTable = false;
            if (currentColumn) {
              newColumns.push(currentColumn);
              currentColumn = null;
            }
            return;
          }

          // Procesar columna individual
          const columnMatch = trimmedLine.match(
            /^\s*(\w+)\s+([\w()]+)(\s+NOT NULL)?/
          );
          if (columnMatch && !trimmedLine.startsWith('CONSTRAINT')) {
            if (currentColumn) {
              newColumns.push(currentColumn);
            }
            const [, name, dataType, notNull] = columnMatch;
            currentColumn = {
              name,
              dataType,
              isPrimaryKey: pkColumns.includes(name),
              isNullable: !notNull,
              constraint: '',
              hasForeignKey: false,
              foreignTable: '',
              comment: '',
            };
          }
        }
      }

      // Procesar FOREIGN KEY
      const fkMatch = trimmedLine.match(
        /FOREIGN KEY\s*\((.*?)\)\s*REFERENCES\s*(.*?)\s*\((.*?)\)/
      );
      if (fkMatch) {
        const [, columnName, foreignTable] = fkMatch;
        const column = newColumns.find((col) => col.name === columnName.trim());
        if (column) {
          column.hasForeignKey = true;
          column.foreignTable = foreignTable.trim();
        }
      }
    });

    // Asegurarse de agregar la última columna si existe
    if (currentColumn) {
      newColumns.push(currentColumn);
    }

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

    // Actualizar las PKs una vez más después de procesar todo el script
    newColumns.forEach((column) => {
      if (pkColumns.includes(column.name)) {
        column.isPrimaryKey = true;
        column.isNullable = false;
      }
    });

    // Debug log para verificar columnas y PKs detectadas
    console.log('PKs detectadas:', pkColumns);
    console.log('Columnas cargadas:', newColumns);

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

  const duplicateScript = (savedScript: Script) => {
    // Cargar el script pero con nombre vacío y sin ID de edición
    setTableName('');
    setEditingScriptId(null);
    setIsAlterTable(savedScript.isAlterTable || false);
    // Mantener el comentario de la tabla cuando se duplica
    setTableComment(savedScript.tableComment || '');

    const lines = savedScript.script.split('\n');
    const newColumns: Column[] = [];
    let currentTableComment = savedScript.tableComment || '';
    let isInsideDropBlock = false;
    let isInsideCreateTable = false;
    let currentColumn: Column | null = null;
    let pkColumns: string[] = [];
    let collectingPkColumns = false;

    // Procesar cada línea del script
    lines.forEach((line) => {
      const trimmedLine = line.trim();

      // Detectar comienzo de definición de PRIMARY KEY
      if (trimmedLine.includes('PRIMARY KEY')) {
        collectingPkColumns = true;
      }

      // Capturar las columnas de PK en formato (col1, col2)
      if (collectingPkColumns) {
        const colMatch = trimmedLine.match(/\(\s*(.*?)\s*\)/);
        if (colMatch) {
          const cols = colMatch[1].split(',').map((col) => col.trim());
          pkColumns = [...pkColumns, ...cols];
          collectingPkColumns = false;
        }
      }

      // Detectar PKs en la definición de constraint en una sola línea
      const pkConstraintMatch = trimmedLine.match(
        /PRIMARY KEY\s*\(\s*(.*?)\s*\)/i
      );
      if (pkConstraintMatch) {
        const cols = pkConstraintMatch[1].split(',').map((col) => col.trim());
        pkColumns = [...pkColumns, ...cols];
      }

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
            isPrimaryKey: pkColumns.includes(name),
            isNullable: !notNull,
            constraint: '',
            hasForeignKey: false,
            foreignTable: '',
            comment: '',
          });
        }
      } else {
        // Para CREATE TABLE
        if (isInsideCreateTable) {
          if (trimmedLine === ');') {
            isInsideCreateTable = false;
            if (currentColumn) {
              newColumns.push(currentColumn);
              currentColumn = null;
            }
            return;
          }

          // Procesar columna individual
          const columnMatch = trimmedLine.match(
            /^\s*(\w+)\s+([\w()]+)(\s+NOT NULL)?/
          );
          if (columnMatch && !trimmedLine.startsWith('CONSTRAINT')) {
            if (currentColumn) {
              newColumns.push(currentColumn);
            }
            const [, name, dataType, notNull] = columnMatch;
            currentColumn = {
              name,
              dataType,
              isPrimaryKey: pkColumns.includes(name),
              isNullable: !notNull,
              constraint: '',
              hasForeignKey: false,
              foreignTable: '',
              comment: '',
            };
          }
        }
      }

      // Procesar FOREIGN KEY
      const fkMatch = trimmedLine.match(
        /FOREIGN KEY\s*\((.*?)\)\s*REFERENCES\s*(.*?)\s*\((.*?)\)/
      );
      if (fkMatch) {
        const [, columnName, foreignTable] = fkMatch;
        const column = newColumns.find((col) => col.name === columnName.trim());
        if (column) {
          column.hasForeignKey = true;
          column.foreignTable = foreignTable.trim();
        }
      }
    });

    // Asegurarse de agregar la última columna si existe
    if (currentColumn) {
      newColumns.push(currentColumn);
    }

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

    // Actualizar las PKs una vez más después de procesar todo el script
    newColumns.forEach((column) => {
      if (pkColumns.includes(column.name)) {
        column.isPrimaryKey = true;
        column.isNullable = false;
      }
    });

    setColumns(newColumns);
    setAlertConfig({
      type: 'success',
      title: 'Éxito',
      description: 'Script duplicado como nuevo en el editor',
    });
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-300 transition-colors duration-300">
      <div className="w-full max-w-[1800px] mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8 slide-in">
          <h1 className="text-2xl font-normal tracking-tight text-zinc-800 dark:text-zinc-100 pb-4 typewriter">
            Generador de Scripts SQL para Oracle
          </h1>
          <ThemeToggle />
        </div>

        <div className="space-y-10">
          <div
            className={`space-y-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 scale-in ${
              editingScriptId ? 'editing-card' : ''
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-normal text-zinc-800 dark:text-zinc-100">
                Información de la Tabla
              </h2>
            </div>

            <div className="grid gap-6 w-full">
              <div className="grid gap-3">
                <Label
                  htmlFor="tableName"
                  className="text-base font-normal text-zinc-600 dark:text-zinc-400"
                >
                  Nombre de la Tabla
                </Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="tableName"
                    value={tableName}
                    onChange={(e) => setTableName(e.target.value)}
                    placeholder="nombre_tabla"
                    className="w-full bg-gray-100 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 h-12 text-lg px-4 focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-all duration-200 rounded-none text-zinc-700 dark:text-zinc-200"
                  />
                  <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 bg-gray-50 dark:bg-zinc-800/50 px-4 py-3 border border-gray-200 dark:border-zinc-700">
                    <Checkbox
                      id="isAlterTable"
                      checked={isAlterTable}
                      onCheckedChange={(checked) =>
                        setIsAlterTable(checked as boolean)
                      }
                      className="w-5 h-5 rounded-none bg-gray-100 dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 data-[state=checked]:bg-zinc-500 dark:data-[state=checked]:bg-zinc-600 data-[state=checked]:border-zinc-500 dark:data-[state=checked]:border-zinc-600"
                    />
                    <Label
                      htmlFor="isAlterTable"
                      className="text-base font-normal whitespace-nowrap cursor-pointer"
                    >
                      Generar como ALTER TABLE
                    </Label>
                  </div>
                </div>
              </div>

              {isAlterTable && (
                <div className="bg-zinc-100 dark:bg-zinc-800/50 p-4 border border-zinc-200 dark:border-zinc-700/50">
                  <p className="text-zinc-700 dark:text-zinc-400 flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-zinc-600 dark:text-zinc-500" />
                    <span>
                      Los campos se agregarán usando comandos ALTER TABLE ADD
                    </span>
                  </p>
                </div>
              )}

              <div className="grid gap-3">
                <Label
                  htmlFor="tableComment"
                  className="text-base font-normal text-zinc-400"
                >
                  Comentario General de la Tabla
                </Label>
                <Textarea
                  id="tableComment"
                  value={tableComment}
                  onChange={(e) => setTableComment(e.target.value)}
                  placeholder="Descripción general de la tabla y su propósito"
                  className="w-full min-h-[140px] bg-gray-100 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-base p-4 resize-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-all duration-200 rounded-none text-zinc-700 dark:text-zinc-200"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 scale-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-normal text-zinc-800 dark:text-zinc-100">
                Columnas de la Tabla
              </h2>
              <div className="flex gap-3">
                <Button
                  onClick={addColumn}
                  variant="outline"
                  className="border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-none h-9 transition-all duration-200"
                >
                  Agregar Columna
                </Button>
                <Button
                  onClick={addKeyFields}
                  variant="outline"
                  className="border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-none h-9 transition-all duration-200"
                >
                  Agregar Campos Llave
                </Button>
                <Button
                  onClick={addAuditFields}
                  variant="outline"
                  className="border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-none h-9 transition-all duration-200"
                >
                  Agregar Campos Auditoría
                </Button>
              </div>
            </div>

            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800">
                    <th className="text-left py-3 px-4 font-normal text-zinc-600 dark:text-zinc-400">
                      Nombre
                    </th>
                    <th className="text-center py-3 px-4 font-normal text-zinc-600 dark:text-zinc-400">
                      PK
                    </th>
                    <th className="text-center py-3 px-4 font-normal text-zinc-600 dark:text-zinc-400">
                      Nullable
                    </th>
                    <th className="text-left py-3 px-4 font-normal text-zinc-600 dark:text-zinc-400">
                      Tipo de Dato
                    </th>
                    <th className="text-left py-3 px-4 font-normal text-zinc-600 dark:text-zinc-400">
                      Constraint
                    </th>
                    <th className="text-center py-3 px-4 font-normal text-zinc-600 dark:text-zinc-400">
                      FK
                    </th>
                    <th className="text-left py-3 px-4 font-normal text-zinc-600 dark:text-zinc-400">
                      Tabla Ref.
                    </th>
                    <th className="text-left py-3 px-4 font-normal text-zinc-600 dark:text-zinc-400">
                      Comentario
                    </th>
                    <th className="text-center py-3 px-4 font-normal text-zinc-600 dark:text-zinc-400">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {columns.map((column, index) => (
                    <tr
                      key={index}
                      className="border-b border-zinc-200 dark:border-zinc-800 transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800/40"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Input
                            value={column.name}
                            onChange={(e) =>
                              updateColumn(index, 'name', e.target.value)
                            }
                            placeholder="nombre_campo"
                            className="w-full bg-gray-100 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 rounded-none text-zinc-700 dark:text-zinc-200"
                          />
                          <div className="flex flex-col">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => moveColumn(index, 'up')}
                              disabled={index === 0}
                              className="h-8 w-8 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => moveColumn(index, 'down')}
                              disabled={index === columns.length - 1}
                              className="h-8 w-8 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4">
                        <Checkbox
                          checked={column.isPrimaryKey}
                          onCheckedChange={(checked) =>
                            updateColumn(index, 'isPrimaryKey', checked)
                          }
                          className="rounded-none bg-gray-100 dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 data-[state=checked]:bg-zinc-500 dark:data-[state=checked]:bg-zinc-600 data-[state=checked]:border-zinc-500 dark:data-[state=checked]:border-zinc-600"
                        />
                      </td>
                      <td className="text-center py-3 px-4">
                        <Checkbox
                          checked={column.isNullable}
                          onCheckedChange={(checked) =>
                            updateColumn(index, 'isNullable', checked)
                          }
                          disabled={column.isPrimaryKey}
                          className="rounded-none bg-gray-100 dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 data-[state=checked]:bg-zinc-500 dark:data-[state=checked]:bg-zinc-600 data-[state=checked]:border-zinc-500 dark:data-[state=checked]:border-zinc-600"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <Select
                          value={column.dataType}
                          onValueChange={(value) =>
                            updateColumn(index, 'dataType', value)
                          }
                        >
                          <SelectTrigger className="w-full bg-gray-100 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 rounded-none text-zinc-700 dark:text-zinc-200">
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 rounded-none">
                            <SelectItem value="NUMBER">NUMBER</SelectItem>
                            <SelectItem value="NUMBER(5)">NUMBER(5)</SelectItem>
                            <SelectItem value="NUMBER(5,2)">
                              NUMBER(5,2)
                            </SelectItem>
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
                            <SelectItem value="CHAR(14)">CHAR(14)</SelectItem>
                            <SelectItem value="CHAR(20)">CHAR(20)</SelectItem>
                            <SelectItem value="CHAR(30)">CHAR(30)</SelectItem>
                            <SelectItem value="BLOB">BLOB</SelectItem>
                            <SelectItem value="GENERIC">GENERIC</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-3 px-4">
                        <Input
                          value={column.constraint}
                          onChange={(e) =>
                            updateColumn(index, 'constraint', e.target.value)
                          }
                          placeholder="UNIQUE, CHECK, etc."
                          className="w-full bg-gray-100 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 rounded-none text-zinc-700 dark:text-zinc-200"
                        />
                      </td>
                      <td className="text-center py-3 px-4">
                        <Checkbox
                          checked={column.hasForeignKey}
                          onCheckedChange={(checked) =>
                            updateColumn(index, 'hasForeignKey', checked)
                          }
                          className="rounded-none bg-gray-100 dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 data-[state=checked]:bg-zinc-500 dark:data-[state=checked]:bg-zinc-600 data-[state=checked]:border-zinc-500 dark:data-[state=checked]:border-zinc-600"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <Input
                          value={column.foreignTable}
                          onChange={(e) =>
                            updateColumn(index, 'foreignTable', e.target.value)
                          }
                          placeholder="nombre_tabla_referencia"
                          disabled={!column.hasForeignKey}
                          className="w-full bg-gray-100 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 rounded-none text-zinc-700 dark:text-zinc-200"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <Input
                          value={column.comment}
                          onChange={(e) =>
                            updateColumn(index, 'comment', e.target.value)
                          }
                          placeholder="Descripción del campo"
                          className="w-full bg-gray-100 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 rounded-none text-zinc-700 dark:text-zinc-200"
                        />
                      </td>
                      <td className="text-center py-3 px-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteColumn(index)}
                          disabled={columns.length === 1}
                          className="h-8 w-8 p-0 hover:bg-red-900/20 hover:text-red-400 text-zinc-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-6 border-t border-zinc-800 mt-8 flex gap-4 flex-wrap">
              <Button
                onClick={saveScript}
                className="bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-100 rounded-none h-9 transition-all duration-200 action-button"
              >
                <FileCode className="mr-2 h-4 w-4" />
                {editingScriptId
                  ? 'Actualizar Script'
                  : 'Generar Script de Tabla'}
              </Button>
              <Button
                onClick={generateInsertProcedure}
                variant="outline"
                className="border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-none h-9"
              >
                Generar Procedimiento INSERT
              </Button>
              <Button
                onClick={generateUpdateProcedure}
                variant="outline"
                className="border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-none h-9 transition-all duration-200"
              >
                Generar Procedimiento UPDATE
              </Button>
              <Button
                className={`bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-100 rounded-none h-9 transition-all duration-200 ${
                  isSavingToRedis ? 'loading-button' : ''
                }`}
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
                        tableComment: tableComment,
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
                      } else if (result.isUpdate) {
                        // Si fue una actualización basada en el nombre de la tabla
                        setSavedScripts((prev) =>
                          prev.map((s) =>
                            s.id === result.script.id ? result.script : s
                          )
                        );
                      } else {
                        // Agregar el nuevo script a la lista
                        setSavedScripts((prev) => [...prev, result.script]);
                      }

                      setAlertConfig({
                        type: 'success',
                        title: 'Éxito',
                        description: result.isUpdate
                          ? 'Script actualizado en Redis exitosamente'
                          : editingScriptId
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
          </div>

          {/* Lista de scripts guardados */}
          {savedScripts.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 slide-up">
              <div className="border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex items-center justify-between">
                <h2 className="text-lg font-normal text-zinc-800 dark:text-zinc-100">
                  Scripts Guardados
                </h2>
                <div className="flex gap-2">
                  <Input
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-gray-100 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 w-[180px] rounded-none text-zinc-700 dark:text-zinc-200 h-8 text-xs"
                  />
                  <Select
                    value={typeFilter}
                    onValueChange={(value: 'all' | 'create' | 'alter') =>
                      setTypeFilter(value)
                    }
                  >
                    <SelectTrigger className="bg-gray-100 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 rounded-none text-zinc-700 dark:text-zinc-200 w-[120px] h-8 text-xs">
                      <SelectValue placeholder="Filtrar" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700 rounded-none text-xs">
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="create">CREATE</SelectItem>
                      <SelectItem value="alter">ALTER</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <div className="flex items-center border-b border-zinc-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/30">
                  <div
                    className="w-[300px] py-2 px-4 flex items-center gap-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800/40"
                    onClick={() => requestSort('tableName')}
                  >
                    <span className="text-zinc-600 dark:text-zinc-400 font-normal text-xs">
                      Nombre de Tabla
                    </span>
                    {sortConfig.key === 'tableName' && (
                      <span>
                        {sortConfig.direction === 'asc' ? (
                          <ArrowUp className="h-3 w-3 text-zinc-500 dark:text-zinc-400" />
                        ) : (
                          <ArrowDown className="h-3 w-3 text-zinc-500 dark:text-zinc-400" />
                        )}
                      </span>
                    )}
                  </div>
                  <div
                    className="w-[100px] py-2 px-4 flex items-center gap-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800/40"
                    onClick={() => requestSort('type')}
                  >
                    <span className="text-zinc-600 dark:text-zinc-400 font-normal text-xs">
                      Tipo
                    </span>
                    {sortConfig.key === 'type' && (
                      <span>
                        {sortConfig.direction === 'asc' ? (
                          <ArrowUp className="h-3 w-3 text-zinc-500 dark:text-zinc-400" />
                        ) : (
                          <ArrowDown className="h-3 w-3 text-zinc-500 dark:text-zinc-400" />
                        )}
                      </span>
                    )}
                  </div>
                  <div
                    className="w-[180px] py-2 px-4 flex items-center gap-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800/40"
                    onClick={() => requestSort('createdAt')}
                  >
                    <span className="text-zinc-600 dark:text-zinc-400 font-normal text-xs">
                      Modificación
                    </span>
                    {sortConfig.key === 'createdAt' && (
                      <span>
                        {sortConfig.direction === 'asc' ? (
                          <ArrowUp className="h-3 w-3 text-zinc-500 dark:text-zinc-400" />
                        ) : (
                          <ArrowDown className="h-3 w-3 text-zinc-500 dark:text-zinc-400" />
                        )}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 py-2 px-4 text-right">
                    <span className="text-zinc-400 font-normal text-xs">
                      Acciones
                    </span>
                  </div>
                </div>

                {sortedScripts.map((script, index) => (
                  <div
                    key={script.id}
                    className="flex items-center border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-800/40 transition-all"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="w-[300px] py-2 px-4 flex items-center">
                      <span className="text-zinc-800 dark:text-zinc-200 text-sm truncate">
                        {script.tableName}
                      </span>
                    </div>
                    <div className="w-[100px] py-2 px-4">
                      <span
                        className={`text-xs font-medium py-1 px-2 rounded-sm ${
                          script.isAlterTable
                            ? 'bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300'
                            : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                        }`}
                      >
                        {script.isAlterTable ? 'ALTER' : 'CREATE'}
                      </span>
                    </div>
                    <div className="w-[180px] py-2 px-4">
                      <span className="text-zinc-500 text-xs">
                        {new Date(script.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex-1 py-2 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setPreviewScript(script.script);
                            setPreviewTitle(`Script de ${script.tableName}`);
                            setShowPreview(true);
                          }}
                          className="h-7 w-7 p-0 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200"
                          title="Ver script"
                        >
                          <FileCode className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(script.script);

                            // Animar el botón cuando se hace clic
                            const button = document.activeElement;
                            if (button) {
                              button.classList.add('scale-in');
                              setTimeout(() => {
                                button.classList.remove('scale-in');
                              }, 300);
                            }

                            setAlertConfig({
                              type: 'success',
                              title: 'Éxito',
                              description: 'Script copiado al portapapeles',
                            });
                            setShowAlert(true);
                            setTimeout(() => setShowAlert(false), 3000);
                          }}
                          className="h-7 w-7 p-0 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200"
                          title="Copiar al portapapeles"
                        >
                          <ClipboardCopy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyWithFormat(script)}
                          className="h-7 w-7 p-0 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200"
                          title="Copiar con formato"
                        >
                          <FileSpreadsheet className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => duplicateScript(script)}
                          className="h-7 w-7 p-0 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                          title="Duplicar como nuevo"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => loadScript(script)}
                          className="h-7 w-7 p-0 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                          title="Editar script"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setScriptToDelete(script);
                            setShowDeleteConfirm(true);
                          }}
                          className="h-7 w-7 p-0 text-zinc-500 hover:text-red-400 hover:bg-zinc-800"
                          title="Eliminar script"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-800 rounded-none p-0 dialog-content">
          <div className="flex flex-col">
            <div className="border-b border-zinc-800 px-4 py-3">
              <DialogTitle className="text-base font-normal text-zinc-300">
                Confirmar Eliminación
              </DialogTitle>
              <DialogDescription className="text-zinc-500 mt-2">
                ¿Estás seguro que deseas eliminar el script de la tabla{' '}
                <span className="text-zinc-300">
                  {scriptToDelete?.tableName}
                </span>
                ? Esta acción no se puede deshacer.
              </DialogDescription>
            </div>
            <div className="px-4 py-3 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setScriptToDelete(null);
                }}
                className="border-zinc-700 hover:bg-zinc-800 text-zinc-300 rounded-none"
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
                className="bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-100 rounded-none"
              >
                Eliminar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] min-w-[800px] bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-none p-0 flex flex-col h-[80vh] dialog-content">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 shrink-0">
            <DialogTitle className="text-base font-normal flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
              <FileCode className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
              {previewTitle}
            </DialogTitle>
            <Button
              onClick={() => setShowPreview(false)}
              variant="ghost"
              className="h-6 w-6 p-0 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full"
            >
              <span className="sr-only">Cerrar</span>
            </Button>
          </div>

          <div className="overflow-auto flex-grow p-4 relative">
            <pre className="font-mono text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre overflow-x-auto w-full h-full">
              {previewScript}
            </pre>
          </div>

          <div className="border-t border-zinc-200 dark:border-zinc-800 px-4 py-3 flex justify-between items-center shrink-0">
            <div className="text-xs text-zinc-500">
              {new Date().toLocaleString()}
            </div>
            <Button
              id="copy-button"
              onClick={copyToClipboard}
              variant="ghost"
              className="text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-sm h-7 text-xs transition-all duration-200"
            >
              <ClipboardCopy className="h-3.5 w-3.5 mr-2" />
              Copiar Script
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {showAlert && (
        <div className="fixed bottom-4 right-4 z-50 fade-in">
          <Alert className="border-l-4 border-l-zinc-400 dark:border-l-zinc-600 bg-white dark:bg-zinc-900 shadow-md border border-zinc-200 dark:border-zinc-800">
            {alertConfig.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
            ) : (
              <AlertCircle className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
            )}
            <AlertTitle
              className={'text-zinc-700 dark:text-zinc-300 font-normal'}
            >
              {alertConfig.title}
            </AlertTitle>
            <AlertDescription className={'text-zinc-600 dark:text-zinc-400'}>
              {alertConfig.description}
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}
