import React from 'react';
import { PageLayoutType } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import ExplorerContainer from '../containers/ExplorerContainer/ExplorerContainer';

function Explore() {

  return (
    <PluginPage layout={PageLayoutType.Canvas}>
      <ExplorerContainer></ExplorerContainer>
    </PluginPage>
  );
}

export default Explore;

