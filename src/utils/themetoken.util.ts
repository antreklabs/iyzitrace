import { theme } from "antd";
import locale from "antd/es/date-picker/locale/en_US";

export const themetoken = {
    algorithm: theme.darkAlgorithm,
    "token": {
    "colorPrimary": "#d5521e",
    "colorError": "#fd3838",
    "colorWarning": "#fdd238",
    "colorInfo": "#d5521e",
    "fontSize": 13,
    "sizeStep": 3,
    "sizeUnit": 3,
    "borderRadius": 12,
    "wireframe": true,
    "fontFamily": "Quicksand, sans-serif"
  },
  "components": {
    "Select": {
      "colorBgContainerDisabled": "rgba(0, 0, 0, 0.06)",
      "colorTextDisabled": "rgba(0, 0, 0, 0.45)",
      "colorTextPlaceholder": "rgba(255, 255, 255, 0.45)"
    },
    "Input": {
      "colorBgContainerDisabled": "rgba(0, 0, 0, 0.06)",
      "colorTextDisabled": "rgba(0, 0, 0, 0.45)",
      "colorTextPlaceholder": "rgba(255, 255, 255, 0.45)"
    },
    "InputNumber": {
      "colorBgContainerDisabled": "rgba(0, 0, 0, 0.06)",
      "colorTextDisabled": "rgba(0, 0, 0, 0.45)",
      "colorTextPlaceholder": "rgba(255, 255, 255, 0.45)"
    },
    "DatePicker": {
      "colorBgContainerDisabled": "rgba(0, 0, 0, 0.06)",
      "colorTextDisabled": "rgba(0, 0, 0, 0.45)",
      "colorTextPlaceholder": "rgba(255, 255, 255, 0.45)"
    },
    "Menu": {
      "itemSelectedColor": "#3CBA57",
      "itemSelectedBg": "#3CBA57",
      "colorBgElevated": "#ffffff",
      "itemBg": "#ffffff",
      "colorPrimary": "#3CBA57",
      "colorBgContainer": "#ffffff"
    },
    "Radio": {
      "colorBgContainerDisabled": "rgba(0, 0, 0, 0.06)",
      "colorTextDisabled": "rgba(0, 0, 0, 0.45)",
      "colorTextPlaceholder": "rgba(255, 255, 255, 0.45)"
    },
    "Tabs": {
      "fontSize": 14
    }
  },
    locale,
}