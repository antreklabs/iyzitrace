import React from 'react';
import { Spin } from 'antd';

interface LoadingSpinnerProps {
    size?: 'small' | 'default' | 'large';
    tip?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'large', tip = 'Loading...' }) => {
    return (
        <div className="loading-spinner">
            <Spin size={size} />
            {tip && <p className="loading-spinner__text">{tip}</p>}
        </div>
    );
};

export default LoadingSpinner;
