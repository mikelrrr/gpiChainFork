import GPIChainNode from '../GPIChainNode';

const mockChain = {
  id: "1",
  name: "Eve Wilson",
  level: 5 as const,
  invitees: [
    {
      id: "2",
      name: "Bob Smith",
      level: 4 as const,
      invitees: [
        { id: "4", name: "Alice Johnson", level: 3 as const, invitees: [
          { id: "6", name: "Frank Lee", level: 2 as const },
          { id: "7", name: "Grace Kim", level: 1 as const },
        ]},
        { id: "5", name: "Carlos Diaz", level: 2 as const },
      ],
    },
    {
      id: "3",
      name: "Diana Lee",
      level: 3 as const,
      invitees: [
        { id: "8", name: "Henry Park", level: 2 as const },
      ],
    },
  ],
};

export default function GPIChainNodeExample() {
  return (
    <div className="max-w-md p-4 bg-card rounded-lg">
      <GPIChainNode
        node={mockChain}
        onSelectUser={(id) => console.log("Selected user:", id)}
      />
    </div>
  );
}
