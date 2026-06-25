import { FixturesRefreshProvider } from './FixturesRefreshContext';
import { Header } from './Header';
import './register-widgets';
import styles from './shell.module.css';
import { WidgetRouter } from './WidgetRouter';

export function AppShell() {
  return (
    <FixturesRefreshProvider>
      <div className={styles.shell}>
        <div className={styles.background} aria-hidden="true">
          <div className={styles.backgroundGradient} />
        </div>
        <Header />
        <main className={styles.main}>
          <WidgetRouter />
        </main>
      </div>
    </FixturesRefreshProvider>
  );
}
