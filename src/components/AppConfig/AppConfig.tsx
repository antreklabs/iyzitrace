import React, { ChangeEvent, useState } from 'react';
import { lastValueFrom } from 'rxjs';
import { css } from '@emotion/css';
import {
  AppPluginMeta,
  GrafanaTheme2,
  PluginConfigPageProps,
  PluginMeta,
} from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import {
  Button,
  Field,
  FieldSet,
  Input,
  SecretInput,
  useStyles2,
} from '@grafana/ui';
import { testIds } from '../testIds';

type DashboardEntry = {
  name: string;
  url: string;
};

type AppPluginSettings = {
  apiUrl?: string;
  dashboards?: DashboardEntry[];
};

type State = {
  apiUrl: string;
  apiKey: string;
  isApiKeySet: boolean;
  dashboards: DashboardEntry[];
};

export interface AppConfigProps
  extends PluginConfigPageProps<AppPluginMeta<AppPluginSettings>> {}

const AppConfig = ({ plugin }: AppConfigProps) => {
  const s = useStyles2(getStyles);
  const { enabled, pinned, jsonData, secureJsonFields } = plugin.meta;

  const [state, setState] = useState<State>({
    apiUrl: jsonData?.apiUrl || '',
    apiKey: '',
    isApiKeySet: Boolean(secureJsonFields?.apiKey),
    dashboards: jsonData?.dashboards || [],
  });

  const isSubmitDisabled = Boolean(!state.apiUrl || (!state.isApiKeySet && !state.apiKey));

  const onResetApiKey = () =>
    setState({
      ...state,
      apiKey: '',
      isApiKeySet: false,
    });

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    setState({
      ...state,
      [event.target.name]: event.target.value.trim(),
    });
  };

  const onSubmit = () => {
    if (isSubmitDisabled) return;

    updatePluginAndReload(plugin.meta.id, {
      enabled,
      pinned,
      jsonData: {
        apiUrl: state.apiUrl,
        dashboards: state.dashboards,
      },
      secureJsonData: state.isApiKeySet
        ? undefined
        : {
            apiKey: state.apiKey,
          },
    });
  };

  return (
    <form onSubmit={onSubmit}>
      <FieldSet label="API Settings">
        <Field label="API Key" description="A secret key for authenticating to our custom API">
          <SecretInput
            width={60}
            id="config-api-key"
            data-testid={testIds.appConfig.apiKey}
            name="apiKey"
            value={state.apiKey}
            isConfigured={state.isApiKeySet}
            placeholder={'Your secret API key'}
            onChange={onChange}
            onReset={onResetApiKey}
          />
        </Field>

        <Field label="API Url" className={s.marginTop}>
          <Input
            width={60}
            name="apiUrl"
            id="config-api-url"
            data-testid={testIds.appConfig.apiUrl}
            value={state.apiUrl}
            placeholder={`E.g.: http://mywebsite.com/api/v1`}
            onChange={onChange}
          />
        </Field>
      </FieldSet>

      <FieldSet label="Embedded Dashboards" className={s.marginTop}>
        {state.dashboards.map((entry, index) => (
          <div key={index} className={s.dashboardBlock}>
            <Field label="Name">
              <Input
                value={entry.name}
                onChange={(e) => {
                  const dashboards = [...state.dashboards];
                  dashboards[index].name = e.currentTarget.value;
                  setState({ ...state, dashboards });
                }}
              />
            </Field>
            <Field label="URL">
              <Input
                value={entry.url}
                onChange={(e) => {
                  const dashboards = [...state.dashboards];
                  dashboards[index].url = e.currentTarget.value;
                  setState({ ...state, dashboards });
                }}
              />
            </Field>
            <Button
              variant="destructive"
              onClick={() => {
                const dashboards = state.dashboards.filter((_, i) => i !== index);
                setState({ ...state, dashboards });
              }}
            >
              Remove
            </Button>
          </div>
        ))}

        <Button
          className={s.marginTop}
          onClick={() => {
            setState({
              ...state,
              dashboards: [...state.dashboards, { name: '', url: '' }],
            });
          }}
        >
          + Add Dashboard
        </Button>
      </FieldSet>

      <div className={s.marginTop}>
        <Button type="submit" data-testid={testIds.appConfig.submit} disabled={isSubmitDisabled}>
          Save Settings
        </Button>
      </div>
    </form>
  );
};

export default AppConfig;

const getStyles = (theme: GrafanaTheme2) => ({
  colorWeak: css`
    color: ${theme.colors.text.secondary};
  `,
  marginTop: css`
    margin-top: ${theme.spacing(3)};
  `,
  dashboardBlock: css`
    margin-top: ${theme.spacing(2)};
    padding-bottom: ${theme.spacing(2)};
    border-bottom: 1px solid ${theme.colors.border.weak};
  `,
});

const updatePluginAndReload = async (pluginId: string, data: Partial<PluginMeta<AppPluginSettings>>) => {
  try {
    await updatePlugin(pluginId, data);
    window.location.reload();
  } catch (e) {
    console.error('Error while updating the plugin', e);
  }
};

const updatePlugin = async (pluginId: string, data: Partial<PluginMeta>) => {
  const response = await getBackendSrv().fetch({
    url: `/api/plugins/${pluginId}/settings`,
    method: 'POST',
    data,
  });

  return lastValueFrom(response);
};
