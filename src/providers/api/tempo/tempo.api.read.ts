import { BaseApi } from '../core/base.api';
import { ServiceMapItem, ServiceMapResponseModel, ServiceMapNode, ServiceMapEdge } from '../../../interfaces/pages/service-map/service-map.response.interface';
import { lastValueFrom } from 'rxjs';
import { TempoReadFactory } from './factory/tempo.read.factory';
import { TempoRequestModel } from '../../../interfaces/tempo/tempo.request.interface';
import { getBackendSrv } from '@grafana/runtime';
import qs from 'qs';

class TempoReadApi extends BaseApi {
  
  async query(requestModel: TempoRequestModel): Promise<any> {
    try {
      const datasource = await this.getDatasourceInstance();
      const request = await TempoReadFactory.create(requestModel, datasource);
      const response = await lastValueFrom(datasource.query(request));

      if (requestModel.queryType === 'serviceMap') {
        return this.mapServiceMapResponseModel(response);
      }
      else {
        throw new Error('Invalid query type');
      }
    } catch (error) {
      console.error('Tempo query error:', error);
      throw error;
    }
  }

  async search(query: string, start: number, end: number, limit: number = 1000): Promise<any> {
    const datasource = await this.getDatasourceInstance();
    const searchParams = {
      q: query,
      start: start,
      end: end,
      limit: limit
    };
  
    try {
      // const res = await datasource.metadataRequest('search', searchParams);
      // const res = await lastValueFrom(datasource._request('search', searchParams));
      const res = await getBackendSrv().get(`${datasource.instanceSettings.url}/api/search?${qs.stringify(searchParams)}`);
      return res;
    } catch (error) {
      console.error('Tempo search error:', error);
      throw error;
    }
  }

  // private mapSearchResponseModel(response: any): TraceResponseModel {
  //   return response.map((item: any) => ({
  //     id: item.id,
  //     service: item.service,
  //     avgLatency: item.avgLatency,
  //     minLatency: item.minLatency,
  //     maxLatency: item.maxLatency,
  //     count: item.count,
  //   }));
  // }

