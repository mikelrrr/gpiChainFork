import { useState } from 'react';
import BottomNav from '../BottomNav';

export default function BottomNavExample() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "invites" | "promotions" | "profile">("dashboard");
  
  return (
    <div className="relative h-20 bg-muted rounded-lg overflow-hidden">
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        pendingVotes={3}
      />
    </div>
  );
}
