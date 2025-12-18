import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Col, Row } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import GrafanaLikeRangePicker from '../graphanadatepicker';
import ViewComponent from '../view.component';

interface BaseContainerHeaderProps {
  title: string;
  pageName: string;
  showHeaderActions: boolean;
}

const BaseContainerHeader: React.FC<BaseContainerHeaderProps> = ({ title, pageName, showHeaderActions = true }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [range, setRange] = useState<[number, number]>([Date.now() - 60 * 15 * 1000, Date.now()]);
  
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    
    if (fromParam && toParam) {
      const fromTimestamp = parseInt(fromParam);
      const toTimestamp = parseInt(toParam);
      
      if (!isNaN(fromTimestamp) && !isNaN(toTimestamp)) {
        setRange([fromTimestamp, toTimestamp]);
      }
    }
  }, [location.search]);
  
  return (
    <motion.div
      initial={{ width: '160px' }}
      animate={{ width: '100%' }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className="filter-header"
    >
      <Row
        align="middle"
        justify="space-between"
        wrap={false}
        style={{width: '100%', height: 50 }}
      >
        {
}
        {title && (
          <Col flex={1} style={{ display: 'flex', justifyContent: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 20, textAlign: 'center' }}>{title}</h3>
          </Col>
        )}

        {
}
        {showHeaderActions && (
        <Col flex="none">
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <ViewComponent pageName={pageName} />
            <GrafanaLikeRangePicker 
              onChange={(start, end) => {
                setRange([start, end]);
              }}
              title="Date Range" 
              onApply={(start, end) => {
                setRange([start, end]);
                
                const searchParams = new URLSearchParams(location.search);
                searchParams.set('from', start.toString());
                searchParams.set('to', end.toString());
                const newURL = `${location.pathname}?${searchParams.toString()}`;
                navigate(newURL, { replace: true });
              }}
              value={range}
            />
          </div>
        </Col>
        )}
      </Row>
    </motion.div>
  );
};

export default BaseContainerHeader;