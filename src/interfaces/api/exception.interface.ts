/* Exception Service Interfaces */

export interface ExceptionGroup {
    service: string;
    operation: string;
    type: string;
    exceptionType: string;
    exceptionMessage: string;
    traces: any[];
    count: number;
}
