import React from 'react';
import { getServiceIconByName } from '../../utils';
import { FaGears } from "react-icons/fa6";

export const ServiceIcon = ({ name, size = 20 }: { name: string; size?: number }) => {
    const Icon = getServiceIconByName(name);
    return Icon ? <Icon size={size} /> : <FaGears size={size}/>
};
