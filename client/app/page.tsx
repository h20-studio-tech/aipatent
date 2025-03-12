"use client";

import KnowledgeCreation from "@/components/knowledge-creation";
import StoredKnowledge from "@/components/stored-knowledge";
import { useState } from "react";

export default function Home() {
  const [chats, setChats] = useState<any[]>([]);

  return (
    <main className="container mx-auto px-4 py-8 relative">
      <StoredKnowledge chats={chats} />
      <KnowledgeCreation chats={chats} setChats={setChats} />{" "}
      {/* ✅ Properly pass as props */}
    </main>
  );
}
