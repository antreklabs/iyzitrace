import React, { useEffect, useState } from 'react';
import ReactFlow, { Background, Controls, MiniMap, Edge, Node } from 'reactflow';
import 'reactflow/dist/style.css';
import { Skeleton, Alert, Row } from 'antd';
import BaseContainer from '../../components/core/basecontainer/basecontainer';
import GrafanaLikeRangePicker from '../../components/core/graphanadatepicker';
import { TempoApi } from '../../providers/api/tempo.api';

interface ServiceNode {
  name: string;
  calls: number;
}

interface ServiceEdge {
  from: string;
  to: string;
  count: number;
}

function buildServiceMapFromSpans(spans: any[]): { nodes: ServiceNode[]; edges: ServiceEdge[] } {
  const nodes = new Map<string, ServiceNode>();
  const edges = new Map<string, ServiceEdge>();

  for (const span of spans) {
    const from = span.attributes?.['service.name'];
    const to = span.attributes?.['peer.service'];

    if (!from || !to || from === to) {continue;}

    nodes.set(from, { name: from, calls: (nodes.get(from)?.calls || 0) + 1 });
    nodes.set(to, { name: to, calls: (nodes.get(to)?.calls || 0) });

    const edgeKey = `${from}->${to}`;
    if (!edges.has(edgeKey)) {
      edges.set(edgeKey, { from, to, count: 1 });
    } else {
      edges.get(edgeKey)!.count += 1;
    }
  }

  return {
    nodes: Array.from(nodes.values()),
    edges: Array.from(edges.values()),
  };
}

const ServiceMapContainer: React.FC = () => {
  const [range, setRange] = useState<[number, number]>([
    Date.now() - 60 * 60 * 1000,
    Date.now(),
  ]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTraces = async () => {
      setLoading(true);
      setError(null);
      try {
        const [startTime, endTime] = range;

        const result = await TempoApi.searchTraceQL({
            query: 'service.name!="" and peer.service!=""',
          start: Math.floor(startTime / 1000),
          end: Math.floor(endTime / 1000),
          limit: 1000,
        });

        const spans: any[] = result?.traces?.flatMap((t: any) => t.spans) || [];
        const map = buildServiceMapFromSpans(spans);

        const graphNodes: Node[] = map.nodes.map((n, i) => ({
          id: n.name,
          data: { label: `${n.name} (${n.calls})` },
          position: { x: 150 * i, y: 100 },
          style: { padding: 8, borderRadius: 8, border: '1px solid #aaa' },
        }));

        const graphEdges: Edge[] = map.edges.map((e) => ({
          id: `${e.from}->${e.to}`,
          source: e.from,
          target: e.to,
          label: `${e.count} calls`,
          animated: true,
          style: { stroke: '#999' },
          labelStyle: { fill: '#555', fontWeight: 600 },
        }));

        setNodes(graphNodes);
        setEdges(graphEdges);
      } catch (err: any) {
        setError(err?.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchTraces();
  }, [range]);

  return (
    <BaseContainer
      title={'Service Map'}
      headerActions={
        <GrafanaLikeRangePicker
          title="Date Range"
          onChange={(start, end) => setRange([start, end])}
        />
      }
    >
      <Row>
        {loading ? (
          <Skeleton active paragraph={{ rows: 4 }} />
        ) : error ? (
          <Alert type="error" message="Service Map Error" description={error} showIcon />
        ) : (
          <div style={{ width: '100%', height: '800px' }}>
            <ReactFlow nodes={nodes} edges={edges} fitView>
              <MiniMap />
              <Controls />
              <Background />
            </ReactFlow>
          </div>
        )}
      </Row>
    </BaseContainer>
  );
};

export default ServiceMapContainer;
