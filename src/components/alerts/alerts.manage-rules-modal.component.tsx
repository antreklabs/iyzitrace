import React, { useEffect, useState } from 'react';
import { Modal, Checkbox, Badge, Spin } from 'antd';
import { css } from '@emotion/css';
import { getAlertRules } from '../../api/service/alert.service';

interface AlertsManageRulesModalProps {
  visible: boolean;
  onClose: () => void;
}

interface GrafanaRule {
  name: string;
  state: string;
  health?: string;
  query?: string;
  type?: string;
  uid?: string;
  lastError?: string;
  [key: string]: any;
}

interface GrafanaRuleGroup {
  file: string;
  name: string;
  rules: GrafanaRule[];
  [key: string]: any;
}

interface AlertRulesResponse {
  status: string;
  data: {
    groups: GrafanaRuleGroup[];
  };
  totals?: {
    error?: number;
    inactive?: number;
  };
}

const getStyles = () => ({
  modal: css`
    .ant-modal-content {
      background: #1a1a1a;
      color: #fff;
    }
    
    .ant-modal-header {
      background: #2a2a2a;
      border-bottom: 1px solid #404040;
    }
    
    .ant-modal-title {
      color: #fff;
    }
    
    .ant-modal-body {
      background: #1a1a1a;
    }
  `,
  ruleItem: css`
    display: flex;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #404040;
    
    &:last-child {
      border-bottom: none;
    }
  `,
  ruleContent: css`
    margin-left: 12px;
    flex: 1;
  `,
  ruleName: css`
    color: #fff;
    font-weight: 500;
    margin-bottom: 4px;
  `,
  ruleDescription: css`
    color: #8c8c8c;
    font-size: 12px;
    margin-bottom: 4px;
  `,
  ruleQuery: css`
    color: #8c8c8c;
    font-size: 11px;
    font-family: monospace;
    word-break: break-all;
  `,
  ruleMeta: css`
    display: flex;
    gap: 8px;
    margin-top: 4px;
    align-items: center;
  `,
  loadingContainer: css`
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 40px;
  `,
  emptyContainer: css`
    text-align: center;
    padding: 40px;
    color: #8c8c8c;
  `,
});

const AlertsManageRulesModal: React.FC<AlertsManageRulesModalProps> = ({
  visible,
  onClose,
}) => {
  const styles = getStyles();
  const [loading, setLoading] = useState(false);
  const [rules, setRules] = useState<GrafanaRule[]>([]);

  useEffect(() => {
    if (visible) {
      loadGrafanaRules();
    } else {
      // Reset state when modal closes
      setRules([]);
    }
  }, [visible]);

  const loadGrafanaRules = async () => {
    setLoading(true);
    try {
      const response = await getAlertRules() as AlertRulesResponse;
      console.log('allRules', response);

      // Flatten rules from groups
      const flattenedRules: GrafanaRule[] = [];
      
      if (response?.data?.groups) {
        response.data.groups.forEach((group: GrafanaRuleGroup) => {
          if (group.rules && Array.isArray(group.rules)) {
            group.rules.forEach((rule: GrafanaRule) => {
              flattenedRules.push(rule);
            });
          }
        });
      }

      setRules(flattenedRules);
    } catch (error: any) {
      console.error('Error loading Grafana rules:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check if rule is active (should be checked)
  // Inactive rules should be unchecked
  const isRuleActive = (rule: GrafanaRule): boolean => {
    return rule.state !== 'inactive';
  };

  // Get health badge color
  const getHealthColor = (health?: string): string => {
    if (!health) return 'default';
    switch (health.toLowerCase()) {
      case 'error':
        return 'red';
      case 'ok':
        return 'green';
      case 'nodata':
        return 'orange';
      default:
        return 'default';
    }
  };

  return (
    <Modal
      title="Manage Alert Rules"
      open={visible}
      onCancel={onClose}
      footer={null}
      className={styles.modal}
      width={800}
    >
      <div style={{ maxHeight: 600, overflowY: 'auto' }}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <Spin size="large" />
          </div>
        ) : rules.length === 0 ? (
          <div className={styles.emptyContainer}>
            No alert rules found
          </div>
        ) : (
          rules.map((rule: GrafanaRule) => {
            const isActive = isRuleActive(rule);
            
            return (
              <div key={rule.uid || rule.name} className={styles.ruleItem}>
                <Checkbox
                  checked={isActive}
                  disabled={true}
                  style={{ cursor: 'not-allowed' }}
                />
                <div className={styles.ruleContent}>
                  <div className={styles.ruleName}>{rule.name}</div>
                  {rule.query && (
                    <div className={styles.ruleQuery}>{rule.query}</div>
                  )}
                  <div className={styles.ruleMeta}>
                    {rule.health && (
                      <Badge 
                        color={getHealthColor(rule.health)} 
                        text={`Health: ${rule.health}`}
                        style={{ color: '#8c8c8c', fontSize: 11 }}
                      />
                    )}
                    {rule.state && (
                      <Badge 
                        color="default" 
                        text={`State: ${rule.state}`}
                        style={{ color: '#8c8c8c', fontSize: 11 }}
                      />
                    )}
                    {rule.type && (
                      <Badge 
                        color="blue" 
                        text={`Type: ${rule.type}`}
                        style={{ color: '#8c8c8c', fontSize: 11 }}
                      />
                    )}
                  </div>
                  {rule.lastError && (
                    <div style={{ color: '#dc2626', fontSize: 11, marginTop: 4 }}>
                      Error: {rule.lastError}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </Modal>
  );
};

export default AlertsManageRulesModal;

