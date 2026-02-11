import React, { useMemo, useState } from 'react';

const PLAYERS = [
  { id: 1, name: 'Jim Blisk', handicap: 14 },
  { id: 2, name: 'Troy Holler', handicap: 29 },
  { id: 3, name: 'Steve Oleary', handicap: 17 },
  { id: 4, name: 'Andrew Binder', handicap: 18 },
  { id: 5, name: 'Jack Linden', handicap: 17 },
  { id: 6, name: 'Giuseppe Infusino', handicap: 21 },
  { id: 7, name: 'James Dance', handicap: 20 },
  { id: 8, name: 'Rick Vallejo', handicap: 41 },
  { id: 9, name: 'Dan Coldagelli', handicap: 6 },
  { id: 10, name: 'Donald Burger', handicap: 16 },
  { id: 11, name: 'Arvin Joshi', handicap: 23 },
  { id: 12, name: 'Andy DeTolve', handicap: 11 },
  { id: 13, name: 'Steve McDermott', handicap: 14 },
  { id: 14, name: "Tim O'Malley", handicap: 51 },
  { id: 15, name: 'Jim Mueller', handicap: 26 },
  { id: 16, name: 'Brian Lambel', handicap: 12 },
  { id: 17, name: 'Peter Bychowski', handicap: 28 },
  { id: 18, name: 'David DiVito', handicap: 19 },
  { id: 19, name: 'Cliff Kubek', handicap: 18 },
  { id: 20, name: 'Mark Linton', handicap: 14 },
];

const WEEK_COUNT = 10;

const createInitialWeeks = () => {
  const playerIds = PLAYERS.map((player) => player.id);

  return Array.from({ length: WEEK_COUNT }, (_, index) => {
    const rotated = playerIds
      .slice(index)
      .concat(playerIds.slice(0, index));

    const teams = Array.from({ length: 10 }, (_, teamIndex) => ({
      id: teamIndex + 1,
      player1Id: rotated[teamIndex * 2],
      player2Id: rotated[teamIndex * 2 + 1],
      score: '',
    }));

    return {
      id: index + 1,
      name: `Week ${index + 1}`,
      date: '',
      teams,
    };
  });
};

const POINTS_BY_RANK = {
  1: 10,
  2: 9,
  3: 8,
  4: 7,
  5: 6,
  6: 5,
  7: 4,
  8: 3,
  9: 2,
  10: 1,
};

const getPlayerName = (playerId) => PLAYERS.find((player) => player.id === playerId)?.name || 'Unknown';

const isScoreValid = (score) => score !== '' && !Number.isNaN(Number(score));

const rankTeams = (teams) => {
  const scoredTeams = teams
    .filter((team) => isScoreValid(team.score))
    .map((team) => ({ ...team, numericScore: Number(team.score) }))
    .sort((a, b) => a.numericScore - b.numericScore);

  const rankedTeams = [];
  let index = 0;

  while (index < scoredTeams.length) {
    const tiedScore = scoredTeams[index].numericScore;
    const tiedTeams = [scoredTeams[index]];
    let cursor = index + 1;

    while (cursor < scoredTeams.length && scoredTeams[cursor].numericScore === tiedScore) {
      tiedTeams.push(scoredTeams[cursor]);
      cursor += 1;
    }

    const rank = index + 1;
    const points = POINTS_BY_RANK[rank] ?? 1;

    tiedTeams.forEach((team) => {
      rankedTeams.push({
        ...team,
        rank,
        points,
      });
    });

    index = cursor;
  }

  return rankedTeams;
};

