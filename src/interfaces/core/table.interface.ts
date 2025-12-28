/* Table Interfaces */

export interface TableColumn {
    RootColumns: ColumnItem[];
    L1Columns?: ColumnItem[];
    L2Columns?: ColumnItem[];
    L3Columns?: ColumnItem[];
}

export interface ColumnItem {
    title: string;
    dataIndex: string;
    key: string;
    width?: number;
    align?: 'left' | 'right' | 'center';
    className?: string;
    onHeaderCell?: (column: any) => { className?: string; style?: any } | undefined;
    onCell?: (record: any, rowIndex?: number) => { className?: string; style?: any } | undefined;
    sorter?: (a: any, b: any) => number;
    render?: (value: any, record?: any) => any;
    filters?: { text: string; value: string }[];
    onFilter?: (value: any, record: any) => boolean;
    filterSearch?: boolean;
}
