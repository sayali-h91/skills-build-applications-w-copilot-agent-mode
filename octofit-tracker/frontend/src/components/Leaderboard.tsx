import { useApiResource } from '../api/useApiResource.js';

type Ranking = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  const resource = useApiResource<{ leaderboard: Ranking[] }>('/api/leaderboard');

  return <section className="card h-100"><div className="card-body">
    <h2 className="h4">Leaderboard</h2>
    <p>Compare team point totals.</p>
    {resource.status === 'loading' && <p role="status">Loading leaderboard...</p>}
    {resource.status === 'error' && <p role="alert">Unable to load leaderboard.</p>}
    {resource.status === 'success' && resource.data.leaderboard.length === 0 && <p>No rankings yet.</p>}
    {resource.status === 'success' && resource.data.leaderboard.length > 0 && <table className="table">
      <thead><tr><th scope="col">Rank</th><th scope="col">Team</th><th scope="col">Points</th></tr></thead>
      <tbody>{resource.data.leaderboard.map((entry) => <tr key={entry.rank}>
        <th scope="row">{entry.rank}</th><td>{entry.teamName}</td><td>{entry.totalPoints}</td>
      </tr>)}</tbody>
    </table>}
  </div></section>;
}
