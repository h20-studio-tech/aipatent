"use client";
import { Suspense } from "react";
import KnowledgeCreation from "@/components/knowledge-creation";
import StoredKnowledge from "@/components/stored-knowledge";
import { useEffect, useState } from "react";

export default function Home() {
  const [chats, setChats] = useState<any[]>([]);
  const saveChats = (chat: any) => {
    setChats((prevChats: any[]) => {
      const isDuplicate = prevChats.some(
        (existingChat) => existingChat.answer === chat.answer
      );

      if (!isDuplicate) {
        return [chat, ...prevChats];
      }

      return prevChats;
    });
  };

  return (
    <main className="container mx-auto px-4 py-8 relative">
      <StoredKnowledge chats={chats} />
      <KnowledgeCreation
        chats={chats}
        setChats={setChats}
        saveChats={saveChats}
      />{" "}
      {/* ✅ Properly pass as props */}
    </main>
  );
}
