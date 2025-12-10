import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SiGoogle } from "react-icons/si";
import { Crown, Users, Shield, Sparkles } from "lucide-react";

interface FirstAdminSetupProps {
  onSetup: () => void;
}

export default function FirstAdminSetup({ onSetup }: FirstAdminSetupProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center mb-4">
            <Crown className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Welcome to Community HQ</h1>
          <p className="text-muted-foreground">
            Let's set up your community's first administrator
          </p>
        </div>

        <Card className="border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-purple-900 dark:text-purple-100">You'll be the founding admin</p>
                <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                  As Level 5, you can invite members, manage levels, and build your community.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg">Create Admin Account</CardTitle>
            <CardDescription>
              Sign in with Google to become the first Level 5 administrator
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full bg-purple-600 hover:bg-purple-700" 
              size="lg"
              onClick={onSetup}
              data-testid="button-setup-admin"
            >
              <SiGoogle className="h-4 w-4 mr-2" />
              Setup with Google
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-medium">As the founding admin, you can:</p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <Users className="h-4 w-4 mt-0.5 text-purple-600 shrink-0" />
                <span>Invite the first members to your community</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="h-4 w-4 mt-0.5 text-purple-600 shrink-0" />
                <span>Directly change member levels without votes</span>
              </li>
              <li className="flex items-start gap-2">
                <Crown className="h-4 w-4 mt-0.5 text-purple-600 shrink-0" />
                <span>Promote other trusted members to Level 5</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
