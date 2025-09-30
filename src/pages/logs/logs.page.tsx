import React from 'react';

import BasePage from '../base.page';
import LogContainer from '../../containers/log/log.container';
import { useParams } from 'react-router-dom';

function Logs() {
  const { start, end, id } = useParams<{ start?: string; end?: string, id?: string }>();
  const startNumber = start ? parseInt(start) : undefined;
  const endNumber = end ? parseInt(end) : undefined;

  return (
    <BasePage>
      <LogContainer start={startNumber} end={endNumber} id={id} />
    </BasePage>
  );
}

export default Logs;