import { useApiResource } from '../api/useApiResource.js';

type Activity = { _id?: string; type: string; minutes: number; points: number };

export default function Activities() {
  const resource = useApiResource<{ activities: Activity[] }>('/api/activities');

  return <section className="card h-100"><div className="card-body">
    <h2 className="h4">Activities</h2>
    <p>Track student activity minutes and points.</p>
    {resource.status === 'loading' && <p role="status">Loading activities...</p>}
    {resource.status === 'error' && <p role="alert">Unable to load activities.</p>}
    {resource.status === 'success' && resource.data.activities.length === 0 && <p>No activities yet.</p>}
    {resource.status === 'success' && resource.data.activities.length > 0 && <ul className="list-group">
      {resource.data.activities.map((activity, index) => <li className="list-group-item" key={activity._id ?? `${activity.type}-${index}`}>
        {activity.type}: {activity.minutes} minutes, {activity.points} points
      </li>)}
    </ul>}
  </div></section>;
}
