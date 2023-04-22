import { z } from "zod";

export const messageDdbItemSchema = z.object({
  id: z.string(),
  content: z.string(),
  threadTs: z.string(),
  saidAt: z.string(),
  role: z.enum(["user", "system", "assistant"]),
});
export type MessageDdbItem = z.infer<typeof messageDdbItemSchema>;

export const messageDdbItemsSchema = z.array(messageDdbItemSchema);
export type MessageDdbItems = z.infer<typeof messageDdbItemsSchema>;