/*
 *  This file is part of CoCalc: Copyright © 2020 Sagemath, Inc.
 *  License: MS-RSL – see LICENSE.md for details
 */

import { ConfigProvider as AntdConfigProvider } from "antd";
import ReactDOM from "react-dom";
import { createRoot } from "react-dom/client";

import { Redux } from "@cocalc/frontend/app-framework";
import {
  AppContext,
  useAntdStyleProvider,
  useAppStateProvider,
} from "./context";
import { Localize, useAntdLocale } from "./localize";

function App({ children }) {
  const appState = useAppStateProvider();
  const antdLocale = useAntdLocale();
  const { antdTheme } = useAntdStyleProvider();

  return (
    <AppContext.Provider value={appState}>
      <AntdConfigProvider theme={antdTheme} locale={antdLocale}>
        {children}
      </AntdConfigProvider>
    </AppContext.Provider>
  );
}

function Root({ Page }) {
  return (
    <Redux>
      <Localize>
        <App>
          <Page />
        </App>
      </Localize>
    </Redux>
  );
}

export async function render(): Promise<void> {
  finishedLoading(); // comment this out to leave the loading/startup banner visible so you can use the Chrome dev tools with it.
  const container = document.getElementById("cocalc-webapp-container");
  const root = createRoot(container!);
  const { Page } = await import("./page");
  root.render(<Root Page={Page} />);
}

export async function xxx_render(): Promise<void> {
  finishedLoading(); // comment this out to leave the loading/startup banner visible
  const { Page } = await import("./page");
  ReactDOM.render(
    <Root Page={Page} />,
    document.getElementById("cocalc-webapp-container"),
  );
}

// When loading is done, remove any visible artifacts.
// This doesn't remove anything added to the head.
function finishedLoading() {
  const load = document.getElementById("cocalc-load-container");
  if (load != null) {
    load.innerHTML = "";
    load.remove();
  }
}