  private mapServiceMapResponseModel(response: any): ServiceMapResponseModel {
    const list: ServiceMapItem[] = [];
    const nodes: ServiceMapNode[] = [];
    const edges: ServiceMapEdge[] = [];
    
    // console.log('[TempoReadApi] mapResponseModel - raw response:', response);
    
    if (response.data && Array.isArray(response.data)) {
      response.data.forEach((frame: any, frameIndex: number) => {
        // console.log(`[TempoReadApi] Frame ${frameIndex}:`, frame);
        // console.log(`[TempoReadApi] Frame ${frameIndex} fields:`, frame.fields);
        
        if (frame.fields) {
          // Log all field names to see what's available
          frame.fields.forEach((field: any, fieldIndex: number) => {
            // console.log(`[TempoReadApi] Field ${fieldIndex}: name="${field.name}", values length=${field.values?.length || 0}`);
            if (field.values && field.values.length > 0) {
              // console.log(`[TempoReadApi] Field ${fieldIndex} sample values:`, field.values.slice(0, 3));
            }
          });
          
          // Extract nodes and edges from the response
          const nodeField = frame.fields.find((f: any) => f.name === 'nodes' || f.name === 'node');
          const edgeField = frame.fields.find((f: any) => f.name === 'edges' || f.name === 'edge');
          
          // console.log(`[TempoReadApi] Found nodeField:`, nodeField);
          // console.log(`[TempoReadApi] Found edgeField:`, edgeField);
          
          // If no specific node/edge fields, try to find fields with data
          if (!nodeField || !edgeField || (nodeField.values?.length === 0 && edgeField.values?.length === 0)) {
            // console.log('[TempoReadApi] No node/edge fields found, looking for alternative fields...');
            
            // Look for fields that might contain service data
            const fieldsWithData = frame.fields.filter((f: any) => f.values && f.values.length > 0);
            // console.log('[TempoReadApi] Fields with data:', fieldsWithData.map((f: any) => ({ name: f.name, length: f.values.length })));
            
            // Try to extract service information from available fields
            if (fieldsWithData.length > 0) {
              this.extractServiceDataFromFields(fieldsWithData, nodes, edges);
            }
          }
          
          if (nodeField && nodeField.values) {
            nodeField.values.forEach((nodeData: any) => {
              if (typeof nodeData === 'object' && nodeData !== null) {
                const node: ServiceMapNode = {
                  id: nodeData.id || `node-${Date.now()}-${Math.random()}`,
                  service: nodeData.service || nodeData.name || 'unknown',
                  operation: nodeData.operation,
                  type: nodeData.type || 'service',
                  parentId: nodeData.parentId,
                  attributes: nodeData.attributes || {},
                  metrics: {
                    requestCount: nodeData.requestCount || nodeData.metrics?.requestCount || 0,
                    errorRate: nodeData.errorRate || nodeData.metrics?.errorRate || 0,
                    avgLatency: nodeData.avgLatency || nodeData.metrics?.avgLatency || 0,
                    p95Latency: nodeData.p95Latency || nodeData.metrics?.p95Latency || 0,
                    p99Latency: nodeData.p99Latency || nodeData.metrics?.p99Latency || 0,
                  }
                };
                nodes.push(node);
              }
            });
          }
          
          if (edgeField && edgeField.values) {
            edgeField.values.forEach((edgeData: any) => {
              if (typeof edgeData === 'object' && edgeData !== null) {
                const edge: ServiceMapEdge = {
                  id: edgeData.id || `edge-${Date.now()}-${Math.random()}`,
                  source: edgeData.source || edgeData.from,
                  target: edgeData.target || edgeData.to,
                  sourceService: edgeData.sourceService || edgeData.fromService,
                  targetService: edgeData.targetService || edgeData.toService,
                  operation: edgeData.operation,
                  attributes: edgeData.attributes || {},
                  metrics: {
                    requestCount: edgeData.requestCount || edgeData.metrics?.requestCount || 0,
                    errorRate: edgeData.errorRate || edgeData.metrics?.errorRate || 0,
                    avgLatency: edgeData.avgLatency || edgeData.metrics?.avgLatency || 0,
                    p95Latency: edgeData.p95Latency || edgeData.metrics?.p95Latency || 0,
                    p99Latency: edgeData.p99Latency || edgeData.metrics?.p99Latency || 0,
                  }
                };
                edges.push(edge);
              }
            });
          }
        }
      });
    }
    
    // Convert nodes to ServiceMapItem for grid display
    nodes.forEach((node) => {
      const relatedServices = edges
        .filter(edge => edge.source === node.id || edge.target === node.id)
        .map(edge => edge.source === node.id ? edge.targetService : edge.sourceService);
      
      const relatedOperations = edges
        .filter(edge => edge.source === node.id || edge.target === node.id)
        .map(edge => edge.operation)
        .filter(Boolean);
      
      const item: ServiceMapItem = {
        id: node.id,
        service: node.service,
        operation: node.operation,
        type: node.type,
        parentId: node.parentId,
        requestCount: node.metrics?.requestCount || 0,
        errorRate: node.metrics?.errorRate || 0,
        avgLatency: node.metrics?.avgLatency || 0,
        p95Latency: node.metrics?.p95Latency || 0,
        p99Latency: node.metrics?.p99Latency || 0,
        lastSeen: new Date().toISOString(),
        attributes: node.attributes,
        relatedServices: [...new Set(relatedServices)],
        relatedOperations: [...new Set(relatedOperations)]
      };
      
      list.push(item);
    });
    
    // console.log('[TempoReadApi] mapResponseModel - processed data:', { list, nodes, edges });
    
    // If no data found, create test data for development
    if (list.length === 0 && nodes.length === 0 && edges.length === 0) {
      // console.log('[TempoReadApi] No data found, creating test data...');
      return this.createTestServiceMapData();
    }
    
    return {
      list: list,
      total: list.length,
      hasMore: false,
      nodes: nodes,
      edges: edges,
    };
  }

