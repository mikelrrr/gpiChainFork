import InviteLinkCard from '../InviteLinkCard';

export default function InviteLinkCardExample() {
  return (
    <div className="max-w-md space-y-4">
      <InviteLinkCard
        id="1"
        token="abc123xyz"
        usesCount={0}
        maxUses={1}
        status="active"
        createdAt={new Date("2024-12-10")}
        baseUrl="https://example.com"
      />
      <InviteLinkCard
        id="2"
        token="def456uvw"
        usesCount={1}
        maxUses={1}
        status="used"
        createdAt={new Date("2024-12-08")}
        usedByName="Alice Johnson"
        baseUrl="https://example.com"
      />
    </div>
  );
}
