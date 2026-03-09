import React, { useRef, useState, useMemo, ReactElement } from 'react';
import { Typography, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import '../../assets/styles/components/core/core.styles';

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
    <div className="horizontal-scroll-section">
      <div className="horizontal-scroll-header">
        <Title level={2} className="horizontal-scroll-title">
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
            className="horizontal-scroll-search"
          />
        )}
      </div>
      <div className="horizontal-scroll-wrapper">
        <button
          onClick={() => scrollBy(-400)}
          className="horizontal-scroll-btn horizontal-scroll-btn-left"
        >
          ◀
        </button>
        <div
          ref={scrollerRef}
          className="horizontal-scroll-content"
        >
          <div className="horizontal-scroll-items">
            {filteredChildren}
          </div>
        </div>
        <button
          onClick={() => scrollBy(400)}
          className="horizontal-scroll-btn horizontal-scroll-btn-right"
        >
          ▶
        </button>
      </div>
    </div>
  );
};

export default HorizontalScrollContainer;