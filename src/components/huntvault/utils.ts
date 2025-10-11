export const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-500";
    case "pending":
      return "bg-blue-500";
    case "rejected":
      return "bg-red-500";
    case "placed":
      return "bg-purple-500";
    default:
      return "bg-gray-500";
  }
};

export const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};
