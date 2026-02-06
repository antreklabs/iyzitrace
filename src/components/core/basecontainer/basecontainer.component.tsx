import React, { useState, useEffect } from 'react';
import { Card, Alert, Button } from 'antd';
import { WarningOutlined, SettingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

import '../../../assets/styles/base/basecontainer.component.css';
import BaseContainerHeader from './basecontainerheader.component';
import { areDatasourcesConfigured } from '../../../api/service/observability-auth.service';

interface BaseConatinerProps {
  title: string;
  children?: React.ReactNode;
  showHeaderActions?: boolean;
}

const BaseContainer: React.FC<BaseConatinerProps> = ({ title, children, showHeaderActions = true }) => {
  const navigate = useNavigate();
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [checkComplete, setCheckComplete] = useState(false);

  useEffect(() => {
    const checkApiKey = async () => {
      try {
        const configured = await areDatasourcesConfigured();
        setApiKeyMissing(!configured);
      } catch {
        setApiKeyMissing(true);
      } finally {
        setCheckComplete(true);
      }
    };
    checkApiKey();
  }, []);

  const resolvedPageName = (() => {
    try {
      const path = (window.location.pathname || '').replace(/\/+$/, '');
      const last = path.split('/').filter(Boolean).pop() || '';
      return last;
    } catch {
      return undefined;
    }
  })();

  const handleGoToSettings = () => {
    navigate('/a/iyzitrace-app/settings?tab=security');
  };

  return (
    <Card title={<BaseContainerHeader title={title} pageName={resolvedPageName ?? undefined} showHeaderActions={showHeaderActions} />}
      className="base-container"
      styles={{ body: { overflow: 'auto' } }}>
      {checkComplete && apiKeyMissing && (
        <Alert
          message="API Key Not Configured"
          description={
            <span>
              To access observability data, please configure your API key in Settings → Security tab.
              <Button
                type="link"
                icon={<SettingOutlined />}
                onClick={handleGoToSettings}
                style={{ padding: '0 8px' }}
              >
                Go to Settings
              </Button>
            </span>
          }
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: 16 }}
        />
      )}
      {children as any}
    </Card>
  );
};

export default BaseContainer;