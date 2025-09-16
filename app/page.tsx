export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-4xl mx-auto p-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          Malmequer Ecommerce Backend
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Complete ecommerce backend API with authentication, payments, and admin features
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-3">🛍️ Products API</h3>
            <p className="text-gray-600 text-sm">Complete product management with categories, images, variants, and inventory</p>
            <code className="block mt-3 text-xs bg-gray-100 p-2 rounded">/api/products</code>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-3">🛒 Cart & Orders</h3>
            <p className="text-gray-600 text-sm">Shopping cart management and order processing with multiple statuses</p>
            <code className="block mt-3 text-xs bg-gray-100 p-2 rounded">/api/cart</code>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-3">💳 Stripe Payments</h3>
            <p className="text-gray-600 text-sm">Complete payment processing with webhooks and refund support</p>
            <code className="block mt-3 text-xs bg-gray-100 p-2 rounded">/api/payments</code>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-3">🔐 Authentication</h3>
            <p className="text-gray-600 text-sm">NextAuth.js with credentials and OAuth providers</p>
            <code className="block mt-3 text-xs bg-gray-100 p-2 rounded">/api/auth</code>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-3">💝 Wishlist</h3>
            <p className="text-gray-600 text-sm">User wishlist management with move to cart functionality</p>
            <code className="block mt-3 text-xs bg-gray-100 p-2 rounded">/api/wishlist</code>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-3">👨‍💼 Admin Panel</h3>
            <p className="text-gray-600 text-sm">Complete admin dashboard with user management and analytics</p>
            <code className="block mt-3 text-xs bg-gray-100 p-2 rounded">/api/admin</code>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-3">📧 Notificações por E-mail</h3>
            <p className="text-gray-600 text-sm">Sistema completo de notificações com templates personalizados</p>
            <code className="block mt-3 text-xs bg-gray-100 p-2 rounded">/api/notifications</code>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-3">⚙️ Preferências</h3>
            <p className="text-gray-600 text-sm">Gestão de preferências de notificações por utilizador</p>
            <code className="block mt-3 text-xs bg-gray-100 p-2 rounded">/api/user/notification-settings</code>
          </div>
        </div>

        <div className="mt-12 p-6 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">🚀 Quick Start</h3>
          <div className="text-left space-y-2 text-sm font-mono">
            <div>1. Configure your <code>.env</code> file with database and Stripe keys</div>
            <div>2. Run <code>npx prisma migrate dev</code> to setup the database</div>
            <div>3. Start the server with <code>pnpm dev</code></div>
            <div>4. Access the APIs at <code>http://localhost:3000/api/*</code></div>
          </div>
        </div>
      </div>
    </div>
  );
}
