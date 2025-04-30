'use client';

import { TableRowData } from '@/types/table';

interface TableRowProps {
  row: TableRowData;
  index: number;
  updateRow: (index: number, row: TableRowData) => void;
  deleteRow: (index: number) => void;
}

const TableRow = ({ row, index, updateRow, deleteRow }: TableRowProps) => {
  const handleChange = (field: keyof TableRowData, value: any) => {
    updateRow(index, { ...row, [field]: value });
  };

  return (
    <tr>
      <td className="border p-2">
        <input
          type="text"
          value={row.columnName}
          onChange={(e) => handleChange('columnName', e.target.value)}
          className="w-full border rounded p-1"
          placeholder="Nombre de columna"
        />
      </td>
      <td className="border p-2">
        <select
          value={row.dataType}
          onChange={(e) => handleChange('dataType', e.target.value)}
          className="w-full border rounded p-1"
        >
          <option value="">Seleccionar tipo</option>
          <option value="VARCHAR2">VARCHAR2</option>
          <option value="NUMBER">NUMBER</option>
          <option value="DATE">DATE</option>
          <option value="CLOB">CLOB</option>
          <option value="BLOB">BLOB</option>
        </select>
      </td>
      <td className="border p-2">
        <input
          type="text"
          value={row.size}
          onChange={(e) => handleChange('size', e.target.value)}
          className="w-full border rounded p-1"
          placeholder="Tamaño"
        />
      </td>
      <td className="border p-2 text-center">
        <input
          type="checkbox"
          checked={row.isPrimaryKey}
          onChange={(e) => handleChange('isPrimaryKey', e.target.checked)}
          className="h-4 w-4"
        />
      </td>
      <td className="border p-2 text-center">
        <input
          type="checkbox"
          checked={row.isNullable}
          onChange={(e) => handleChange('isNullable', e.target.checked)}
          className="h-4 w-4"
        />
      </td>
      <td className="border p-2">
        <input
          type="text"
          value={row.columnComment}
          onChange={(e) => handleChange('columnComment', e.target.value)}
          className="w-full border rounded p-1"
          placeholder="Comentario"
        />
      </td>
      <td className="border p-2 text-center">
        <button
          onClick={() => deleteRow(index)}
          className="bg-red-500 text-white px-2 py-1 rounded"
        >
          Eliminar
        </button>
      </td>
    </tr>
  );
};

export default TableRow;
