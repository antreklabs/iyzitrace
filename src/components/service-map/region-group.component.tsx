import React from 'react';
import { css, keyframes } from '@emotion/css';
import { Region } from '../../api/service/interface.service';

interface RegionGroupProps {
  data: {
    region: Region;
    groupSize: { width: number; height: number };
  };
}

const borderFlow = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const shimmer = keyframes`
  0% { opacity: 0.3; }
  50% { opacity: 0.6; }
  100% { opacity: 0.3; }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-2px); }
`;

export const RegionGroup: React.FC<RegionGroupProps> = ({ data }) => {
  const { region, groupSize } = data;
  const w = groupSize?.width || 560;
  const h = groupSize?.height || 300;
  
  const containerStyle = css`
    width: ${w}px;
    height: ${h}px;
    position: relative;
    border-radius: 24px;
    padding: 4px;
    background: linear-gradient(
      135deg,
      rgba(59, 130, 246, 0.15) 0%,
      rgba(147, 51, 234, 0.15) 50%,
      rgba(236, 72, 153, 0.15) 100%
    );
    background-size: 200% 200%;
    animation: ${borderFlow} 8s ease infinite;
    box-shadow: 
      0 0 60px rgba(59, 130, 246, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      inset 0 -1px 0 rgba(0, 0, 0, 0.2);
  `;

  const innerStyle = css`
    width: 100%;
    height: 100%;
    border-radius: 20px;
    background: 
      radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 70%, rgba(147, 51, 234, 0.1) 0%, transparent 50%),
      linear-gradient(135deg, 
        rgba(15, 23, 42, 0.4) 0%,
        rgba(30, 41, 59, 0.4) 50%,
        rgba(15, 23, 42, 0.4) 100%
      );
    border: 2px dashed rgba(148, 163, 184, 0.3);
    backdrop-filter: blur(20px);
    position: relative;
    overflow: hidden;
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: 
        repeating-linear-gradient(
          45deg,
          transparent,
          transparent 20px,
          rgba(148, 163, 184, 0.03) 20px,
          rgba(148, 163, 184, 0.03) 40px
        );
      animation: ${shimmer} 4s ease-in-out infinite;
      pointer-events: none;
    }
    
    &::after {
      content: '';
      position: absolute;
      top: -2px;
      left: -2px;
      right: -2px;
      bottom: -2px;
      background: linear-gradient(
        45deg,
        transparent 40%,
        rgba(255, 255, 255, 0.05) 50%,
        transparent 60%
      );
      background-size: 200% 200%;
      animation: ${borderFlow} 6s linear infinite;
      border-radius: 20px;
      pointer-events: none;
      z-index: 1;
    }
  `;

  const labelContainerStyle = css`
    position: absolute;
    bottom: -28px;
    left: 20px;
    animation: ${float} 3s ease-in-out infinite;
    z-index: 10;
  `;

  const labelStyle = css`
    display: inline-flex;
    align-items: center;
    gap: 10px;
    color: #e2e8f0;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.5px;
    background: linear-gradient(
      135deg,
      rgba(30, 41, 59, 0.98) 0%,
      rgba(51, 65, 85, 0.98) 100%
    );
    padding: 10px 20px;
    border-radius: 16px;
    border: 2px solid rgba(148, 163, 184, 0.3);
    box-shadow: 
      0 10px 40px rgba(0, 0, 0, 0.5),
      0 0 0 1px rgba(255, 255, 255, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.2),
      inset 0 -1px 0 rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(20px);
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.2),
        transparent
      );
      transition: left 0.5s ease;
    }
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 
        0 15px 50px rgba(0, 0, 0, 0.7),
        0 0 0 1px rgba(255, 255, 255, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.3);
      border-color: rgba(148, 163, 184, 0.5);
      
      &::before {
        left: 100%;
      }
    }
  `;

  const iconStyle = css`
    font-size: 18px;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
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
              fontSize: '12px',
              fontWeight: 600
            }}>
              {getInfraCount()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};