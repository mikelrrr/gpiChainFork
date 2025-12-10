import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SiGoogle } from "react-icons/si";
import { Users, Shield, Link2 } from "lucide-react";

interface LoginViewProps {
  onLogin: () => void;
  inviteToken?: string;
  inviterName?: string;
}

export default function LoginView({ onLogin, inviteToken, inviterName }: LoginViewProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Community HQ</h1>
          <p className="text-muted-foreground">
            {inviteToken 
              ? "You've been invited to join our community"
              : "Membership management for your creative community"
            }
          </p>
        </div>

        {inviterName && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Link2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Invited by {inviterName}</p>
                <p className="text-xs text-muted-foreground">Click below to accept your invitation</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg">
              {inviteToken ? "Accept Invitation" : "Sign In"}
            </CardTitle>
            <CardDescription>
              {inviteToken 
                ? "Sign in with Google to join the community"
                : "Sign in to access your membership dashboard"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              size="lg"
              onClick={onLogin}
              data-testid="button-google-signin"
            >
              <SiGoogle className="h-4 w-4 mr-2" />
              Continue with Google
            </Button>
          </CardContent>
        </Card>

        {inviteToken && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <p className="text-sm font-medium">By joining, you agree to:</p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <Shield className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <span>Follow community guidelines and respect all members</span>
                </li>
                <li className="flex items-start gap-2">
                  <Users className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <span>Only invite people you trust and vouch for</span>
                </li>
                <li className="flex items-start gap-2">
                  <Link2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <span>Maintain the integrity of the invitation chain</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground">
          {inviteToken 
            ? "This is an invite-only community. Your invitation link is valid for one use."
            : "Access is by invitation only. Contact an existing member for an invite."
          }
        </p>
      </div>
    </div>
  );
}
