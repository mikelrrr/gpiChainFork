import LevelBadge from '../LevelBadge';

export default function LevelBadgeExample() {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <LevelBadge level={1} />
      <LevelBadge level={2} />
      <LevelBadge level={3} />
      <LevelBadge level={4} />
      <LevelBadge level={5} />
      <LevelBadge level={3} size="sm" />
    </div>
  );
}
