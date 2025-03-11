import KnowledgeCreation from "@/components/knowledge-creation"
import StoredKnowledge from "@/components/stored-knowledge"

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8 relative">
      <StoredKnowledge />
      <KnowledgeCreation />
    </main>
  )
}

