import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PromotionCard from "./PromotionCard";
import { useToast } from "@/hooks/use-toast";

// todo: remove mock functionality
const mockPromotions = [
  {
    id: "1",
    candidateName: "Alice Johnson",
    currentLevel: 2 as const,
    proposedLevel: 3 as const,
    createdByName: "Bob Smith",
    justification: "Alice has consistently contributed to community events and helped onboard 15 new members. She demonstrates excellent leadership qualities.",
    createdAt: new Date("2024-12-05"),
    votesFor: 2,
    votesAgainst: 0,
    requiredVotes: 3,
    status: "open" as const,
  },
  {
    id: "2",
    candidateName: "Diana Lee",
    currentLevel: 1 as const,
    proposedLevel: 2 as const,
    createdByName: "Carlos Diaz",
    justification: "Diana has been an active member for 6 months and invited 5 new members who are all active contributors.",
    createdAt: new Date("2024-12-08"),
    votesFor: 1,
    votesAgainst: 1,
    requiredVotes: 3,
    status: "open" as const,
  },
  {
    id: "3",
    candidateName: "Carlos Diaz",
    currentLevel: 3 as const,
    proposedLevel: 4 as const,
    createdByName: "Eve Wilson",
    justification: "Carlos has shown exceptional leadership in organizing weekly meetups and mentoring new members.",
    createdAt: new Date("2024-12-01"),
    votesFor: 3,
    votesAgainst: 1,
    requiredVotes: 3,
    status: "approved" as const,
  },
  {
    id: "4",
    candidateName: "Frank Miller",
    currentLevel: 2 as const,
    proposedLevel: 3 as const,
    createdByName: "Bob Smith",
    justification: "Frank has potential but needs more time to prove himself.",
    createdAt: new Date("2024-11-20"),
    votesFor: 1,
    votesAgainst: 3,
    requiredVotes: 3,
    status: "rejected" as const,
  },
];

export default function PromotionsView() {
  const [tab, setTab] = useState("open");
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set(["3", "4"]));
  const { toast } = useToast();

  const handleVote = (id: string, vote: "for" | "against", comment?: string) => {
    console.log("Vote submitted:", { id, vote, comment });
    setVotedIds(prev => new Set(Array.from(prev).concat(id)));
    toast({
      title: "Vote Submitted",
      description: `You voted ${vote} the promotion${comment ? " with a comment" : ""}.`,
    });
  };

  const openPromotions = mockPromotions.filter(p => p.status === "open");
  const closedPromotions = mockPromotions.filter(p => p.status !== "open");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Promotions</h1>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="open" data-testid="tab-open-promotions">
            Open ({openPromotions.length})
          </TabsTrigger>
          <TabsTrigger value="closed" data-testid="tab-closed-promotions">
            Closed ({closedPromotions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="space-y-3 mt-4">
          {openPromotions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No open promotion requests</p>
          ) : (
            openPromotions.map(promotion => (
              <PromotionCard
                key={promotion.id}
                {...promotion}
                hasVoted={votedIds.has(promotion.id)}
                canVote={true}
                onVote={handleVote}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="closed" className="space-y-3 mt-4">
          {closedPromotions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No closed promotions yet</p>
          ) : (
            closedPromotions.map(promotion => (
              <PromotionCard
                key={promotion.id}
                {...promotion}
                hasVoted={votedIds.has(promotion.id)}
                canVote={false}
                onVote={handleVote}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
