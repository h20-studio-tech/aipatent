"use client";

import KnowledgeCreation from "@/components/knowledge-creation";
import StoredKnowledge from "@/components/stored-knowledge";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const searchParams = useSearchParams();
  const patentId = searchParams.get("patentId");
  const [chats, setChats] = useState<any[]>([]);

  useEffect(() => {
    if (patentId) {
      console.log("patentId", patentId);
    }
  }, [patentId]);

  return (
    <main className="container mx-auto px-4 py-8 relative">
      <StoredKnowledge chats={chats} />
      <KnowledgeCreation
        chats={chats}
        setChats={setChats}
        patentId={patentId}
      />{" "}
      {/* ✅ Properly pass as props */}
    </main>
  );
}
