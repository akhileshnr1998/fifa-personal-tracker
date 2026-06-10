import type { ComponentType } from 'react';

export interface TournamentWidget {
  id: string;
  label: string;
  phase: number;
  lazy: () => Promise<{ default: ComponentType }>;
  navOrder: number;
}

const widgets = new Map<string, TournamentWidget>();

export function registerWidget(widget: TournamentWidget): void {
  widgets.set(widget.id, widget);
}

export function getEnabledWidgets(currentPhase: number): TournamentWidget[] {
  return [...widgets.values()]
    .filter((widget) => widget.phase <= currentPhase)
    .sort((a, b) => a.navOrder - b.navOrder);
}

export function getWidgetById(id: string): TournamentWidget | undefined {
  return widgets.get(id);
}
