import UserCard from '../UserCard';

export default function UserCardExample() {
  return (
    <div className="max-w-md space-y-4">
      <UserCard
        id="1"
        name="Alice Johnson"
        email="alice@example.com"
        level={3}
        status="active"
        invitedBy="Bob Smith"
        inviteCount={12}
        joinedAt={new Date("2024-03-15")}
        onViewProfile={(id) => console.log("View profile:", id)}
      />
      <UserCard
        id="2"
        name="Carlos Diaz"
        email="carlos@example.com"
        level={5}
        status="active"
        inviteCount={45}
        joinedAt={new Date("2023-08-01")}
        onViewProfile={(id) => console.log("View profile:", id)}
      />
    </div>
  );
}
