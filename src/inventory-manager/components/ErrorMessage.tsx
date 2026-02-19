import React from 'react';
import { Alert } from 'antd';

interface ErrorMessageProps {
    message: string;
    description?: string;
    onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, description, onRetry }) => {
    return (
        <div className="inv-error-padding">
            <Alert
                type="error"
                message={message}
                description={description}
                showIcon
                action={
                    onRetry && (
                        <button onClick={onRetry} className="error-message__retry-btn">
                            Retry
                        </button>
                    )
                }
            />
        </div>
    );
};

export default ErrorMessage;
