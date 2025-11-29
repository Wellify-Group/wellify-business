"use client";

import useStore from "@/lib/store";
import { ConversationDialog } from "./conversation-dialog";

export function ConversationManager() {
  const { openConversations, minimizedConversations, conversationData } = useStore();
  
  // Получаем все активные диалоги
  const allConversations = Array.from(new Set([
    ...openConversations,
    ...minimizedConversations
  ]));
  
  return (
    <>
      {allConversations.map(conversationId => {
        const data = conversationData[conversationId];
        if (!data) return null;
        
        return (
          <ConversationDialog
            key={conversationId}
            conversationId={conversationId}
            type={data.type}
            recipientId={data.recipientId}
            recipientName={data.recipientName}
            context={data.context}
            profileLink={data.profileLink}
          />
        );
      })}
    </>
  );
}

