"use client";
import { Suspense } from "react";
import KnowledgeCreation from "@/components/knowledge-creation";
import StoredKnowledge from "@/components/stored-knowledge";
import { useEffect, useState } from "react";
import Embodiments from "@/components/embodiments";

export default function Home() {
  const [stage, setStage] = useState(1);

  return (
    <main className="container mx-auto px-4 py-8 relative">
      <StoredKnowledge stage={stage} setStage={setStage} />
      {stage === 1 ? <KnowledgeCreation /> : <Embodiments />}
    </main>
  );
}
