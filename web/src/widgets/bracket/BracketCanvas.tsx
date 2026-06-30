import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { BRACKET_SLOTS } from './bracketTopology';
import { BracketConnectors } from './BracketConnectors';
import { BracketMatchNode } from './BracketMatchNode';
import {
  BRACKET_LAYOUT,
  COLUMN_LABELS,
  COLUMN_LABELS_FULL,
  columnLeft,
  computeBracketLayout,
} from './computeBracketLayout';
import {
  computeConnectorPaths,
  type ConnectorRect,
} from './computeConnectorPaths';
import styles from './bracket.module.css';
import { useAutoHideScrollbar } from './useAutoHideScrollbar';
import type { BracketTree } from './types';
import type { Fixture } from '../fixtures/types';

interface BracketCanvasProps {
  tree: BracketTree;
  followedTeamIds: number[];
  onSelect?: (fixture: Fixture) => void;
}

function measureNodeRect(
  element: HTMLElement,
  container: HTMLElement,
): ConnectorRect {
  const nodeRect = element.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  return {
    x: nodeRect.left - containerRect.left,
    y: nodeRect.top - containerRect.top,
    width: nodeRect.width,
    height: nodeRect.height,
  };
}

export function BracketCanvas({
  tree,
  followedTeamIds,
  onSelect,
}: BracketCanvasProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const treeRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Map<number, HTMLElement>>(new Map());
  const [connectorPaths, setConnectorPaths] = useState<string[]>([]);
  const layout = useMemo(() => computeBracketLayout(), []);
  const { scrollbarsVisible, onScroll: markScrollbarsVisible } =
    useAutoHideScrollbar();

  const registerRef = useCallback(
    (matchNumber: number, element: HTMLElement | null) => {
      if (element) {
        nodeRefs.current.set(matchNumber, element);
      } else {
        nodeRefs.current.delete(matchNumber);
      }
    },
    [],
  );

  const edges = useMemo(
    () =>
      BRACKET_SLOTS.filter(
        (slot) =>
          slot.parentMatchNumbers != null && slot.matchNumber !== 103,
      ).map((slot) => ({
        childMatchNumber: slot.matchNumber,
        parentMatchNumbers: slot.parentMatchNumbers!,
      })),
    [],
  );

  const updateConnectors = useCallback(() => {
    const treeArea = treeRef.current;
    if (!treeArea) return;

    const rects = new Map<number, ConnectorRect>();
    for (const [matchNumber, element] of nodeRefs.current.entries()) {
      rects.set(matchNumber, measureNodeRect(element, treeArea));
    }

    const measuredEdges = edges
      .map(({ childMatchNumber, parentMatchNumbers }) => {
        const child = rects.get(childMatchNumber);
        const parentA = rects.get(parentMatchNumbers[0]);
        const parentB = rects.get(parentMatchNumbers[1]);
        if (!child || !parentA || !parentB) return null;
        return {
          parentA,
          parentB,
          child,
          columnGap: BRACKET_LAYOUT.columnGap,
        };
      })
      .filter((edge): edge is NonNullable<typeof edge> => edge != null);

    setConnectorPaths(computeConnectorPaths(measuredEdges));
  }, [edges]);

  useEffect(() => {
    const treeArea = treeRef.current;
    const scrollContainer = scrollRef.current;
    if (!treeArea || !scrollContainer) return;

    let frame = 0;
    const scheduleUpdate = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateConnectors);
    };

    const onScroll = () => {
      scheduleUpdate();
      markScrollbarsVisible();
    };

    const observer = new ResizeObserver(scheduleUpdate);
    observer.observe(treeArea);
    scrollContainer.addEventListener('scroll', onScroll, { passive: true });
    scheduleUpdate();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      scrollContainer.removeEventListener('scroll', onScroll);
    };
  }, [tree, updateConnectors, markScrollbarsVisible]);

  function scrollMatchToCenter(matchNumber: number) {
    const scrollContainer = scrollRef.current;
    const nodeLayout = layout.nodes.get(matchNumber);
    if (!scrollContainer || !nodeLayout) return;

    const { headerRowHeight, headerGap, columnWidth } = BRACKET_LAYOUT;
    const centerX = columnLeft(nodeLayout.columnIndex) + columnWidth / 2;
    const centerY =
      headerRowHeight + headerGap + nodeLayout.top + nodeLayout.height / 2;

    const maxScrollLeft = Math.max(
      0,
      scrollContainer.scrollWidth - scrollContainer.clientWidth,
    );
    const maxScrollTop = Math.max(
      0,
      scrollContainer.scrollHeight - scrollContainer.clientHeight,
    );

    scrollContainer.scrollTo({
      left: Math.min(
        Math.max(0, centerX - scrollContainer.clientWidth / 2),
        maxScrollLeft,
      ),
      top: Math.min(
        Math.max(0, centerY - scrollContainer.clientHeight / 2),
        maxScrollTop,
      ),
      behavior: 'smooth',
    });
  }

  function jumpToFinal() {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    requestAnimationFrame(() => {
      scrollMatchToCenter(104);
    });
  }

  function handleNodeClick(matchNumber: number) {
    const fixture = tree.nodes.get(matchNumber)?.fixture;
    if (fixture?.status === 'finished' && onSelect) {
      onSelect(fixture);
    }
  }

  return (
    <div className={styles.canvas}>
      <div
        ref={scrollRef}
        className={[
          styles.scrollContainer,
          scrollbarsVisible ? styles.scrollContainerActive : '',
        ].join(' ')}
        role="region"
        aria-label="Knockout bracket"
      >
        <div
          className={styles.scrollInner}
          style={{
            width: layout.canvasWidth,
            minHeight: layout.canvasHeight,
            ['--bracket-column-width' as string]: `${BRACKET_LAYOUT.columnWidth}px`,
          }}
        >
          <div
            className={styles.headerRow}
            style={{ height: BRACKET_LAYOUT.headerRowHeight }}
          >
            {COLUMN_LABELS.map((label, columnIndex) => (
              <div
                key={label}
                className={styles.headerCell}
                style={{ left: columnLeft(columnIndex) }}
                title={COLUMN_LABELS_FULL[columnIndex]}
              >
                {label}
              </div>
            ))}
          </div>

          <div
            ref={treeRef}
            className={styles.treeArea}
            style={{
              height: layout.treeHeight,
              marginTop: BRACKET_LAYOUT.headerGap,
            }}
          >
            <BracketConnectors
              paths={connectorPaths}
              width={layout.canvasWidth}
              height={layout.treeHeight}
            />

            {BRACKET_SLOTS.map((slot) => {
              const node = tree.nodes.get(slot.matchNumber);
              const nodeLayout = layout.nodes.get(slot.matchNumber);
              if (!node || !nodeLayout) return null;

              const fixture = node.fixture;
              const isClickable = fixture?.status === 'finished';

              return (
                <div
                  key={slot.matchNumber}
                  className={[
                    styles.nodeSlot,
                    isClickable ? styles.nodeSlotClickable : '',
                  ].join(' ')}
                  style={{
                    left: columnLeft(nodeLayout.columnIndex),
                    top: nodeLayout.top,
                    width: BRACKET_LAYOUT.columnWidth,
                    height: nodeLayout.height,
                  }}
                  ref={(element) => registerRef(slot.matchNumber, element)}
                  onClick={
                    isClickable && fixture
                      ? () => handleNodeClick(slot.matchNumber)
                      : undefined
                  }
                  onKeyDown={
                    isClickable && fixture
                      ? (event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            handleNodeClick(slot.matchNumber);
                          }
                        }
                      : undefined
                  }
                  tabIndex={isClickable ? 0 : undefined}
                  role={isClickable ? 'button' : undefined}
                  aria-label={
                    fixture
                      ? `View ${fixture.home_team.name} vs ${fixture.away_team.name}`
                      : undefined
                  }
                >
                  <BracketMatchNode
                    node={node}
                    followedTeamIds={followedTeamIds}
                    isFinal={slot.matchNumber === 104}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <button type="button" className={styles.jumpChip} onClick={jumpToFinal}>
        → Final
      </button>
    </div>
  );
}
