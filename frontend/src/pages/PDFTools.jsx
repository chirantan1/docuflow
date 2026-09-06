import React, { useState } from "react";
import { Upload, Download, Loader, AlertCircle } from "lucide-react";
import axios from "axios";

const PDFTools = () => {
  const [files, setFiles] = useState([]);
  const [selectedTool, setSelectedTool] = useState("merge");
  const [loading, setLoading] = useState(false);
  const [watermarkText, setWatermarkText] = useState("");
  const [password, setPassword] = useState("");
  const [pageRanges, setPageRanges] = useState("");

  const tools = [
    {
      id: "merge",
      name: "Merge PDF",
      icon: "📑",
      desc: "Combine multiple PDFs",
    },
    {
      id: "split",
      name: "Split PDF",
      icon: "✂️",
      desc: "Divide into separate files",
    },
    {
      id: "compress",
      name: "Compress PDF",
      icon: "🗜️",
      desc: "Reduce file size",
    },
    {
      id: "watermark",
      name: "Add Watermark",
      icon: "💧",
      desc: "Add text overlay",
    },
    {
      id: "pagenumbers",
      name: "Add Page Numbers",
      icon: "🔢",
      desc: "Number each page",
    },
    {
      id: "protect",
      name: "Protect with Password",
      icon: "🔐",
      desc: "Add encryption",
    },
    {
      id: "extract",
      name: "Extract Pages",
      icon: "📋",
      desc: "Select specific pages",
    },
    {
      id: "rotate",
      name: "Rotate Pages",
      icon: "🔄",
      desc: "Rotate all pages",
    },
    {
      id: "delete",
      name: "Delete Pages",
      icon: "🗑️",
      desc: "Remove specific pages",
    },
  ];

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    const pdfFiles = droppedFiles.filter((f) => f.type === "application/pdf");
    setFiles(pdfFiles);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      alert("Please select at least one file");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    if (selectedTool === "watermark") {
      formData.append("text", watermarkText || "CONFIDENTIAL");
      formData.append("opacity", "0.3");
    }
    if (selectedTool === "protect") {
      formData.append("password", password || "default123");
    }
    if (["extract", "delete"].includes(selectedTool)) {
      formData.append("pages", pageRanges || "[0]");
    }
    if (selectedTool === "rotate") {
      formData.append("degrees", "90");
    }

    try {
      const endpoint = `http://localhost:5000/api/pdf/${selectedTool}`;
      const response = await axios.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `output_${selectedTool}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert("Error: " + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">PDF Tools</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-700 mb-2">Select Tool</h3>
            <div className="space-y-1">
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => setSelectedTool(tool.id)}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors text-sm ${
                    selectedTool === tool.id
                      ? "bg-blue-100 text-blue-700 font-medium"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <span className="mr-2">{tool.icon}</span>
                  {tool.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Upload Files</h3>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <input
                type="file"
                multiple
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
                id="fileInput"
              />
              <label
                htmlFor="fileInput"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="w-12 h-12 text-gray-400" />
                <span className="mt-2 text-gray-600">
                  Click to upload PDF files
                </span>
                <span className="text-sm text-gray-400">or drag and drop</span>
              </label>
              {files.length > 0 && (
                <div className="mt-4 text-left">
                  <p className="font-medium text-gray-700">
                    {files.length} file(s) selected
                  </p>
                  <ul className="text-sm text-gray-600 mt-2 max-h-32 overflow-y-auto">
                    {files.map((file, i) => (
                      <li
                        key={i}
                        className="truncate py-1 border-b border-gray-100"
                      >
                        {file.name} ({(file.size / 1024).toFixed(1)} KB)
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {(selectedTool === "watermark" ||
            selectedTool === "protect" ||
            ["extract", "delete"].includes(selectedTool)) && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-700 mb-2">Settings</h3>
              {selectedTool === "watermark" && (
                <input
                  type="text"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  placeholder="Enter watermark text"
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              )}
              {selectedTool === "protect" && (
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password (min 4 characters)"
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              )}
              {["extract", "delete"].includes(selectedTool) && (
                <input
                  type="text"
                  value={pageRanges}
                  onChange={(e) => setPageRanges(e.target.value)}
                  placeholder="Page numbers: 0,2,4 or 0-5 (0-based)"
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              )}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || files.length === 0}
            className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center ${
              loading || files.length === 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {loading ? (
              <>
                <Loader className="animate-spin mr-2" size={20} />
                Processing...
              </>
            ) : (
              <>
                <Download className="mr-2" size={20} />
                Process & Download
              </>
            )}
          </button>

          {files.length === 0 && (
            <div className="flex items-center text-yellow-600 bg-yellow-50 p-3 rounded-lg">
              <AlertCircle size={18} className="mr-2" />
              <span className="text-sm">
                Please upload at least one PDF file
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PDFTools;
