import React, { useState } from "react";
import { Download, Loader } from "lucide-react";
import axios from "axios";

const ImageTools = () => {
  const [file, setFile] = useState(null);
  const [selectedTool, setSelectedTool] = useState("convert");
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState("png");
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);

  const tools = [
    { id: "convert", name: "Convert Format", icon: "🔄" },
    { id: "compress", name: "Compress", icon: "🗜️" },
    { id: "resize", name: "Resize", icon: "📏" },
    { id: "rotate", name: "Rotate", icon: "🔄" },
    { id: "grayscale", name: "Grayscale", icon: "⚫" },
  ];

  const formats = ["png", "jpeg", "webp", "gif", "tiff"];

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async () => {
    if (!file) {
      alert("Please select an image file");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    if (selectedTool === "convert") formData.append("format", format);
    if (selectedTool === "resize") {
      formData.append("width", width);
      formData.append("height", height);
    }

    try {
      const endpoint = `http://localhost:5000/api/image/${selectedTool}`;
      const response = await axios.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        responseType: "blob",
      });

      const ext =
        selectedTool === "convert" ? format : file.name.split(".").pop();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `output_${selectedTool}.${ext}`);
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
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Image Tools</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 bg-white rounded-lg shadow p-4">
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

        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Upload Image</h3>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full p-2 border rounded-md"
            />
            {file && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Selected: {file.name}</p>
                <p className="text-sm text-gray-500">
                  Size: {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-700 mb-2">Settings</h3>
            {selectedTool === "convert" && (
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full px-4 py-2 border rounded-md"
              >
                {formats.map((f) => (
                  <option key={f} value={f}>
                    {f.toUpperCase()}
                  </option>
                ))}
              </select>
            )}
            {selectedTool === "resize" && (
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  placeholder="Width"
                  className="px-4 py-2 border rounded-md"
                />
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  placeholder="Height"
                  className="px-4 py-2 border rounded-md"
                />
              </div>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !file}
            className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center ${
              loading || !file
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
        </div>
      </div>
    </div>
  );
};

export default ImageTools;
