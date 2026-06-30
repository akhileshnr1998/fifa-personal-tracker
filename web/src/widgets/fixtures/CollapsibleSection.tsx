import { useState, type ReactNode } from 'react';
import styles from './fixtures.module.css';

interface CollapsibleSectionProps {
  title: string;
  defaultCollapsed?: boolean;
  variant?: 'default' | 'muted';
  preview?: ReactNode;
  children: ReactNode;
}

export function CollapsibleSection({
  title,
  defaultCollapsed = false,
  variant = 'default',
  preview,
  children,
}: CollapsibleSectionProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div
      className={
        variant === 'muted'
          ? styles.drawerSectionMuted
          : styles.drawerSection
      }
    >
      <button
        type="button"
        className={styles.collapsibleHeader}
        aria-expanded={!collapsed}
        onClick={() => setCollapsed((c) => !c)}
      >
        <span className={styles.drawerSectionTitle}>{title}</span>
        <span className={styles.collapsibleChevron} aria-hidden="true">
          {collapsed ? '▸' : '▾'}
        </span>
      </button>
      {collapsed && preview}
      {!collapsed && children}
    </div>
  );
}
