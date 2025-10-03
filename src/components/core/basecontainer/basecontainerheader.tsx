import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Col, Row, Select } from 'antd';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { setDataSourceUids, setSelectedDataSourceUid } from '../../../store/slices/datasource.slice';
import { getDataSourceSrv } from '@grafana/runtime';
import { getPageState, updatePageState } from '../../../utils';
import tempoLogoSvg from '../../../assets/images/tempo_logo.svg';

interface BaseContainerHeaderProps {
  title: string;
  headerActions?: React.ReactNode;
  children?: React.ReactNode;
  datasourceType?: 'tempo' | 'loki';
}

const BaseContainerHeader: React.FC<BaseContainerHeaderProps> = ({ title, headerActions, children, datasourceType = 'tempo' }) => {
  const dispatch = useAppDispatch();
  const { selectedUid } = useAppSelector((state) => state.datasource);
  const [allList, setAllList] = useState<any[]>([]);

  useEffect(() => {
    const loadDatasources = async () => {
      const listFromGrafana = getDataSourceSrv()
        .getList()
        .filter((ds) => ds.type === datasourceType);

      setAllList(listFromGrafana);
      const uidList = listFromGrafana.map((ds) => ds.uid);
      
      // Datasource slice'ını set et
      dispatch(setDataSourceUids(uidList));

      // Sayfa state'inden datasource uid'i al
      const pageState = getPageState(datasourceType);
      const savedUid = pageState?.selectedDataSourceUid;
      if (savedUid && uidList.includes(savedUid)) {
        dispatch(setSelectedDataSourceUid(savedUid));
      } else if (uidList.length > 0) {
        dispatch(setSelectedDataSourceUid(uidList[0]));
        updatePageState(datasourceType, { selectedDataSourceUid: uidList[0] });
      }
    };

    // Her component mount'unda data source'ları yükle
    // Sayfa geçişlerinde dropdown'ın düzgün doldurulması için
    loadDatasources();
  }, [dispatch, datasourceType]);

  const handleChange = (value: string) => {
    dispatch(setSelectedDataSourceUid(value));
    updatePageState(datasourceType, { selectedDataSourceUid: value });
  };

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
        {/* Left: Data source selector (and optional children) */}
        <Col style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Select
            value={selectedUid ?? undefined}
            style={{ minWidth: 200 }}
            onChange={handleChange}
            placeholder={`Select ${datasourceType === 'loki' ? 'Loki' : 'Tempo'} Instance`}
            options={allList.map((ds) => ({
              value: ds.uid,
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {ds.type === 'tempo' && <img src={tempoLogoSvg} width={16} height={16} alt="tempo" />}
                  {ds.type === 'loki' && <img src="public/app/plugins/datasource/loki/img/loki_icon.svg" width={16} height={16} alt="loki" />}
                  {ds.type === 'prometheus' && (
                    <img
                      src="public/plugins/prometheus/img/prometheus_logo.svg"
                      width={16}
                      height={16}
                      alt="prometheus"
                    />
                  )}
                  <span>{ds.name}</span>
                </span>
              ),
            }))}
          />
          {children as any}
        </Col>

        {/* Center: Title */}
        <Col flex={1} style={{ display: 'flex', justifyContent: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 20, textAlign: 'center' }}>{title}</h3>
        </Col>

        {/* Right: Header actions */}
        <Col flex="none">
          <div style={{ display: 'flex', gap: 12 }}>{headerActions}</div>
        </Col>
      </Row>
    </motion.div>
  );
};

export default BaseContainerHeader;
