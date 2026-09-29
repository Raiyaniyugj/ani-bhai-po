const fs = require('fs');

// 1. Update App.jsx to include AuthProvider, AuthPage and ProtectedRoute
let appJsx = fs.readFileSync('src/App.jsx', 'utf8');

const imports = `import { AuthProvider, useAuth } from './contexts/AuthContext';\nimport AuthPage from './pages/AuthPage';\n`;
if (!appJsx.includes("import AuthPage")) {
  appJsx = appJsx.replace("import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';", "import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';\n" + imports);
}

const protectedRouteCode = `
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#f4f5fa]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-700"></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};
`;
if (!appJsx.includes("const ProtectedRoute")) {
  appJsx = appJsx.replace("function Navigation() {", protectedRouteCode + "\nfunction Navigation() {");
}

// Wrap Navigation and main content so they only show if user is logged in
// We only want the header and navigation if the user is authenticated.
if (!appJsx.includes("<AuthProvider>")) {
  appJsx = appJsx.replace(/<Router>\s*<div/g, "<Router>\n      <AuthProvider>\n        <div");
  appJsx = appJsx.replace(/<\/Routes>\s*<\/main>\s*<\/div>\s*<\/Router>/g, "</Routes>\n        </main>\n        </div>\n      </AuthProvider>\n    </Router>");
}

// Update routes to be protected, except /login
if (!appJsx.includes("path=\"/login\"")) {
  appJsx = appJsx.replace('<Route path="/create" element={<CreatePO />} />', '<Route path="/login" element={<AuthPage />} />\n            <Route path="/create" element={<ProtectedRoute><CreatePO /></ProtectedRoute>} />');
  appJsx = appJsx.replace('<Route path="/list" element={<POList />} />', '<Route path="/list" element={<ProtectedRoute><POList /></ProtectedRoute>} />');
  appJsx = appJsx.replace('<Route path="/products" element={<Products />} />', '<Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />');
  appJsx = appJsx.replace('<Route path="/dashboard" element={<CompanyDashboard />} />', '<Route path="/dashboard" element={<ProtectedRoute><CompanyDashboard /></ProtectedRoute>} />');
}

// Only show header and bottom nav if user is logged in
const navigationCheck = `  const { user } = useAuth();\n  if (!user) return null;\n`;
if (!appJsx.includes("if (!user) return null;") && appJsx.includes("function Navigation() {")) {
  appJsx = appJsx.replace('function Navigation() {\n  const location', 'function Navigation() {\n' + navigationCheck + '  const location');
}

// Fix App header to hide when not logged in
const appHeaderStart = appJsx.indexOf('<header className="bg-white shadow-sm border-b border-[#e4e6f0]">');
if (appHeaderStart !== -1 && !appJsx.includes('{/* App Header */}')) {
  const authHeader = `
        <AuthHeader />
`;
  appJsx = appJsx.replace(/<header className="bg-white shadow-sm border-b border\[#e4e6f0\]">[\s\S]*?<\/header>/, authHeader);
  
  const authHeaderComponent = `
const AuthHeader = () => {
  const { user, logout } = useAuth();
  if (!user) return null;
  return (
    <header className="bg-white shadow-sm border-b border-[#e4e6f0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-700 flex items-center justify-center text-white font-bold text-xl shadow-sm">
              P
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">PO System</h1>
          </div>
          <div className="flex items-center gap-6">
            <Navigation />
            <button onClick={logout} className="text-sm font-medium text-slate-500 hover:text-red-600 transition-colors hidden md:block">
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
`;
  appJsx = appJsx.replace("function App() {", authHeaderComponent + "\nfunction App() {");
}

fs.writeFileSync('src/App.jsx', appJsx, 'utf8');
console.log('App.jsx updated with Auth');
