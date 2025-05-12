export interface TableRowData {
  columnName: string;
  dataType: string;
  size: string;
  isPrimaryKey: boolean;
  isNullable: boolean;
  columnComment: string;
}

export interface TableData {
  tableName: string;
  tableComment: string;
  isAlter: boolean;
  rows: TableRowData[];
}
