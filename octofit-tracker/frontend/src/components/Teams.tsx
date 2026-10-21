import { useApiResource } from '../api/useApiResource.js';

type Team = { _id?: string; name: string; mascot?: string; members: string[] };

export default function Teams() {
  const resource = useApiResource<{ teams: Team[] }>('/api/teams');

  return <section className="card h-100"><div className="card-body">
    <h2 className="h4">Teams</h2>
    <p>Manage teams and members.</p>
    {resource.status === 'loading' && <p role="status">Loading teams...</p>}
    {resource.status === 'error' && <p role="alert">Unable to load teams.</p>}
    {resource.status === 'success' && resource.data.teams.length === 0 && <p>No teams yet.</p>}
    {resource.status === 'success' && resource.data.teams.length > 0 && <ul className="list-group">
      {resource.data.teams.map((team, index) => <li className="list-group-item" key={team._id ?? `${team.name}-${index}`}>
        <h3 className="h5 mb-1">{team.name}</h3>
        {team.mascot && <p className="mb-1">Mascot: {team.mascot}</p>}
        <p className="mb-0">Members: {team.members.length > 0 ? team.members.join(', ') : 'None'}</p>
      </li>)}
    </ul>}
  </div></section>;
}
