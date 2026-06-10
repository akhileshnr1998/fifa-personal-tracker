import { lazy, Suspense, type ComponentType } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { SettingsPage } from '../features/settings/SettingsPage';
import { getEnabledWidgets } from './registry';
import { getCurrentPhase } from './register-widgets';
import styles from './shell.module.css';

function createLazyWidget(
  loader: () => Promise<{ default: ComponentType }>,
) {
  const LazyComponent = lazy(loader);
  return (
    <Suspense fallback={<WidgetLoadingFallback />}>
      <LazyComponent />
    </Suspense>
  );
}

function WidgetLoadingFallback() {
  return (
    <div className={styles.viewport}>
      <div className={styles.loadingState}>Loading tournament view…</div>
    </div>
  );
}

export function WidgetRouter() {
  const widgets = getEnabledWidgets(getCurrentPhase());
  const defaultWidget = widgets[0];

  if (!defaultWidget) {
    return (
      <div className={styles.viewport}>
        <div className={styles.loadingState}>No widgets registered.</div>
      </div>
    );
  }

  const showSettings = getCurrentPhase() >= 7;

  return (
    <div className={styles.viewport}>
      <Routes>
        {widgets.map((widget) => (
          <Route
            key={widget.id}
            path={widget.id === defaultWidget.id ? '/' : `/${widget.id}`}
            element={createLazyWidget(widget.lazy)}
          />
        ))}
        {showSettings ? (
          <Route path="/settings" element={<SettingsPage />} />
        ) : null}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
