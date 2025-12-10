import StatusDot from '../StatusDot';

export default function StatusDotExample() {
  return (
    <div className="flex flex-wrap gap-4 items-center">
      <StatusDot status="active" />
      <StatusDot status="suspended" />
      <StatusDot status="expelled" />
    </div>
  );
}
