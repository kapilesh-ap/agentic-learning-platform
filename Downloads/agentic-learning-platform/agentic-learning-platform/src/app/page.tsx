import AgentWorkspace from '@/components/AgentWorkspace'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-4">
        <header className="mb-6">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Agentic AI Learning Platform
          </h1>
          <p className="text-slate-600 text-lg">
            Learn how AI agents work together by building your own agent workflows
          </p>
        </header>
        
        <AgentWorkspace />
      </div>
    </main>
  )
}