export default function App() {
  const [activeTab, setActiveTab] = useState('groups');
  const [selectedWeekId, setSelectedWeekId] = useState(1);
  const [weeks, setWeeks] = useState(createInitialWeeks());

  const selectedWeek = weeks.find((week) => week.id === selectedWeekId) || weeks[0];

  const selectedWeekRankings = useMemo(
    () => rankTeams(selectedWeek?.teams || []),
    [selectedWeek],
  );

  const leaderboard = useMemo(() => {
    const totals = new Map();

    PLAYERS.forEach((player) => {
      totals.set(player.id, {
        playerId: player.id,
        name: player.name,
        handicap: player.handicap,
        totalPoints: 0,
      });
    });

    weeks.forEach((week) => {
      const weeklyPointsByPlayer = new Map();

      rankTeams(week.teams).forEach((team) => {
        const uniqueTeamPlayerIds = new Set([team.player1Id, team.player2Id]);

        uniqueTeamPlayerIds.forEach((playerId) => {
          const currentWeekPoints = weeklyPointsByPlayer.get(playerId) ?? 0;
          weeklyPointsByPlayer.set(playerId, Math.max(currentWeekPoints, team.points));
        });
      });

      weeklyPointsByPlayer.forEach((points, playerId) => {
        const current = totals.get(playerId);
        totals.set(playerId, {
          ...current,
          totalPoints: current.totalPoints + points,
        });
      });
    });

    return Array.from(totals.values()).sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      return a.name.localeCompare(b.name);
    });
  }, [weeks]);

  const duplicatePlayerIds = useMemo(() => {
    if (!selectedWeek) return [];

    const allIds = selectedWeek.teams.flatMap((team) => [team.player1Id, team.player2Id]);
    const seen = new Set();
    const duplicates = new Set();

    allIds.forEach((playerId) => {
      if (seen.has(playerId)) duplicates.add(playerId);
      seen.add(playerId);
    });

    return Array.from(duplicates);
  }, [selectedWeek]);

  const updateWeek = (weekId, updater) => {
    setWeeks((prevWeeks) => prevWeeks.map((week) => (week.id === weekId ? updater(week) : week)));
  };

  const updateTeam = (teamId, field, value) => {
    updateWeek(selectedWeekId, (week) => ({
      ...week,
      teams: week.teams.map((team) => (team.id === teamId ? { ...team, [field]: value } : team)),
    }));
  };

  const setWeekDate = (dateValue) => {
    updateWeek(selectedWeekId, (week) => ({ ...week, date: dateValue }));
  };

  const tabs = [
    { id: 'groups', label: 'Groups' },
    { id: 'leaderboard', label: 'Leaderboard' },
    { id: 'players', label: 'Players & Handicaps' },
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="bg-green-800 text-white shadow-md">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <h1 className="text-3xl font-bold">Friday night league</h1>
          <p className="mt-2 text-sm text-green-100">
            2-man scramble teams • Weekly points (10 to 1) • Season-long cumulative leaderboard
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-md px-4 py-2 text-sm font-semibold ${
                activeTab === tab.id
                  ? 'bg-green-700 text-white'
                  : 'bg-white text-slate-700 shadow-sm hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'groups' && (
          <section className="space-y-4">
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <label className="text-sm font-semibold text-slate-700">
                  Week
                  <select
                    className="mt-1 w-full rounded-md border border-slate-300 p-2"
                    value={selectedWeekId}
                    onChange={(event) => setSelectedWeekId(Number(event.target.value))}
                  >
                    {weeks.map((week) => (
                      <option key={week.id} value={week.id}>
                        {week.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm font-semibold text-slate-700">
                  Date
                  <input
                    type="date"
                    className="mt-1 w-full rounded-md border border-slate-300 p-2"
                    value={selectedWeek?.date || ''}
                    onChange={(event) => setWeekDate(event.target.value)}
                  />
                </label>
              </div>
            </div>

            {duplicatePlayerIds.length > 0 && (
              <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                Duplicate player assignments found in this week:{' '}
                {duplicatePlayerIds.map(getPlayerName).join(', ')}
              </div>
            )}

            <div className="overflow-hidden rounded-lg bg-white shadow-sm">
              <table className="min-w-full border-collapse text-sm">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="px-3 py-2 text-left">Team</th>
                    <th className="px-3 py-2 text-left">Player 1</th>
                    <th className="px-3 py-2 text-left">Player 2</th>
                    <th className="px-3 py-2 text-left">Score</th>
                    <th className="px-3 py-2 text-left">Rank</th>
                    <th className="px-3 py-2 text-left">Points / Player</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedWeek?.teams.map((team) => {
                    const ranking = selectedWeekRankings.find((row) => row.id === team.id);

                    return (
                      <tr key={team.id} className="border-t border-slate-200">
                        <td className="px-3 py-2 font-medium">Team {team.id}</td>
                        <td className="px-3 py-2">
                          <select
                            className="w-full rounded-md border border-slate-300 p-2"
                            value={team.player1Id}
                            onChange={(event) => updateTeam(team.id, 'player1Id', Number(event.target.value))}
                          >
                            {PLAYERS.map((player) => (
                              <option key={player.id} value={player.id}>
                                {player.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <select
                            className="w-full rounded-md border border-slate-300 p-2"
                            value={team.player2Id}
                            onChange={(event) => updateTeam(team.id, 'player2Id', Number(event.target.value))}
                          >
                            {PLAYERS.map((player) => (
                              <option key={player.id} value={player.id}>
                                {player.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            className="w-24 rounded-md border border-slate-300 p-2"
                            value={team.score}
                            onChange={(event) => updateTeam(team.id, 'score', event.target.value)}
                            placeholder="e.g. 34"
                          />
                        </td>
                        <td className="px-3 py-2">{ranking ? `#${ranking.rank}` : '-'}</td>
                        <td className="px-3 py-2 font-semibold">{ranking ? ranking.points : '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'leaderboard' && (
          <section className="overflow-hidden rounded-lg bg-white shadow-sm">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-3 py-2 text-left">Rank</th>
                  <th className="px-3 py-2 text-left">Player</th>
                  <th className="px-3 py-2 text-left">Handicap</th>
                  <th className="px-3 py-2 text-left">Total Points</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((row, index) => (
                  <tr key={row.playerId} className="border-t border-slate-200">
                    <td className="px-3 py-2 font-medium">{index + 1}</td>
                    <td className="px-3 py-2">{row.name}</td>
                    <td className="px-3 py-2">{row.handicap}</td>
                    <td className="px-3 py-2 font-bold">{row.totalPoints}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {activeTab === 'players' && (
          <section className="overflow-hidden rounded-lg bg-white shadow-sm">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-3 py-2 text-left">Player</th>
                  <th className="px-3 py-2 text-left">Handicap</th>
                </tr>
              </thead>
              <tbody>
                {PLAYERS.map((player) => (
                  <tr key={player.id} className="border-t border-slate-200">
                    <td className="px-3 py-2">{player.name}</td>
                    <td className="px-3 py-2">{player.handicap}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </main>
    </div>
  );
}
