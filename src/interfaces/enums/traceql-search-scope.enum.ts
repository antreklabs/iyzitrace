export enum TraceqlSearchScope {
    Event = 'event',
    Instrumentation = 'instrumentation',
    Intrinsic = 'intrinsic',
    Link = 'link',
    Resource = 'resource',
    Span = 'span',
    Unscoped = 'unscoped',
  }

  export enum SearchTableType {
    Raw = 'raw',
    Spans = 'spans',
    Traces = 'traces',
  }
