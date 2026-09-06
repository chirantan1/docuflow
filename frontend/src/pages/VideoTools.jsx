import React from "react";

const VideoTools = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Video Tools</h1>
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="text-6xl mb-4">🎬</div>
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">
          Coming Soon!
        </h2>
        <p className="text-gray-500">
          Video tools including convert, compress, trim, and more
        </p>
        <div className="mt-4 flex justify-center space-x-4 text-sm flex-wrap gap-2">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
            Convert
          </span>
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full">
            Compress
          </span>
          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
            Trim
          </span>
          <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full">
            Extract Audio
          </span>
        </div>
      </div>
    </div>
  );
};

export default VideoTools;
