import LoginView from '../LoginView';

export default function LoginViewExample() {
  return (
    <div className="h-[600px] overflow-auto bg-background rounded-lg">
      <LoginView
        onLogin={() => console.log("Login triggered")}
        inviteToken="abc123"
        inviterName="Eve Wilson"
      />
    </div>
  );
}
