import { lazy, Suspense, useEffect, useRef, type ComponentType } from 'react';
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
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
  const tabBarRef = useRef<HTMLElement>(null);
  const location = useLocation();

  useEffect(() => {
    const activeTab = tabBarRef.current?.querySelector('[aria-current="page"]');
    activeTab?.scrollIntoView({ inline: 'nearest', block: 'nearest' });
  }, [location.pathname]);

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
      {widgets.length > 1 && (
        <div className={styles.tabBarSticky}>
          <nav ref={tabBarRef} className={styles.tabBar} aria-label="Widget navigation">
            {widgets.map((widget) => {
              const path = widget.id === defaultWidget.id ? '/' : `/${widget.id}`;
              return (
                <NavLink
                  key={widget.id}
                  to={path}
                  end={widget.id === defaultWidget.id}
                  className={({ isActive }) =>
                    `${styles.tab} ${isActive ? styles.tabActive : ''}`
                  }
                >
                  {widget.label}
                </NavLink>
              );
            })}
          </nav>
        </div>
      )}
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
