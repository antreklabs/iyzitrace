export interface ServiceItem {
    id: string;
    service: string;
}

export interface ServiceResponseModel {
    list: ServiceItem[];
    total: number;
    hasMore: boolean;
}
  