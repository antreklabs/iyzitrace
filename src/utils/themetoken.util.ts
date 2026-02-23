import { theme, ThemeConfig } from "antd";
import locale from "antd/es/date-picker/locale/en_US";

/**
 * Returns Ant Design theme config based on dark/light mode.
 */
export const getThemeToken = (isDark: boolean): ThemeConfig => ({
  algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
  token: {
    colorPrimary: "#d5521e",
    colorError: "#fd3838",
    colorWarning: "#fdd238",
    colorInfo: "#d5521e",
    fontSize: 13,
    sizeStep: 3,
    sizeUnit: 3,
    borderRadius: 12,
    wireframe: true,
    fontFamily: "Quicksand, sans-serif",
  },
  components: {
    Select: {
      colorBgContainerDisabled: "rgba(0, 0, 0, 0.06)",
      colorTextDisabled: "rgba(0, 0, 0, 0.45)",
      colorTextPlaceholder: isDark
        ? "rgba(255, 255, 255, 0.45)"
        : "rgba(0, 0, 0, 0.25)",
    },
    Input: {
      colorBgContainerDisabled: "rgba(0, 0, 0, 0.06)",
      colorTextDisabled: "rgba(0, 0, 0, 0.45)",
      colorTextPlaceholder: isDark
        ? "rgba(255, 255, 255, 0.45)"
        : "rgba(0, 0, 0, 0.25)",
    },
    InputNumber: {
      colorBgContainerDisabled: "rgba(0, 0, 0, 0.06)",
      colorTextDisabled: "rgba(0, 0, 0, 0.45)",
      colorTextPlaceholder: isDark
        ? "rgba(255, 255, 255, 0.45)"
        : "rgba(0, 0, 0, 0.25)",
    },
    DatePicker: {
      colorBgContainerDisabled: "rgba(0, 0, 0, 0.06)",
      colorTextDisabled: "rgba(0, 0, 0, 0.45)",
      colorTextPlaceholder: isDark
        ? "rgba(255, 255, 255, 0.45)"
        : "rgba(0, 0, 0, 0.25)",
    },
    Menu: {
      itemSelectedColor: "#3CBA57",
      itemSelectedBg: isDark ? "rgba(60, 186, 87, 0.1)" : "rgba(60, 186, 87, 0.08)",
      colorBgElevated: isDark ? "#1f1f1f" : "#ffffff",
      itemBg: isDark ? "transparent" : "transparent",
      colorPrimary: "#3CBA57",
      colorBgContainer: isDark ? "transparent" : "transparent",
      itemBorderRadius: 8,
      itemMarginInline: 8,
    },
    Radio: {
      colorBgContainerDisabled: "rgba(0, 0, 0, 0.06)",
      colorTextDisabled: "rgba(0, 0, 0, 0.45)",
      colorTextPlaceholder: isDark
        ? "rgba(255, 255, 255, 0.45)"
        : "rgba(0, 0, 0, 0.25)",
    },
    Tabs: {
      fontSize: 14,
    },
  },
});

// Export locale separately — it's a ConfigProvider prop, not part of ThemeConfig
export { locale as antdLocale };

// Keep backward compat — default is dark
export const themetoken = getThemeToken(true);