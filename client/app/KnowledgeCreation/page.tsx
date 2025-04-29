"use client";
import { Suspense } from "react";
import KnowledgeCreation from "@/components/knowledge-creation";
import StoredKnowledge from "@/components/stored-knowledge";
import { useEffect, useState } from "react";
import Embodiments from "@/components/embodiments";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/router";
import { backendUrl } from "@/config/config";
import axios from "axios";
import PatentComponentGenerator from "@/components/section-generator";

export default function Home() {
  const [stage, setStage] = useState(1);
  const [patentId, setPatentId] = useState<string | "">("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setPatentId(params.get("patentId") || "");
    }
  }, []);

  const fetchStoredKnowledge = async () => {
    try {
      const approachResponse = await axios.get(
        `${backendUrl}/v1/knowledge/approach/${patentId}`
      );
      const innovationResponse = await axios.get(
        `${backendUrl}/v1/knowledge/innovation/${patentId}`
      );
      const technologyResponse = await axios.get(
        `${backendUrl}/v1/knowledge/technology/${patentId}`
      );
      const notesResponse = await axios.get(
        `${backendUrl}/v1/knowledge/research-note/${patentId}`
      );

      if (typeof window !== "undefined" && window.addStoredData) {
        if (approachResponse.data.data.length > 0) {
          for (const approachKnowledge of approachResponse.data.data) {
            const newNote = {
              patentId: patentId,
              question: approachKnowledge.question,
              answer: approachKnowledge.answer,
              section: "Approach",
              timestamp: approachKnowledge.created_at,
            };
            window.addStoredData("knowledge", newNote);
          }
        }

        if (innovationResponse.data.data.length > 0) {
          for (const innovationKnowledge of innovationResponse.data.data) {
            const newNote = {
              patentId: patentId,
              question: innovationKnowledge.question,
              answer: innovationKnowledge.answer,
              section: "Innovation",
              timestamp: innovationKnowledge.created_at,
            };
            window.addStoredData("knowledge", newNote);
          }
        }

        if (technologyResponse.data.data.length > 0) {
          for (const technologyKnowledge of technologyResponse.data.data) {
            const newNote = {
              patentId: patentId,
              question: technologyKnowledge.question,
              answer: technologyKnowledge.answer,
              section: "Technology",
              timestamp: technologyKnowledge.created_at,
            };
            window.addStoredData("knowledge", newNote);
          }
        }

        if (notesResponse.data.data.length > 0) {
          console.log("A");
          for (const notes of notesResponse.data.data) {
            const newNote = {
              patentId: patentId,
              question: "Research Note",
              answer: notes.content,
              section: "Note",
              timestamp: notes.created_at,
            };
            console.log("B", newNote);
            window.addStoredData("note", newNote);
          }
        }
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (patentId) {
      fetchStoredKnowledge();
    }
  }, [patentId]);

  return (
    <main className="container mx-auto px-4 py-8 relative">
      <StoredKnowledge stage={stage} setStage={setStage} />
      {stage === 1 ? (
        <KnowledgeCreation />
      ) : stage === 2 ? (
        <Embodiments />
      ) : (
        <PatentComponentGenerator />
      )}
    </main>
  );
}
