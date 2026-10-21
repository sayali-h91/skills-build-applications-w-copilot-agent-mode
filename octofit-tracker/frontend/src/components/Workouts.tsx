import { useApiResource } from '../api/useApiResource.js';

type Workout = { _id?: string; title: string; focus: string; minutes: number; difficulty: string; reason: string };
const suggestionsPath = `/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`;

export default function Workouts() {
  const resource = useApiResource<{ suggestions: Workout[] }>(suggestionsPath);

  return <section className="card h-100"><div className="card-body">
    <h2 className="h4">Workout suggestions</h2>
    <p>Recommend workouts from activity patterns.</p>
    {resource.status === 'loading' && <p role="status">Loading workout suggestions...</p>}
    {resource.status === 'error' && <p role="alert">Unable to load workout suggestions.</p>}
    {resource.status === 'success' && resource.data.suggestions.length === 0 && <p>No workout suggestions yet.</p>}
    {resource.status === 'success' && resource.data.suggestions.length > 0 && <ul className="list-group">
      {resource.data.suggestions.map((workout, index) => <li className="list-group-item" key={workout._id ?? `${workout.title}-${index}`}>
        <h3 className="h5 mb-1">{workout.title}</h3>
        <p className="mb-1">{workout.focus}: {workout.minutes} minutes, {workout.difficulty}</p>
        <p className="mb-0">{workout.reason}</p>
      </li>)}
    </ul>}
  </div></section>;
}
