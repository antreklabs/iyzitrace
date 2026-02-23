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
        <div className="stats-card">
            <div className="stats-card__content">
                <div>
                    <p className="stats-card__title">{title}</p>
                    <p className="stats-card__value">
                        {typeof value === 'number' ? value.toLocaleString() : value}
                    </p>
                </div>
                <div
                    className="stats-card__icon-wrap"
                    style={{ backgroundColor: styles.bg, color: styles.text }}
                >
                    {icon}
                </div>
            </div>
        </div>
    );
};

export default StatsCard;
