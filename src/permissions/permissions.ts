import { PilotRank } from "@prisma/client";

export const permissions = {
  [PilotRank.COMMAND]: 35,
  [PilotRank.SUB_COMMAND]: 30,
  [PilotRank.VETERAN_PILOT]: 25,
  [PilotRank.SENIOR_PILOT]: 20,
  [PilotRank.EXPERIENCED_PILOT]: 15,
  [PilotRank.PILOT]: 10,
  [PilotRank.PROBATIONARY_PILOT]: 5,
};