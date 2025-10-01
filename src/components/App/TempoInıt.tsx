import React, { useEffect } from 'react';
import { useAppDispatch } from '../../store/hooks';
import { setDataSourceUids, setSelectedDataSourceUid } from '../../store/slices/datasource.slice';
import { getDataSourceSrv } from '@grafana/runtime';
import { getPageState, updatePageState } from '../../utils';

const TempoInitializer: React.FC = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const loadDatasources = async () => {
      // Load Tempo datasources by default for backward compatibility
      const listFromGrafana = getDataSourceSrv()
        .getList()
        .filter((ds) => ds.type === 'tempo');

      const uidList = listFromGrafana.map((ds) => ds.uid);
      dispatch(setDataSourceUids(uidList));

      const pageState = getPageState('tempo');
      const savedUid = pageState?.selectedDataSourceUid;
      if (savedUid && uidList.includes(savedUid)) {
        dispatch(setSelectedDataSourceUid(savedUid));
      } else if (uidList.length > 0) {
        dispatch(setSelectedDataSourceUid(uidList[0]));
        updatePageState('tempo', { selectedDataSourceUid: uidList[0] });
      }
    };

    loadDatasources();
  }, [dispatch]);

  return null; // Görünmez component
}

export default TempoInitializer;
