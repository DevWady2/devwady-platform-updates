import React, { PropsWithChildren } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render } from "@testing-library/react";

export function renderAtPath(ui: React.ReactElement, path: string, routePath = path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={routePath} element={ui} />
      </Routes>
    </MemoryRouter>
  );
}

export function renderInRouter(ui: React.ReactElement, initialEntries: string[] = ["/"]) {
  return render(<MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>);
}

export function StaticWrapper({ children }: PropsWithChildren) {
  return <div data-testid="static-wrapper">{children}</div>;
}
