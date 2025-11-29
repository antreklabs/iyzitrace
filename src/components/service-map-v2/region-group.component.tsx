import React from 'react';
import { Region } from '../../api/service/interface.service';

interface RegionGroupProps {
  data: {
    region: Region;
    groupSize: { width: number; height: number };
  };
}

export const RegionGroup: React.FC<RegionGroupProps> = ({ data }) => {
  const { region, groupSize } = data;
  const accent = '#6b7fa4';
  const w = groupSize?.width || 560;
  const h = groupSize?.height || 300;
  
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: 14,
        border: `1px dashed ${accent}60`,
        background:
          'repeating-linear-gradient(45deg, rgba(34,48,71,0.2), rgba(34,48,71,0.2) 10px, rgba(34,48,71,0.25) 10px, rgba(34,48,71,0.25) 20px)',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04)'
      }}
    >
      <div
        style={{
          position: 'absolute',
          bottom: -18,
          left: 12,
          color: '#a3b2cc',
          fontSize: 12,
          background: '#0b1220',
          padding: '4px 8px',
          borderRadius: 8,
          border: '1px solid rgba(163,178,204,0.18)'
        }}
      >
        {region.name}
      </div>
    </div>
  );
};

