import { TraceqlSearchScope } from "../enums";

export interface TraceqlFilter {
    /**
     * Uniquely identify the filter, will not be used in the query generation
     */
    id: string;
    /**
     * The operator that connects the tag to the value, for example: =, >, !=, =~
     */
    operator?: string;
    /**
     * The scope of the filter, can either be unscoped/all scopes, resource or span
     */
    scope?: TraceqlSearchScope;
    /**
     * The tag for the search filter, for example: .http.status_code, .service.name, status
     */
    tag?: string;
    /**
     * The value for the search filter
     */
    value?: (string | Array<string>);
    /**
     * The type of the value, used for example to check whether we need to wrap the value in quotes when generating the query
     */
    valueType?: string;
  }
