'use client';

import { useState } from 'react';
import { TableData, TableRowData } from '@/types/table';
import TableRow from './TableRow';

const TableGenerator = () => {
  const [tableData, setTableData] = useState<TableData>({
    tableName: '',
    tableComment: '',
    isAlter: false,
    rows: [],
  });

  const addRow = () => {
    const newRow: TableRowData = {
      columnName: '',
      dataType: '',
      size: '',
      isPrimaryKey: false,
      isNullable: false,
      columnComment: '',
    };
    setTableData((prev) => ({
      ...prev,
      rows: [...prev.rows, newRow],
    }));
  };

  const updateRow = (index: number, updatedRow: TableRowData) => {
    setTableData((prev) => ({
      ...prev,
      rows: prev.rows.map((row, i) => (i === index ? updatedRow : row)),
    }));
  };

  const deleteRow = (index: number) => {
    setTableData((prev) => ({
      ...prev,
      rows: prev.rows.filter((_, i) => i !== index),
    }));
  };

  const generateSQL = () => {
    const { tableName, tableComment, rows, isAlter } = tableData;
    let sql = '';

    if (!isAlter) {
      // Generar script CREATE TABLE
      sql = `CREATE TABLE ${tableName} (\n`;

      const primaryKeys = rows.filter((row) => row.isPrimaryKey);
      const hasPrimaryKey = primaryKeys.length > 0;

      rows.forEach((row, index) => {
        const { columnName, dataType, size, isNullable, columnComment } = row;
        const sizeStr = size ? `(${size})` : '';
        const nullableStr = isNullable ? 'NULL' : 'NOT NULL';
        const commentStr = columnComment ? ` COMMENT '${columnComment}'` : '';

        sql += `  ${columnName} ${dataType}${sizeStr} ${nullableStr}${commentStr}`;
        if (index < rows.length - 1 || hasPrimaryKey) sql += ',\n';
      });

      if (hasPrimaryKey) {
        const pkColumns = primaryKeys.map((row) => row.columnName).join(', ');
        sql += `  PRIMARY KEY (${pkColumns})\n`;
      }

      sql += `)`;
      if (tableComment) {
        sql += ` COMMENT '${tableComment}'`;
      }
      sql += ';';
    } else {
      // Generar script ALTER TABLE
      if (tableComment) {
        sql += `COMMENT ON TABLE ${tableName} IS '${tableComment}';\n\n`;
      }

      // Generar ALTER TABLE para cada columna
      rows.forEach((row) => {
        const { columnName, dataType, size, isNullable, columnComment } = row;
        const sizeStr = size ? `(${size})` : '';
        const nullableStr = isNullable ? 'NULL' : 'NOT NULL';

        sql += `ALTER TABLE ${tableName} ADD ${columnName} ${dataType}${sizeStr} ${nullableStr};\n`;

        if (columnComment) {
          sql += `COMMENT ON COLUMN ${tableName}.${columnName} IS '${columnComment}';\n`;
        }
      });

      // Agregar constraint de primary key si hay columnas PK
      const primaryKeys = rows.filter((row) => row.isPrimaryKey);
      if (primaryKeys.length > 0) {
        const pkColumns = primaryKeys.map((row) => row.columnName).join(', ');
        sql += `\nALTER TABLE ${tableName} ADD CONSTRAINT PK_${tableName} PRIMARY KEY (${pkColumns});\n`;
      }
    }

    return sql;
  };

  return (
    <div className="p-4">
      <div className="mb-6 bg-white rounded-lg border shadow-sm">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-700">
            Información de la Tabla
          </h2>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la Tabla
              </label>
              <input
                type="text"
                placeholder="Nombre de la tabla"
                value={tableData.tableName}
                onChange={(e) =>
                  setTableData((prev) => ({
                    ...prev,
                    tableName: e.target.value,
                  }))
                }
                className="border p-2 rounded w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comentario de la Tabla
              </label>
              <input
                type="text"
                placeholder="Comentario de la tabla"
                value={tableData.tableComment}
                onChange={(e) =>
                  setTableData((prev) => ({
                    ...prev,
                    tableComment: e.target.value,
                  }))
                }
                className="border p-2 rounded w-full"
              />
            </div>
          </div>

          <div className="flex items-center mt-4 p-3 bg-gray-50 rounded-lg border">
            <input
              type="checkbox"
              id="alterType"
              checked={tableData.isAlter}
              onChange={(e) =>
                setTableData((prev) => ({
                  ...prev,
                  isAlter: e.target.checked,
                }))
              }
              className="w-5 h-5 text-yellow-600 rounded border-gray-300 focus:ring-yellow-500"
            />
            <label htmlFor="alterType" className="ml-2 flex items-center">
              <span className="font-medium text-gray-700">
                Generar como ALTER TABLE
              </span>
              {tableData.isAlter && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                  Activo
                </span>
              )}
            </label>
          </div>

          {tableData.isAlter && (
            <div className="mt-2 text-sm text-gray-500 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <div className="flex items-center">
                <svg
                  className="h-5 w-5 text-yellow-400 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>
                  Todos los campos se agregarán usando comandos{' '}
                  <code className="text-yellow-700 bg-yellow-100 px-1 py-0.5 rounded">
                    ALTER TABLE ADD
                  </code>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Nombre de columna</th>
            <th className="border p-2">Tipo de dato</th>
            <th className="border p-2">Tamaño</th>
            <th className="border p-2">PK</th>
            <th className="border p-2">Nullable</th>
            <th className="border p-2">Comentario</th>
            <th className="border p-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {tableData.rows.map((row, index) => (
            <TableRow
              key={index}
              row={row}
              index={index}
              updateRow={updateRow}
              deleteRow={deleteRow}
            />
          ))}
        </tbody>
      </table>

      <div className="mt-4 flex gap-2">
        <button
          onClick={addRow}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Agregar fila
        </button>
        <button
          onClick={() => {
            const sql = generateSQL();
            console.log(sql);
          }}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Generar SQL
        </button>
      </div>
    </div>
  );
};

export default TableGenerator;
