import React from "react";

const DocumentTools = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Document Tools</h1>
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="text-6xl mb-4">📄</div>
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">
          Coming Soon!
        </h2>
        <p className="text-gray-500">Word, Excel, and PowerPoint tools</p>
        <div className="mt-4 flex justify-center space-x-4 text-sm flex-wrap gap-2">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
            Word → PDF
          </span>
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full">
            Excel → PDF
          </span>
          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full">
            PPT → PDF
          </span>
        </div>
      </div>
    </div>
  );
};

export default DocumentTools;
