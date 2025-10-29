import React from 'react';
import { Table, Input, Typography } from 'antd';
import { IoIosArrowForward, IoIosArrowDown } from "react-icons/io";
import { useLocation, useNavigate } from 'react-router-dom';
import { TableColumn } from '../api/service/table.services';
import { getFilterParams, updateUrlParams } from '../api/service/query.service';
import '../assets/styles/base/base.container.css';

const { Title } = Typography;

export interface BaseTableProps {
  data: any[];
  columns: TableColumn | undefined;
  onExpandedRowRender?: (record: any) => React.ReactNode;
  // onPageSizeChange: () => void;
  title?: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
}

const BaseTable: React.FC<BaseTableProps> = ({
  data,
  columns,
  onExpandedRowRender,
  // onPageSizeChange,
  title = "Data Table",
  showSearch = true,
  searchPlaceholder = "Search..."
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get search query and page count from URL
  const filterModel = getFilterParams();
  const query = filterModel.query;
  const pageCount = parseInt(filterModel.options.pageCount, 10);

  // Filter data based on search query
  const filteredData = query
    ? data.filter((item: any) =>
        Object.values(item).some(value =>
          typeof value === 'string' && String(value).toLowerCase().includes(query.toLowerCase())
        )
      )
    : data;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const newSearch = updateUrlParams({ q: value || null });
    navigate(`${location.pathname}?${newSearch}`, { replace: true });
  };

  const handleSearch = (value: string) => {
    const trimmedValue = value.trim();
    const newSearch = updateUrlParams({ q: trimmedValue || null });
    navigate(`${location.pathname}?${newSearch}`, { replace: true });
  };

  const renderExpandIcon = (expanded: boolean, onExpand: any, record: any, fontSize?: string) => {
    const iconStyle = fontSize ? { fontSize } : {};
    return expanded ? (
      <IoIosArrowDown
        onClick={(e: any) => onExpand(record, e)}
        className="base-container-icon"
        style={iconStyle}
      />
    ) : (
      <IoIosArrowForward
        onClick={(e: any) => onExpand(record, e)}
        className="base-container-icon"
        style={iconStyle}
      />
    );
  };

  const renderNestedTable = (record: any, level: 'L1' | 'L2' | 'L3') => {
    const levelColumns = level === 'L1' ? columns?.L1Columns : 
                        level === 'L2' ? columns?.L2Columns : 
                        columns?.L3Columns;
    
    const levelData = level === 'L1' ? record.applications :
                     level === 'L2' ? record.services :
                     record.operations;

    if (!levelData || levelData.length === 0 || !levelColumns || levelColumns.length === 0) {
      return null;
    }

    const filteredColumns = levelColumns.filter((c: any) => 
      !(c.className || '').includes('column-hidden') && 
      c.width !== 0 && 
      c.title !== ''
    );

    if (level === 'L3') {
      // Level 3 (Operations) - no further expansion
      return (
        <Table
          rowKey={(operationRecord: any) => 
            operationRecord.id ?? operationRecord.key ?? operationRecord.text ?? operationRecord.name ?? JSON.stringify(operationRecord)
          }
          dataSource={levelData}
          columns={filteredColumns}
          pagination={false}
          size="small"
          bordered
        />
      );
    }

    // Level 1 and 2 - can expand further
    return (
      <Table
        rowKey={(record: any) => 
          record.id ?? record.key ?? record.text ?? record.name ?? JSON.stringify(record)
        }
        dataSource={levelData}
        columns={filteredColumns}
        expandable={{
          expandedRowRender: (nestedRecord: any) => {
            if (level === 'L1') {
              return renderNestedTable(nestedRecord, 'L2');
            } else if (level === 'L2') {
              return renderNestedTable(nestedRecord, 'L3');
            }
            return null;
          },
          expandIcon: ({ expanded, onExpand, record }) =>
            renderExpandIcon(expanded, onExpand, record, '12px'),
        }}
        pagination={false}
        size="small"
        bordered
      />
    );
  };

  if (!columns || !columns.RootColumns || columns.RootColumns.length === 0) {
    return null;
  }

  const filteredRootColumns = columns.RootColumns.filter((c: any) => 
    !(c.className || '').includes('column-hidden') && 
    c.width !== 0 && 
    c.title !== ''
  );

  return (
    <div className="base-table-container">
      {showSearch && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0, color: '#ffffff' }}>{title}</Title>
          <Input.Search
            allowClear
            placeholder={searchPlaceholder}
            style={{ maxWidth: 360 }}
            value={query}
            onChange={handleSearchChange}
            onSearch={handleSearch}
          />
        </div>
      )}
      
      <Table
        rowKey={(record: any) => 
          record.id ?? record.key ?? record.text ?? record.name ?? JSON.stringify(record)
        }
        dataSource={filteredData}
        columns={filteredRootColumns}
        expandable={onExpandedRowRender ? {
          expandedRowRender: onExpandedRowRender,
          expandIcon: ({ expanded, onExpand, record }) =>
            renderExpandIcon(expanded, onExpand, record),
        } : {
          expandedRowRender: (record: any) => {
            // Level 1 (Applications) expansion
            if (record.applications && record.applications.length > 0) {
              return renderNestedTable(record, 'L1');
            }
            return null;
          },
          expandIcon: ({ expanded, onExpand, record }) => {
            const hasChildren = record.applications && record.applications.length > 0;
            if (!hasChildren) return null;
            
            return renderExpandIcon(expanded, onExpand, record);
          },
        }}
        scroll={{ x: 'max-content', y: 'calc(100vh - 300px)' }}
        pagination={{
          pageSize: pageCount,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          showQuickJumper: false,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          onShowSizeChange: (current, size) => {
            // Update URL with new page size
            const newSearch = updateUrlParams({ option_pageCount: size.toString() });
            navigate(`${location.pathname}?${newSearch}`, { replace: true });
          }
        }}
        size="middle"
        bordered={false}
        style={{
          backgroundColor: 'transparent'
        }}
      />
    </div>
  );
};

export default BaseTable;
