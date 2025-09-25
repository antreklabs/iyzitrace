import React, { useMemo, useState } from 'react';
import './GroupedAttributeList.css';
import { Collapse, Tag, Tooltip, TooltipProps } from 'antd';

interface GroupedAttributeListProps {
  tags: Record<string, string | number | boolean>;
}

const groupTagsByNamespace = (tags: Record<string, any>) => {
  const grouped: Record<string, Record<string, any>> = {};
  Object.entries(tags).forEach(([key, value]) => {
    const [prefix, ...rest] = key.split('.');
    const subKey = rest.join('.');
    if (!grouped[prefix]) {grouped[prefix] = {};}
    grouped[prefix][subKey] = value;
  });
  return grouped;
};

const GroupedAttributeList: React.FC<GroupedAttributeListProps> = ({ tags }) => {
  const groupedTags = groupTagsByNamespace(tags);
  const [arrow] = useState<'Show' | 'Hide' | 'Center'>('Show');

  const mergedArrow = useMemo<TooltipProps['arrow']>(() => {
    if (arrow === 'Hide') {
      return false;
    }

    if (arrow === 'Show') {
      return true;
    }

    return {
      pointAtCenter: true,
    };
  }, [arrow]);

  const collapseItems = Object.entries(groupedTags).map(([group, items]) => ({
    key: group,
    label: group,
    children: (
      <div>
        {Object.entries(items).map(([subKey, value]) => {
          if (subKey.includes('.')) {
            const [subGroup, ...rest] = subKey.split('.');
            const innerKey = rest.join('.');
            return (
              <Collapse key={subKey} bordered={false} ghost items={[{
                key: subKey,
                label: subGroup,
                children: (
                  <div className="tag-row">
                    <Tag className="tag-key">{innerKey}</Tag>
                    <span className="tag-value">{String(value)}</span>
                  </div>
                )
              }]} />
            );
          }

          return (
            <div key={subKey} className="tag-row">
              <Tag className="tag-key">{subKey}</Tag>
              {String(value).length<=20?<span className="tag-value">{String(value)}</span> : 
              <Tooltip placement="topLeft" title={String(value)} arrow={mergedArrow}>
                 <span className="tag-value">{String(value).substring(0,20)+'...'}</span>
              </Tooltip>}
            </div>
          );
        })}
      </div>
    )
  }));

  return (
    <Collapse bordered={false} defaultActiveKey={[]} ghost items={collapseItems} />
  );
};

export default GroupedAttributeList;
