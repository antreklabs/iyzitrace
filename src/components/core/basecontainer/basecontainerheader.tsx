import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Col, Row, Select, Space } from 'antd';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { setSelectedTempoUid, setTempoUids } from '../../../store/slices/tempo.slice';
import { getDataSourceSrv } from '@grafana/runtime';
import { getTempoUidFromLocal, saveTempoUidToLocal } from '../../../utils';
import tempoLogoSvg from '../../../assets/images/tempo_logo.svg';

interface BaseContainerHeaderProps {
  title: string;
  headerActions?: React.ReactNode;
  children?: React.ReactNode;
}

const BaseContainerHeader: React.FC<BaseContainerHeaderProps> = ({ title, headerActions, children }) => {
  const dispatch = useAppDispatch();
  const { tempoUids, selectedTempoUid } = useAppSelector((state) => state.tempo);
  const [allList, setAllList] = useState<any[]>([]);

  useEffect(() => {
    const loadTempos = async () => {
      const listFromGrafana = getDataSourceSrv()
        .getList()
        .filter((ds) => ds.type !== 'grafana');

      setAllList(listFromGrafana);
      const uidList = listFromGrafana.map((ds) => ds.uid);
      dispatch(setTempoUids(uidList));

      const saved = getTempoUidFromLocal();
      if (saved && uidList.includes(saved)) {
        dispatch(setSelectedTempoUid(saved));
      } else if (uidList.length > 0) {
        dispatch(setSelectedTempoUid(uidList[0]));
        saveTempoUidToLocal(uidList[0]);
      }
    };

    // sadece tempoUids boşsa çalıştır
    if (tempoUids.length === 0) {
      loadTempos();
    }
  }, [dispatch, tempoUids]);

  const handleChange = (value: string) => {
    dispatch(setSelectedTempoUid(value));
    saveTempoUidToLocal(value);
  };

  return (
    <motion.div
      initial={{ width: '160px' }}
      animate={{ width: '100%' }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className="filter-header"
    >
      <Row
        size={0}
        style={{
          display: 'flex',
          flexWrap: 'nowrap',
          alignItems: 'center',
          gap: 12,
          paddingTop: 10,
        }}
      >
        <Col style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Select
            value={selectedTempoUid ?? undefined}
            style={{ minWidth: 200 }}
            onChange={handleChange}
            placeholder="Select Tempo Instance"
            options={allList.map((ds) => ({
              value: ds.uid,
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {ds.type === 'tempo' && <img src={tempoLogoSvg} width={16} height={16} alt="tempo" />}
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

          <h3 style={{ margin: 0, fontSize: 20 }}>{title}</h3>
          {children}
        </Col>

        <Col style={{ alignItems: 'flex-end' }}>{headerActions}</Col>
      </Row>
    </motion.div>
  );
};

export default BaseContainerHeader;
