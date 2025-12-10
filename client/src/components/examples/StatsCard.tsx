import StatsCard from '../StatsCard';
import { Users, Vote, Link2 } from 'lucide-react';

export default function StatsCardExample() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
      <StatsCard
        title="Total Members"
        value={247}
        icon={Users}
        trend={{ value: 12, positive: true }}
      />
      <StatsCard
        title="Pending Votes"
        value={5}
        icon={Vote}
        description="3 need your vote"
      />
      <StatsCard
        title="My Invites"
        value={18}
        icon={Link2}
      />
    </div>
  );
}
