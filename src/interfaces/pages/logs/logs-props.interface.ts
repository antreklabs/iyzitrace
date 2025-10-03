import { BaseProps } from '../../core/base-props.interface';

export interface LogsProps extends BaseProps {
    filters?: any; 
    range: [number, number]; 
    selectedDataSourceUid?: string;
}


