import React from 'react';

interface StatsCardProps {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color?: 'primary' | 'green' | 'purple' | 'orange' | 'pink';
}

const colorStyles: Record<string, { bg: string; text: string }> = {
    primary: { bg: '#3b82f615', text: '#3b82f6' },
    green: { bg: '#22c55e15', text: '#22c55e' },
    purple: { bg: '#a855f715', text: '#a855f7' },
    orange: { bg: '#f9731615', text: '#f97316' },
    pink: { bg: '#ec489915', text: '#ec4899' },
};

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, color = 'primary' }) => {
    const styles = colorStyles[color] || colorStyles.primary;

    return (
        <div
            style={{
                background: '#1a1a1a',
                borderRadius: '16px',
                border: '1px solid #2a2a2a',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <p style={{ fontSize: '13px', fontWeight: 500, color: '#94a3b8', margin: 0 }}>{title}</p>
                    <p style={{ fontSize: '28px', fontWeight: 700, color: '#f1f5f9', margin: '8px 0 0 0' }}>
                        {typeof value === 'number' ? value.toLocaleString() : value}
                    </p>
                </div>
                <div
                    style={{
                        padding: '12px',
                        borderRadius: '12px',
                        backgroundColor: styles.bg,
                        color: styles.text,
                    }}
                >
                    {icon}
                </div>
            </div>
        </div>
    );
};

export default StatsCard;
