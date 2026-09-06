import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import {
  FileText,
  Image,
  Video,
  Music,
  File,
  Settings,
  Home,
} from "lucide-react";

// Pages
import PDFTools from "./pages/PDFTools";
import ImageTools from "./pages/ImageTools";
import VideoTools from "./pages/VideoTools";
import AudioTools from "./pages/AudioTools";
import DocumentTools from "./pages/DocumentTools";
import WorkflowBuilder from "./pages/WorkflowBuilder";

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/pdf" element={<PDFTools />} />
            <Route path="/image" element={<ImageTools />} />
            <Route path="/video" element={<VideoTools />} />
            <Route path="/audio" element={<AudioTools />} />
            <Route path="/documents" element={<DocumentTools />} />
            <Route path="/workflow" element={<WorkflowBuilder />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

const NavBar = () => (
  <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between h-16">
        <div className="flex items-center">
          <Link
            to="/"
            className="text-2xl font-bold text-blue-600 flex items-center"
          >
            <span className="mr-2">📄</span>
            DocuFlow
          </Link>
        </div>
        <div className="flex items-center space-x-1">
          <NavLink to="/" icon={<Home size={18} />} text="Home" />
          <NavLink to="/pdf" icon={<FileText size={18} />} text="PDF" />
          <NavLink to="/image" icon={<Image size={18} />} text="Image" />
          <NavLink to="/video" icon={<Video size={18} />} text="Video" />
          <NavLink to="/audio" icon={<Music size={18} />} text="Audio" />
          <NavLink to="/documents" icon={<File size={18} />} text="Docs" />
          <NavLink
            to="/workflow"
            icon={<Settings size={18} />}
            text="Workflow"
          />
        </div>
      </div>
    </div>
  </nav>
);

const NavLink = ({ to, icon, text }) => (
  <Link
    to={to}
    className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
  >
    {icon}
    <span className="hidden sm:inline">{text}</span>
  </Link>
);

const HomePage = () => (
  <div className="text-center py-12">
    <h1 className="text-4xl font-bold text-gray-900 mb-4">
      All-in-One Document & Media Toolkit
    </h1>
    <p className="text-xl text-gray-600 mb-8">
      100+ tools for PDF, Images, Video, Audio, and Documents
    </p>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
      <ToolCard
        title="PDF Tools"
        description="Merge, split, compress, edit, and more"
        icon="📄"
        link="/pdf"
      />
      <ToolCard
        title="Image Tools"
        description="Convert, resize, compress, and edit images"
        icon="🖼️"
        link="/image"
      />
      <ToolCard
        title="Video & Audio"
        description="Convert, trim, compress, and extract"
        icon="🎬"
        link="/video"
      />
    </div>
    <div className="mt-12 max-w-4xl mx-auto">
      <ToolCard
        title="Document Tools"
        description="Word, Excel, PowerPoint conversions"
        icon="📝"
        link="/documents"
      />
    </div>
  </div>
);

const ToolCard = ({ title, description, icon, link }) => (
  <Link to={link}>
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-100">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  </Link>
);

const Footer = () => (
  <footer className="bg-white border-t mt-12">
    <div className="max-w-7xl mx-auto px-4 py-6">
      <p className="text-center text-sm text-gray-500">
        🔒 All processing happens locally or on our secure servers. Your files
        are never shared.
      </p>
    </div>
  </footer>
);

export default App;
