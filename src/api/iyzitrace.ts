export type IngestionStatus = {
  logs: boolean;
  traces: boolean;
  metrics: boolean;
};

export type StepKey =
  | 'workspace'
  | 'dataSource'
  | 'logs'
  | 'traces'
  | 'metrics'
  | 'alerts'
  | 'savedViews'
  | 'dashboards';

export type Step = {
  key: StepKey;
  title: string;
  description: string;
  route?: string;       // Get Started yönlendirilecek path
  done: boolean;        // UI check için
  skippable?: boolean;  // Skip for now link'i
};

export async function getIngestionStatus(): Promise<IngestionStatus> {
  // TODO: gerçek endpoint GET /api/iyzitrace/ingestion/status
  return new Promise((r) =>
    setTimeout(() => r({ logs: true, traces: true, metrics: false }), 400)
  );
}

export async function getStepStatuses(): Promise<Record<StepKey, boolean>> {
  // TODO: gerçek endpoint GET /api/iyzitrace/steps/status
  return new Promise((r) =>
    setTimeout(
      () =>
        r({
          workspace: true,
          dataSource: false,
          logs: true,
          traces: true,
          metrics: false,
          alerts: false,
          savedViews: false,
          dashboards: false,
        }),
      500
    )
  );
}
