import UserAvatar from '../UserAvatar';

export default function UserAvatarExample() {
  return (
    <div className="flex flex-wrap gap-4 items-center">
      <UserAvatar name="Alice Johnson" level={1} size="sm" />
      <UserAvatar name="Bob Smith" level={2} size="md" />
      <UserAvatar name="Carlos Diaz" level={3} size="md" />
      <UserAvatar name="Diana Lee" level={4} size="md" />
      <UserAvatar name="Eve Wilson" level={5} size="lg" />
    </div>
  );
}