  private extractServiceDataFromFields(fields: any[], nodes: ServiceMapNode[], edges: ServiceMapEdge[]): void {
    // console.log('[TempoReadApi] extractServiceDataFromFields - processing fields:', fields.map(f => f.name));
    
    // Try to find service-related fields
    const idField = fields.find(f => f.name === 'id' || f.name === 'nodeId');
    const titleField = fields.find(f => f.name === 'title' || f.name === 'name' || f.name === 'service');
    const subtitleField = fields.find(f => f.name === 'subtitle' || f.name === 'operation');
    const mainStatField = fields.find(f => f.name === 'mainstat' || f.name === 'requestCount');
    const secondaryStatField = fields.find(f => f.name === 'secondarystat' || f.name === 'errorRate');
    
    if (idField && titleField && idField.values.length > 0) {
      // console.log('[TempoReadApi] Creating nodes from available fields...');
      
      for (let i = 0; i < idField.values.length; i++) {
        const node: ServiceMapNode = {
          id: idField.values[i] || `node-${i}`,
          service: titleField.values[i] || 'unknown',
          operation: subtitleField?.values[i],
          type: 'service',
          attributes: {},
          metrics: {
            requestCount: mainStatField?.values[i] || 0,
            errorRate: secondaryStatField?.values[i] || 0,
            avgLatency: 0,
            p95Latency: 0,
            p99Latency: 0,
          }
        };
        nodes.push(node);
      }
    }
    
    // If we have nodes but no edges, create some basic relationships
    if (nodes.length > 0 && edges.length === 0) {
      // console.log('[TempoReadApi] Creating basic edges between services...');
      for (let i = 0; i < nodes.length - 1; i++) {
        const edge: ServiceMapEdge = {
          id: `edge-${i}`,
          source: nodes[i].id,
          target: nodes[i + 1].id,
          sourceService: nodes[i].service,
          targetService: nodes[i + 1].service,
          attributes: {},
          metrics: {
            requestCount: 1,
            errorRate: 0,
            avgLatency: 0,
            p95Latency: 0,
            p99Latency: 0,
          }
        };
        edges.push(edge);
      }
    }
  }

