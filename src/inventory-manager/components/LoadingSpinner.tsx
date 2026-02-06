import React from 'react';
import { Spin } from 'antd';

interface LoadingSpinnerProps {
    size?: 'small' | 'default' | 'large';
    tip?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'large', tip = 'Loading...' }) => {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '48px',
                color: '#94a3b8',
            }}
        >
            <Spin size={size} />
            {tip && <p style={{ marginTop: '16px', fontSize: '14px' }}>{tip}</p>}
        </div>
    );
};

export default LoadingSpinner;
