import styles from './bracket.module.css';

interface BracketConnectorsProps {
  paths: string[];
  width: number;
  height: number;
}

export function BracketConnectors({
  paths,
  width,
  height,
}: BracketConnectorsProps) {
  if (paths.length === 0 || width === 0 || height === 0) {
    return null;
  }

  return (
    <svg
      className={styles.connectorLayer}
      width={width}
      height={height}
      aria-hidden="true"
      role="img"
    >
      {paths.map((path, index) => (
        <path key={index} className={styles.connectorPath} d={path} />
      ))}
    </svg>
  );
}
