
import { TempoApiUrl } from '../../interfaces';
import axios from 'axios';

const tempo = axios.create({
  baseURL: 'http://localhost:53711/api/v2',
  timeout: 10000,
});


 const getServices = async () => {
  const res = await tempo.get(TempoApiUrl.GET_SERVICES);
  return res.data;
};

 const getOperations = async (service: string) => {
  const res = await tempo.get(`/search/tags/operation?service=${service}`);
  return res.data;
};

 const searchTraces = async (params: Record<string, string | number>) => {
  const res = await tempo.get('/search', { params });
  return res.data;
};

 const getTraceById = async (traceId: string) => {
  const res = await tempo.get(`/traces/${traceId}`);
  return res.data;
};

 const getTagValues = async (tag: string, service?: string) => {
  const res = await tempo.get('/search/tagvalues', {
    params: { tag, ...(service && { service }) },
  });
  return res.data;
};

export const tempoApi = {
    getServices,
    getOperations,
    searchTraces,
    getTraceById,
    getTagValues,
    };
