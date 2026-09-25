import { definePrismaConfig } from "prisma/config";

export default definePrismaConfig({
  orm: { contract: "./prisma/schema.prisma" },
  skills: {
    agents: ["claude", "cursor", "agents", "devin"],
  },
});
