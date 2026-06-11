import { Link } from 'react-router-dom';
import { useRef, useState, useEffect } from 'react';
import { useFixturesRefresh } from './FixturesRefreshContext';
import { getCurrentPhase } from './register-widgets';
import styles from './shell.module.css';

export function Header() {
  const showNotify = getCurrentPhase() >= 7;
  const { requestRefresh, isRefreshing } = useFixturesRefresh();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  return (
    <header className={styles.header}>
      <div className={styles.hostStripe} aria-hidden="true" />
      <div className={styles.headerInner}>
        <div className={styles.brand}>
          <span className={styles.trophy} aria-hidden="true">
            🏆
          </span>
          <div className={styles.titleBlock}>
            <h1 className={styles.title}>FIFA World Cup 2026</h1>
            <p className={styles.hosts}>USA · CAN · MEX</p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.settingsMenu} ref={menuRef}>
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Settings"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              title="Settings"
            >
              ⚙️
            </button>
            {menuOpen && (
              <div className={styles.dropdownMenu} role="menu">
                <button
                  type="button"
                  role="menuitem"
                  className={styles.dropdownItem}
                  disabled={isRefreshing}
                  onClick={() => {
                    setMenuOpen(false);
                    void requestRefresh();
                  }}
                >
                  <span className={isRefreshing ? styles.dropdownItemIconSpinning : ''}>
                    🔄
                  </span>
                  Refresh
                </button>
                {showNotify && (
                  <Link
                    to="/settings"
                    role="menuitem"
                    className={styles.dropdownItem}
                    onClick={() => setMenuOpen(false)}
                  >
                    🔔 Notify
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
