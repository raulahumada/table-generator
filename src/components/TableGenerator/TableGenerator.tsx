'use client';

import { useState } from 'react';
import { TableData, TableRowData } from '@/types/table';
import TableRow from './TableRow';

const TableGenerator = () => {
  const [tableData, setTableData] = useState<TableData>({
    tableName: '',
    tableComment: '',
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
    const { tableName, tableComment, rows } = tableData;
    let sql = `CREATE TABLE ${tableName} (\n`;

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

    return sql;
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Nombre de la tabla"
          value={tableData.tableName}
          onChange={(e) =>
            setTableData((prev) => ({ ...prev, tableName: e.target.value }))
          }
          className="border p-2 rounded mr-2"
        />
        <input
          type="text"
          placeholder="Comentario de la tabla"
          value={tableData.tableComment}
          onChange={(e) =>
            setTableData((prev) => ({ ...prev, tableComment: e.target.value }))
          }
          className="border p-2 rounded"
        />
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
