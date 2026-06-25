import { mapKeyEventType, parseKeyEventText } from './espn-key-event.parser';

describe('mapKeyEventType', () => {
  it('maps exact ESPN type labels', () => {
    expect(mapKeyEventType('Penalty - Scored')).toBe('penalty_goal');
    expect(mapKeyEventType('Own Goal')).toBe('own_goal');
    expect(mapKeyEventType('Yellow Card')).toBe('yellow_card');
  });

  it('maps Goal variants by prefix', () => {
    expect(mapKeyEventType('Goal - Header')).toBe('goal');
  });

  it('returns null for non-match events', () => {
    expect(mapKeyEventType('Substitution')).toBeNull();
    expect(mapKeyEventType('Kickoff')).toBeNull();
  });
});

describe('parseKeyEventText', () => {
  it('parses goal scorer and assist from commentary text', () => {
    const result = parseKeyEventText(
      'Goal',
      'Goal! Mexico 1, South Africa 0. Julián Quiñones (Mexico) right footed shot from the centre of the box to the centre of the goal. Assisted by Érik Lira.',
      'goal',
    );

    expect(result).toEqual({
      player_name: 'Julián Quiñones',
      assist_name: 'Érik Lira',
    });
  });

  it('parses card player from commentary text', () => {
    const result = parseKeyEventText(
      'Yellow Card',
      'Teboho Mokoena (South Africa) is shown the yellow card for a bad foul.',
      'yellow_card',
    );

    expect(result).toEqual({
      player_name: 'Teboho Mokoena',
      assist_name: null,
    });
  });

  it('parses own goal player from commentary text', () => {
    const result = parseKeyEventText(
      'Own Goal',
      'Own Goal by Miro Muheim, Switzerland. Qatar 1, Switzerland 1.',
      'own_goal',
    );

    expect(result).toEqual({
      player_name: 'Miro Muheim',
      assist_name: null,
    });
  });

  it('parses penalty scorer from commentary text', () => {
    const result = parseKeyEventText(
      'Penalty - Scored',
      'Goal! Qatar 0, Switzerland 1. Breel Embolo (Switzerland) converts the penalty with a right footed shot to the bottom left corner.',
      'penalty_goal',
    );

    expect(result).toEqual({
      player_name: 'Breel Embolo',
      assist_name: null,
    });
  });
});
