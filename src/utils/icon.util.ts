import * as SiIcons from 'react-icons/si';
import * as FaIcons from 'react-icons/fa';
import * as MdIcons from 'react-icons/md';
import * as IoIcons from 'react-icons/io';
import * as RiIcons from 'react-icons/ri';
import * as AiIcons from 'react-icons/ai';
import * as BsIcons from 'react-icons/bs';
import { SiServerless } from 'react-icons/si';

type IconMatch = {
    icon: string;
    keywords: string[];
};

const serviceIconMap: IconMatch[] = [
    { icon: 'kafka', keywords: ['kafka'] },
    { icon: 'mysql', keywords: ['mysql'] },
    { icon: 'postgresql', keywords: ['postgresql', 'postgres', 'pg'] },
    { icon: 'mongodb', keywords: ['mongodb', 'mongo'] },
    { icon: 'redis', keywords: ['redis', 'redis-service', 'redisdb'] },
    { icon: 'rabbitmq', keywords: ['rabbitmq', 'rabbit'] },
    { icon: 'elasticsearch', keywords: ['elasticsearch', 'elastic', 'es'] },
    { icon: 'cassandra', keywords: ['cassandra'] },
    { icon: 'memcached', keywords: ['memcached', 'memcache'] },
    { icon: 'nginx', keywords: ['nginx'] },
    { icon: 'apache', keywords: ['apache', 'httpd'] },
];

const allIconSets = {
    ...FaIcons,
    ...MdIcons,
    ...IoIcons,
    ...RiIcons,
    ...AiIcons,
    ...BsIcons,
};

export const getServiceIconByName = (
    name: string
): React.ComponentType<{ size?: number }> => {
    const serviceName = name.toLowerCase();
    const cleanedName = serviceName.replace(/[^a-z]/gi, '');
    const parts = serviceName.split(/[-_\s]/g); 

    for (const { icon, keywords } of serviceIconMap) {
        if (keywords.some((kw) => serviceName.includes(kw))) {
            const iconName = 'Si' + icon.charAt(0).toUpperCase() + icon.slice(1);
            return (SiIcons as any)[iconName] ?? SiServerless;
        }
    }

    for (const part of parts) {
        const match = Object.entries(allIconSets).find(([iconName]) =>
            iconName.toLowerCase().includes(part)
        );
        if (match) {
            return match[1] as React.ComponentType<{ size?: number }>
        }
    }
    const fallback = Object.entries(allIconSets).find(([iconName]) =>
        iconName.toLowerCase().includes(cleanedName)
    );
    if (fallback) {
        return fallback[1] as React.ComponentType<{ size?: number }>
    }

    return SiServerless;
};