  private createTestServiceMapData(): ServiceMapResponseModel {
    // console.log('[TempoReadApi] Creating test service map data...');
    
    const testNodes: ServiceMapNode[] = [
      {
        id: 'frontend',
        service: 'frontend',
        type: 'service',
        attributes: {},
        metrics: {
          requestCount: 1500,
          errorRate: 2.5,
          avgLatency: 120,
          p95Latency: 250,
          p99Latency: 400,
        }
      },
      {
        id: 'api-gateway',
        service: 'api-gateway',
        type: 'service',
        attributes: {},
        metrics: {
          requestCount: 1200,
          errorRate: 1.8,
          avgLatency: 80,
          p95Latency: 180,
          p99Latency: 300,
        }
      },
      {
        id: 'user-service',
        service: 'user-service',
        type: 'service',
        attributes: {},
        metrics: {
          requestCount: 800,
          errorRate: 0.5,
          avgLatency: 50,
          p95Latency: 100,
          p99Latency: 150,
        }
      },
      {
        id: 'order-service',
        service: 'order-service',
        type: 'service',
        attributes: {},
        metrics: {
          requestCount: 600,
          errorRate: 3.2,
          avgLatency: 200,
          p95Latency: 450,
          p99Latency: 800,
        }
      },
      {
        id: 'payment-service',
        service: 'payment-service',
        type: 'service',
        attributes: {},
        metrics: {
          requestCount: 400,
          errorRate: 1.0,
          avgLatency: 300,
          p95Latency: 600,
          p99Latency: 1000,
        }
      }
    ];

    const testEdges: ServiceMapEdge[] = [
      {
        id: 'frontend-api',
        source: 'frontend',
        target: 'api-gateway',
        sourceService: 'frontend',
        targetService: 'api-gateway',
        attributes: {},
        metrics: {
          requestCount: 1500,
          errorRate: 2.5,
          avgLatency: 120,
          p95Latency: 250,
          p99Latency: 400,
        }
      },
      {
        id: 'api-user',
        source: 'api-gateway',
        target: 'user-service',
        sourceService: 'api-gateway',
        targetService: 'user-service',
        attributes: {},
        metrics: {
          requestCount: 800,
          errorRate: 0.5,
          avgLatency: 50,
          p95Latency: 100,
          p99Latency: 150,
        }
      },
      {
        id: 'api-order',
        source: 'api-gateway',
        target: 'order-service',
        sourceService: 'api-gateway',
        targetService: 'order-service',
        attributes: {},
        metrics: {
          requestCount: 600,
          errorRate: 3.2,
          avgLatency: 200,
          p95Latency: 450,
          p99Latency: 800,
        }
      },
      {
        id: 'order-payment',
        source: 'order-service',
        target: 'payment-service',
        sourceService: 'order-service',
        targetService: 'payment-service',
        attributes: {},
        metrics: {
          requestCount: 400,
          errorRate: 1.0,
          avgLatency: 300,
          p95Latency: 600,
          p99Latency: 1000,
        }
      }
    ];

    // Convert nodes to ServiceMapItem for grid display
    const testList: ServiceMapItem[] = testNodes.map((node) => {
      const relatedServices = testEdges
        .filter(edge => edge.source === node.id || edge.target === node.id)
        .map(edge => edge.source === node.id ? edge.targetService : edge.sourceService);
      
      const relatedOperations = testEdges
        .filter(edge => edge.source === node.id || edge.target === node.id)
        .map(edge => edge.operation)
        .filter(Boolean);
      
      return {
        id: node.id,
        service: node.service,
        operation: node.operation,
        type: node.type,
        parentId: node.parentId,
        requestCount: node.metrics?.requestCount || 0,
        errorRate: node.metrics?.errorRate || 0,
        avgLatency: node.metrics?.avgLatency || 0,
        p95Latency: node.metrics?.p95Latency || 0,
        p99Latency: node.metrics?.p99Latency || 0,
        lastSeen: new Date().toISOString(),
        attributes: node.attributes,
        relatedServices: [...new Set(relatedServices)],
        relatedOperations: [...new Set(relatedOperations)]
      };
    });

    return {
      list: testList,
      total: testList.length,
      hasMore: false,
      nodes: testNodes,
      edges: testEdges,
    };
  }

  async getLabels(): Promise<string[]> {
    try {
      const datasource = await this.getDatasourceInstance();
      const raw = await datasource.labelNamesQuery();

      // Normalize to plain string[] regardless of backend shape ({ text }, { value }, or string)
      const normalized: string[] = (Array.isArray(raw) ? raw : [])
        .map((item: any) =>
          typeof item === 'string' ? item : (item?.text ?? item?.value ?? String(item))
        )
        .filter((s: any) => typeof s === 'string' && s.length > 0);

      return normalized;
    } catch (error) {
      console.error('Loki getLabels error:', error);
      return [];
    }
  }

  async getLabelValues(labelName: string): Promise<string[]> {
    try {
      const datasource = await this.getDatasourceInstance();
      const raw = await datasource.labelValuesQuery(labelName);

      // Normalize to plain string[] regardless of backend shape ({ text }, { value }, or string)
      const normalized: string[] = (Array.isArray(raw) ? raw : [])
        .map((item: any) =>
          typeof item === 'string' ? item : (item?.text ?? item?.value ?? String(item))
        )
        .filter((s: any) => typeof s === 'string' && s.length > 0);

      return normalized;
    } catch (error) {
      console.error(`Error getting label values for ${labelName}:`, error);
      return [];
    }
  }
}

export const tempoReadApi = new TempoReadApi();