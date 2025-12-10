import FirstAdminSetup from '../FirstAdminSetup';

export default function FirstAdminSetupExample() {
  return (
    <div className="h-[600px] overflow-auto bg-background rounded-lg">
      <FirstAdminSetup onSetup={() => console.log("Admin setup triggered")} />
    </div>
  );
}
