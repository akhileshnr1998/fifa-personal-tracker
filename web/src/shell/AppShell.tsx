import { Header } from './Header';
import './register-widgets';
import styles from './shell.module.css';
import { WidgetRouter } from './WidgetRouter';

export function AppShell() {
  return (
    <div className={styles.shell}>
      <div className={styles.background} aria-hidden="true">
        <div className={styles.backgroundImage} />
        <div className={styles.backgroundGradient} />
      </div>
      <Header />
      <main className={styles.main}>
        <WidgetRouter />
      </main>
    </div>
  );
}
