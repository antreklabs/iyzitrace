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
  
  // Use external searchQuery if provided, otherwise use internal state
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
    // If no searchable or no query, show all children
    if (!searchable || !searchQuery) {
      return children;
    }

    // If no getSearchableText function, show all children (card-level filtering is handled inside cards)
    if (!getSearchableText) {
      return children;
    }

    // Card-level filtering (for Regions, Infrastructures)
    const childrenArray = React.Children.toArray(children);
    const query = searchQuery.toLowerCase();

    return childrenArray.filter((child) => {
      // Only process ReactElement children
      if (!React.isValidElement(child)) {
        return true; // Keep non-element children
      }

      try {
        const searchText = getSearchableText(child as ReactElement);
        if (!searchText || searchText.trim() === '') {
          return false; // No searchable text, hide it when searching
        }
        return searchText.toLowerCase().includes(query);
      } catch (error) {
        console.error('Error in getSearchableText:', error, child);
        return true; // On error, show the item
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

