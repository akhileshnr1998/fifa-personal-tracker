import { MatchEventType } from './entities/match-event.entity';

const EXACT_EVENT_TYPE_MAP: Record<string, MatchEventType> = {
  Goal: 'goal',
  'Own Goal': 'own_goal',
  'Penalty - Goal': 'penalty_goal',
  'Penalty - Scored': 'penalty_goal',
  'Penalty - Miss': 'penalty_miss',
  'Penalty - Saved': 'penalty_miss',
  'Yellow Card': 'yellow_card',
  'Red Card': 'red_card',
  'Yellow-Red Card': 'red_card',
};

export function mapKeyEventType(rawType: string): MatchEventType | null {
  const exact = EXACT_EVENT_TYPE_MAP[rawType];
  if (exact) return exact;

  if (rawType.startsWith('Goal')) return 'goal';

  return null;
}

export function parseKeyEventText(
  rawType: string,
  text: string,
  mappedType: MatchEventType,
): { player_name: string | null; assist_name: string | null } {
  if (!text) return { player_name: null, assist_name: null };

  if (mappedType === 'own_goal') {
    const ownGoalMatch = text.match(/^Own Goal by ([^.]+),/i);
    return { player_name: ownGoalMatch?.[1]?.trim() ?? null, assist_name: null };
  }

  if (
    mappedType === 'goal' ||
    mappedType === 'penalty_goal' ||
    mappedType === 'penalty_miss'
  ) {
    const playerMatch = text.match(/Goal!.*?\. (.+?) \([^)]+\)/);
    const assistMatch = text.match(/Assisted by ([^.]+?)(?:\s+with|\.\s*$|\.)/i);
    return {
      player_name: playerMatch?.[1]?.trim() ?? null,
      assist_name: assistMatch?.[1]?.trim() ?? null,
    };
  }

  if (mappedType === 'yellow_card' || mappedType === 'red_card') {
    const cardMatch = text.match(/^(.+?) \([^)]+\) is shown the (?:yellow|red) card/i);
    return { player_name: cardMatch?.[1]?.trim() ?? null, assist_name: null };
  }

  return { player_name: null, assist_name: null };
}
