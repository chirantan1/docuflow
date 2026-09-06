import React, { useState } from "react";
import { Plus, Trash2, Play, Save } from "lucide-react";

const WorkflowBuilder = () => {
  const [steps, setSteps] = useState([
    { id: 1, tool: "merge", label: "Merge PDF" },
  ]);
  const [workflowName, setWorkflowName] = useState("My Workflow");

  const availableTools = [
    { id: "merge", label: "Merge PDF", category: "PDF" },
    { id: "split", label: "Split PDF", category: "PDF" },
    { id: "compress", label: "Compress PDF", category: "PDF" },
    { id: "watermark", label: "Add Watermark", category: "PDF" },
    { id: "protect", label: "Protect PDF", category: "PDF" },
    { id: "resize", label: "Resize Image", category: "Image" },
    { id: "convert", label: "Convert Image", category: "Image" },
    { id: "compressImage", label: "Compress Image", category: "Image" },
  ];

  const addStep = () => {
    const newStep = {
      id: Date.now(),
      tool: availableTools[0].id,
      label: availableTools[0].label,
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (id) => {
    if (steps.length > 1) {
      setSteps(steps.filter((step) => step.id !== id));
    }
  };

  const updateStep = (id, toolId) => {
    const tool = availableTools.find((t) => t.id === toolId);
    setSteps(
      steps.map((step) =>
        step.id === id ? { ...step, tool: toolId, label: tool.label } : step,
      ),
    );
  };

  const runWorkflow = () => {
    alert(
      "Workflow execution would process files through all steps!\n\nSteps:\n" +
        steps.map((s, i) => `${i + 1}. ${s.label}`).join("\n"),
    );
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Workflow Builder
      </h1>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Workflow Name
          </label>
          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="space-y-4">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                {index + 1}
              </div>
              <select
                value={step.tool}
                onChange={(e) => updateStep(step.id, e.target.value)}
                className="flex-1 px-4 py-2 border rounded-md bg-white"
              >
                {availableTools.map((tool) => (
                  <option key={tool.id} value={tool.id}>
                    {tool.category}: {tool.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => removeStep(step.id)}
                className={`p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors ${
                  steps.length === 1 ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={steps.length === 1}
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-4">
          <button
            onClick={addStep}
            className="px-4 py-2 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 transition-colors flex items-center"
          >
            <Plus size={20} className="mr-2" />
            Add Step
          </button>
          <button
            onClick={runWorkflow}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center"
          >
            <Play size={20} className="mr-2" />
            Run Workflow
          </button>
          <button
            onClick={() => alert("Workflow saved!")}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center"
          >
            <Save size={20} className="mr-2" />
            Save Workflow
          </button>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800">💡 Workflow Tips</h3>
        <ul className="mt-2 text-sm text-blue-700 space-y-1">
          <li>• Order matters - files flow from top to bottom</li>
          <li>• Each step processes the output of the previous step</li>
          <li>• Save workflows to reuse them later</li>
          <li>• Combine PDF, Image, and Video tools in one workflow</li>
        </ul>
      </div>
    </div>
  );
};

export default WorkflowBuilder;
