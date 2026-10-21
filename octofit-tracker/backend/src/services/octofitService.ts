import { Activity, Team, User, Workout } from '../models/index.js';
import { Types } from 'mongoose';

function serviceError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === 'object' && input !== null && !Array.isArray(input);
}

function isObjectId(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{24}$/i.test(value);
}

function activityFocus(type: string) {
  const focusByActivity: Record<string, string> = {
    run: 'endurance',
    cycle: 'endurance',
    bike: 'endurance',
    walk: 'endurance',
    swim: 'endurance',
    strength: 'strength',
    yoga: 'flexibility',
  };
  return focusByActivity[type.toLowerCase()] ?? type.toLowerCase();
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) throw serviceError(400, 'Activity details are required');
  const { userId, teamId, type, minutes } = input;
  if (!isObjectId(userId) || !isObjectId(teamId)) throw serviceError(400, 'Valid userId and teamId are required');
  if (typeof type !== 'string' || !type.trim()) throw serviceError(400, 'Activity type is required');
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    throw serviceError(400, 'Minutes must be a positive number');
  }

  const [user, team] = await Promise.all([
    User.findById(userId).select('team').lean(),
    Team.findById(teamId).select('members').lean(),
  ]);
  if (!user || !team) throw serviceError(404, 'User or team was not found');
  const isAssignedTeam = user.team?.toString() === teamId.toLowerCase();
  const isTeamMember = team.members.some((member) => member.toString() === userId.toLowerCase());
  if (!isAssignedTeam || !isTeamMember) throw serviceError(400, 'User must belong to the selected team');

  return Activity.create({
    user: new Types.ObjectId(userId),
    team: new Types.ObjectId(teamId),
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) throw serviceError(400, 'Team details are required');
  const { name, mascot } = input;
  const members = input.members ?? [];
  if (typeof name !== 'string' || !name.trim()) throw serviceError(400, 'Team name is required');
  if (typeof mascot !== 'string' || !mascot.trim()) throw serviceError(400, 'Team mascot is required');
  if (!Array.isArray(members) || !members.every(isObjectId)) {
    throw serviceError(400, 'Members must be an array of valid user IDs');
  }

  const memberIds = [...new Set(members.map((memberId: string) => memberId.toLowerCase()))];
  if (memberIds.length > 0) {
    const existingMemberCount = await User.countDocuments({ _id: { $in: memberIds } });
    if (existingMemberCount !== memberIds.length) throw serviceError(404, 'One or more team members were not found');
  }

  const team = await Team.create({ name: name.trim(), mascot: mascot.trim(), members: memberIds });
  if (memberIds.length > 0) {
    await Promise.all([
      Team.updateMany(
        { _id: { $ne: team._id }, members: { $in: memberIds } },
        { $pull: { members: { $in: memberIds } } },
      ),
      User.updateMany({ _id: { $in: memberIds } }, { $set: { team: team._id } }),
    ]);
  }
  return team;
}

export async function getLeaderboard() {
  const [teams, activities] = await Promise.all([
    Team.find().lean(),
    Activity.find().select({ team: 1, points: 1 }).lean(),
  ]);
  const totals = new Map<string, number>();
  for (const activity of activities) {
    const teamId = activity.team.toString();
    totals.set(teamId, (totals.get(teamId) ?? 0) + activity.points);
  }

  return teams
    .map((team) => ({
      teamName: team.name,
      totalPoints: totals.get(team._id.toString()) ?? 0,
    }))
    .sort((first, second) => second.totalPoints - first.totalPoints || first.teamName.localeCompare(second.teamName))
    .map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.trim().toLowerCase() }).lean();
  if (!user) throw serviceError(404, 'User was not found');

  const [workouts, recentActivities] = await Promise.all([
    Workout.find().lean(),
    Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).select({ type: 1 }).lean(),
  ]);
  const recommendations = [
    { focus: user.fitnessGoal.toLowerCase(), reason: `Recommended for your ${user.fitnessGoal} goal.` },
    ...recentActivities.map((activity) => ({
      focus: activityFocus(activity.type),
      reason: `Recommended based on your recent ${activity.type} activity.`,
    })),
  ];

  return workouts
    .map((workout) => {
      const recommendation = recommendations.find(({ focus }) => focus === workout.focus.toLowerCase());
      return { ...workout, reason: recommendation?.reason ?? `Suggested to support your ${workout.focus} fitness.` };
    })
    .sort((first, second) => {
      const firstRank = recommendations.findIndex(({ focus }) => focus === first.focus.toLowerCase());
      const secondRank = recommendations.findIndex(({ focus }) => focus === second.focus.toLowerCase());
      return (firstRank < 0 ? Number.MAX_SAFE_INTEGER : firstRank) - (secondRank < 0 ? Number.MAX_SAFE_INTEGER : secondRank);
    });
}

export { User };
