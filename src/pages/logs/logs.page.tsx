import React from 'react';

import BasePage from '../base.page';
import LogContainer from '../../containers/log/log.container';
import { useParams } from 'react-router-dom';

function Logs() {
  const { id } = useParams<{ id?: string }>();

  return (
    <BasePage>
      <LogContainer id={id} range={[Date.now() - 60 * 60 * 1000, Date.now()]} />
    </BasePage>
  );
}

export default Logs;