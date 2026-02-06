import React from 'react';
import { Alert } from 'antd';

interface ErrorMessageProps {
    message: string;
    description?: string;
    onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, description, onRetry }) => {
    return (
        <div style={{ padding: '24px' }}>
            <Alert
                type="error"
                message={message}
                description={description}
                showIcon
                action={
                    onRetry && (
                        <button
                            onClick={onRetry}
                            style={{
                                background: '#ef4444',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '6px 12px',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 600,
                            }}
                        >
                            Retry
                        </button>
                    )
                }
            />
        </div>
    );
};

export default ErrorMessage;
