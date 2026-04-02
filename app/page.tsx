export default function Page() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          PMS ERP System
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Point of Sale & Enterprise Resource Planning
        </p>
        <div className="space-y-4">
          <p className="text-gray-700">
            🎉 Category Management Module is installed and ready!
          </p>
          <p className="text-sm text-gray-500">
            Visit <code className="bg-gray-200 px-2 py-1 rounded">/dashboard/categories</code> to get started
          </p>
        </div>
      </div>
    </main>
  )
}
