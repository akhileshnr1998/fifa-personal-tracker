import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import type { TournamentWidget } from './registry';
import styles from './shell.module.css';

const COMPACT_NAV_QUERY = '(max-width: 639px)';

const WIDGET_ICONS: Record<string, string> = {
  hub: '🏟️',
  fixtures: '📅',
  standings: '📊',
  teams: '👕',
  bracket: '🏆',
};

function useCompactNav(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      const mediaQuery = window.matchMedia(COMPACT_NAV_QUERY);
      mediaQuery.addEventListener('change', onStoreChange);
      return () => mediaQuery.removeEventListener('change', onStoreChange);
    },
    () => window.matchMedia(COMPACT_NAV_QUERY).matches,
    () => false,
  );
}

function getWidgetPath(widget: TournamentWidget, defaultWidgetId: string): string {
  return widget.id === defaultWidgetId ? '/' : `/${widget.id}`;
}

function resolveActiveWidget(
  widgets: TournamentWidget[],
  defaultWidget: TournamentWidget,
  pathname: string,
): TournamentWidget {
  return (
    widgets.find((widget) => {
      const path = getWidgetPath(widget, defaultWidget.id);
      return path === '/' ? pathname === '/' : pathname.startsWith(`/${widget.id}`);
    }) ?? defaultWidget
  );
}

interface WidgetNavProps {
  widgets: TournamentWidget[];
  defaultWidget: TournamentWidget;
}

export function WidgetNav({ widgets, defaultWidget }: WidgetNavProps) {
  const isCompact = useCompactNav();
  const location = useLocation();
  const activeWidget = resolveActiveWidget(widgets, defaultWidget, location.pathname);

  if (isCompact) {
    return (
      <WidgetNavPicker
        widgets={widgets}
        defaultWidget={defaultWidget}
        activeWidget={activeWidget}
      />
    );
  }

  return (
    <div className={styles.tabBarSticky}>
      <nav className={styles.tabBar} aria-label="Widget navigation">
        {widgets.map((widget) => {
          const path = getWidgetPath(widget, defaultWidget.id);
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
  );
}

interface WidgetNavPickerProps {
  widgets: TournamentWidget[];
  defaultWidget: TournamentWidget;
  activeWidget: TournamentWidget;
}

function WidgetNavPicker({
  widgets,
  defaultWidget,
  activeWidget,
}: WidgetNavPickerProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  const beginClose = useCallback(() => {
    setClosing(true);
  }, []);

  const handleClosed = useCallback(() => {
    setOpen(false);
    setClosing(false);
  }, []);

  const handleOpen = useCallback(() => {
    setClosing(false);
    setOpen(true);
  }, []);

  const handleSelect = useCallback(
    (widget: TournamentWidget) => {
      navigate(getWidgetPath(widget, defaultWidget.id));
      beginClose();
    },
    [beginClose, defaultWidget.id, navigate],
  );

  useEffect(() => {
    setOpen(false);
    setClosing(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') beginClose();
    }

    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [beginClose, open]);

  return (
    <div className={styles.tabBarSticky}>
      <button
        type="button"
        className={styles.navPickerTrigger}
        onClick={handleOpen}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`Current view: ${activeWidget.label}. Choose tournament view.`}
      >
        <span className={styles.navPickerTriggerIcon} aria-hidden="true">
          {WIDGET_ICONS[activeWidget.id] ?? '📋'}
        </span>
        <span className={styles.navPickerTriggerLabel}>{activeWidget.label}</span>
        <span className={styles.navPickerTriggerChevron} aria-hidden="true">
          ▾
        </span>
      </button>

      {open ? (
        <>
          <div
            className={`${styles.navPickerBackdrop} ${closing ? styles.navPickerBackdropClosing : ''}`}
            onClick={beginClose}
            aria-hidden="true"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="widget-nav-picker-title"
            className={`${styles.navPickerSheet} ${closing ? styles.navPickerSheetClosing : ''}`}
            onAnimationEnd={closing ? handleClosed : undefined}
          >
            <div className={styles.navPickerHandle} aria-hidden="true">
              <div className={styles.navPickerHandleBar} />
            </div>

            <h2 id="widget-nav-picker-title" className={styles.navPickerTitle}>
              Tournament views
            </h2>

            <ul className={styles.navPickerList}>
              {widgets.map((widget) => {
                const isActive = widget.id === activeWidget.id;
                return (
                  <li key={widget.id}>
                    <button
                      type="button"
                      className={`${styles.navPickerItem} ${isActive ? styles.navPickerItemActive : ''}`}
                      onClick={() => handleSelect(widget)}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <span className={styles.navPickerItemIcon} aria-hidden="true">
                        {WIDGET_ICONS[widget.id] ?? '📋'}
                      </span>
                      <span className={styles.navPickerItemLabel}>{widget.label}</span>
                      {isActive ? (
                        <span className={styles.navPickerItemCheck} aria-hidden="true">
                          ✓
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className={styles.navPickerSafeArea} />
          </div>
        </>
      ) : null}
    </div>
  );
}
