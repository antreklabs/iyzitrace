import React from 'react';
import { css } from '@emotion/css';
import { Region } from '../../api/service/interface.service';

interface RegionGroupProps {
  data: {
    region: Region;
    groupSize: { width: number; height: number };
  };
}

export const RegionGroup: React.FC<RegionGroupProps> = ({ data }) => {
  const { region, groupSize } = data;
  const w = groupSize?.width || 560;
  const h = groupSize?.height || 300;

  const containerStyle = css`
    width: ${w}px;
    height: ${h}px;
    position: relative;
    border-radius: 20px;
    padding: 3px;
    background: linear-gradient(
      135deg,
      rgba(59, 130, 246, 0.12) 0%,
      rgba(147, 51, 234, 0.12) 50%,
      rgba(236, 72, 153, 0.12) 100%
    );
    box-shadow: 0 0 30px rgba(59, 130, 246, 0.15);
  `;

  const innerStyle = css`
    width: 100%;
    height: 100%;
    border-radius: 17px;
    background: linear-gradient(135deg, 
      rgba(15, 23, 42, 0.5) 0%,
      rgba(30, 41, 59, 0.5) 100%
    );
    border: 2px dashed rgba(148, 163, 184, 0.25);
    backdrop-filter: blur(16px);
    position: relative;
  `;

  const labelContainerStyle = css`
    position: absolute;
    bottom: -24px;
    left: 16px;
    z-index: 10;
  `;

  const labelStyle = css`
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: #e2e8f0;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.3px;
    background: linear-gradient(
      135deg,
      rgba(30, 41, 59, 0.95) 0%,
      rgba(51, 65, 85, 0.95) 100%
    );
    padding: 8px 16px;
    border-radius: 12px;
    border: 1px solid rgba(148, 163, 184, 0.25);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(16px);
  `;

  const iconStyle = css`
    font-size: 16px;
  `;

  const getRegionIcon = () => {
    const name = region.name?.toLowerCase() || '';
    if (name.includes('us') || name.includes('america')) return '🇺🇸';
    if (name.includes('eu') || name.includes('europe')) return '🇪🇺';
    if (name.includes('asia') || name.includes('ap')) return '🌏';
    if (name.includes('local') || name.includes('on-prem')) return '🏢';
    return '🌍';
  };

  const getInfraCount = () => {
    const count = region.infrastructures?.length || 0;
    if (count === 0) return '';
    return `(${count})`;
  };

  return (
    <div className={containerStyle}>
      <div className={innerStyle} />
      <div className={labelContainerStyle}>
        <div className={labelStyle}>
          <span className={iconStyle}>{getRegionIcon()}</span>
          <span>{region.name}</span>
          {getInfraCount() && (
            <span style={{
              color: '#94a3b8',
              fontSize: '11px',
              fontWeight: 500
            }}>
              {getInfraCount()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};