function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-6">
      <div className="text-center max-w-lg">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-lg bg-blue-500 flex items-center justify-center font-bold text-white">
            B
          </div>
          <span className="text-lg font-semibold tracking-wide text-slate-200">
            billvolt
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-semibold mb-3">
          Admin Portal
        </h1>
        <p className="text-slate-400 mb-8 leading-relaxed">
          We're building a centralized dashboard for practices, providers,
          credentialing, and reporting. Coming soon.
        </p>

        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-700 text-sm text-slate-400">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          In development
        </span>
      </div>
    </div>
  )
}

export default App
