import React, { useRef, useState, useMemo, ReactElement } from 'react';
import { Typography, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { Search } = Input;

interface HorizontalScrollContainerProps {
  children: React.ReactNode;
  title: string;
  icon?: React.ReactNode;
  searchable?: boolean;
  searchPlaceholder?: string;
  getSearchableText?: (child: ReactElement) => string;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

const HorizontalScrollContainer: React.FC<HorizontalScrollContainerProps> = ({ 
  children, 
  title, 
  icon,
  searchable = false,
  searchPlaceholder = 'Search...',
  getSearchableText,
  searchQuery: externalSearchQuery,
  onSearchChange
}) => {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  
  const handleSearchChange = (value: string) => {
    if (onSearchChange) {
      onSearchChange(value);
    } else {
      setInternalSearchQuery(value);
    }
  };

  const scrollBy = (delta: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  const filteredChildren = useMemo(() => {
    if (!searchable || !searchQuery) {
      return children;
    }

    if (!getSearchableText) {
      return children;
    }

    const childrenArray = React.Children.toArray(children);
    const query = searchQuery.toLowerCase();

    return childrenArray.filter((child) => {
      if (!React.isValidElement(child)) {
        return true;
      }

      try {
        const searchText = getSearchableText(child as ReactElement);
        if (!searchText || searchText.trim() === '') {
          return false;
        }
        return searchText.toLowerCase().includes(query);
      } catch (error) {
        return true;
      }
    });
  }, [children, searchQuery, searchable, getSearchableText]);

  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          {icon}
          {title}
        </Title>
        {searchable && (
          <Search
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onSearch={(value) => handleSearchChange(value)}
            prefix={<SearchOutlined />}
            allowClear
            style={{ width: '300px' }}
          />
        )}
      </div>
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => scrollBy(-400)}
          style={{ 
            position: 'absolute', 
            left: 0, 
            top: '50%', 
            transform: 'translateY(-50%)', 
            zIndex: 1, 
            background: '#1f1f1f', 
            border: '1px solid #303030', 
            color: '#d9d9d9', 
            borderRadius: 6, 
            padding: '4px 8px',
            cursor: 'pointer'
          }}
        >
          ◀
        </button>
      <div
        ref={scrollerRef}
        style={{ 
          overflowX: 'auto', 
          overflowY: 'hidden', 
          whiteSpace: 'nowrap', 
          padding: '0 36px' 
        }}
      >
        <div style={{ display: 'inline-flex', gap: 16 }}>
          {filteredChildren}
        </div>
      </div>
        <button
          onClick={() => scrollBy(400)}
          style={{ 
            position: 'absolute', 
            right: 0, 
            top: '50%', 
            transform: 'translateY(-50%)', 
            zIndex: 1, 
            background: '#1f1f1f', 
            border: '1px solid #303030', 
            color: '#d9d9d9', 
            borderRadius: 6, 
            padding: '4px 8px',
            cursor: 'pointer'
          }}
        >
          ▶
        </button>
      </div>
    </div>
  );
};

export default HorizontalScrollContainer;