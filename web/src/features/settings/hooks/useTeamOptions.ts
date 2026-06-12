import { useEffect, useState } from 'react';
import { fetchTeamPickerOptions, type TeamPickerOption } from '../api';

interface UseTeamOptionsResult {
  teamOptions: TeamPickerOption[];
  loadingTeams: boolean;
  teamLoadError: string | null;
}

export function useTeamOptions(): UseTeamOptionsResult {
  const [teamOptions, setTeamOptions] = useState<TeamPickerOption[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [teamLoadError, setTeamLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchTeamPickerOptions()
      .then((options) => {
        if (!cancelled) setTeamOptions(options);
      })
      .catch(() => {
        if (!cancelled)
          setTeamLoadError(
            'Could not load teams. Try again from the fixtures screen.',
          );
      })
      .finally(() => {
        if (!cancelled) setLoadingTeams(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { teamOptions, loadingTeams, teamLoadError };
}
