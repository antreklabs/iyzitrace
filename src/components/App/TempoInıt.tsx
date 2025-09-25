import React, { useEffect } from 'react';
import { useAppDispatch } from '../../store/hooks';
import { setSelectedTempoUid, setTempoUids } from '../../store/slices/tempo.slice';
import { getDataSourceSrv } from '@grafana/runtime';
import { getTempoUidFromLocal, saveTempoUidToLocal } from '../../utils';

const TempoInitializer: React.FC = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const loadTempos = async () => {
      const listFromGrafana = getDataSourceSrv()
        .getList()
        .filter((ds) => ds.type === 'tempo');

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

    loadTempos();
  }, [dispatch]);

  return null; // Görünmez component
}

export default TempoInitializer;
