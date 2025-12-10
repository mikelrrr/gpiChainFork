import PromotionCard from '../PromotionCard';

export default function PromotionCardExample() {
  return (
    <div className="max-w-md space-y-4">
      <PromotionCard
        id="1"
        candidateName="Alice Johnson"
        currentLevel={2}
        proposedLevel={3}
        createdByName="Bob Smith"
        justification="Alice has consistently contributed to community events and helped onboard 15 new members."
        createdAt={new Date("2024-12-05")}
        votesFor={2}
        votesAgainst={0}
        requiredVotes={3}
        status="open"
        canVote={true}
        hasVoted={false}
        onVote={(id, vote, comment) => console.log("Voted:", id, vote, comment)}
      />
      <PromotionCard
        id="2"
        candidateName="Carlos Diaz"
        currentLevel={3}
        proposedLevel={4}
        createdByName="Eve Wilson"
        justification="Carlos has shown exceptional leadership in organizing weekly meetups."
        createdAt={new Date("2024-12-01")}
        votesFor={3}
        votesAgainst={1}
        requiredVotes={3}
        status="approved"
        hasVoted={true}
        onVote={(id, vote) => console.log("Voted:", id, vote)}
      />
    </div>
  );
}
