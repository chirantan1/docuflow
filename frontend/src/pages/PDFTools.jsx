import React, { useState, useRef, useCallback, useEffect } from "react";
import axios from "axios";
import {
  FiUpload,
  FiFile,
  FiTrash2,
  FiCheckCircle,
  FiAlertCircle,
  FiLoader,
  FiDownload,
  FiPlus,
  FiX,
  FiLayers,
  FiScissors,
  FiMinimize2,
  FiShield,
  FiRotateCw,
  FiInfo,
  FiBookOpen,
  FiStar,
  FiClock,
  FiTrendingUp,
  FiCheck,
  FiGrid,
  FiList,
  FiSearch,
  FiSettings,
  FiUser,
  FiBell,
  FiMenu,
  FiChevronLeft,
  FiChevronRight,
  FiMoon,
  FiSun,
} from "react-icons/fi";

const PDFTools = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [activeTool, setActiveTool] = useState("merge");
  const [viewMode, setViewMode] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [progress, setProgress] = useState(0);
  const [theme, setTheme] = useState("light");
  const [notifications, setNotifications] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const fileInputRef = useRef(null);

  // Tools configuration
  const tools = [
    {
      id: "merge",
      label: "Merge PDF",
      icon: FiLayers,
      description: "Combine multiple PDFs into one document",
      color: "#6366f1",
      requiresMultiple: true,
    },
    {
      id: "split",
      label: "Split PDF",
      icon: FiScissors,
      description: "Extract specific pages from a PDF",
      color: "#8b5cf6",
      requiresMultiple: false,
    },
    {
      id: "compress",
      label: "Compress",
      icon: FiMinimize2,
      description: "Reduce PDF file size significantly",
      color: "#06b6d4",
      requiresMultiple: false,
    },
    {
      id: "watermark",
      label: "Watermark",
      icon: FiShield,
      description: "Add text watermark to all pages",
      color: "#f59e0b",
      requiresMultiple: false,
    },
    {
      id: "rotate",
      label: "Rotate",
      icon: FiRotateCw,
      description: "Rotate pages by 90, 180, or 270 degrees",
      color: "#10b981",
      requiresMultiple: false,
    },
    {
      id: "info",
      label: "PDF Info",
      icon: FiInfo,
      description: "View detailed PDF metadata",
      color: "#ef4444",
      requiresMultiple: false,
    },
  ];

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    const pdfFiles = droppedFiles.filter(
      (file) => file.type === "application/pdf",
    );

    if (pdfFiles.length > 0) {
      setFiles((prev) => [...prev, ...pdfFiles]);
      setError(null);
      addNotification(`${pdfFiles.length} PDF file(s) added`, "success");
    } else {
      setError("Please drop valid PDF files");
      addNotification("Please drop valid PDF files", "error");
    }
  }, []);

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files);
    setFiles((prev) => [...prev, ...selectedFiles]);
    setError(null);
    setSuccess(null);
    if (selectedFiles.length > 0) {
      addNotification(`${selectedFiles.length} PDF file(s) added`, "success");
    }
  };

  const removeFile = (indexToRemove) => {
    const removedFile = files[indexToRemove];
    setFiles(files.filter((_, index) => index !== indexToRemove));
    addNotification(`${removedFile.name} removed`, "info");
  };

  const clearAllFiles = () => {
    setFiles([]);
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    addNotification("All files cleared", "info");
  };

  const addNotification = (message, type = "info") => {
    const newNotification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotification, ...prev].slice(0, 5));
  };

  const toggleFileSelection = (index) => {
    setSelectedFiles((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  const handleProcess = async () => {
    const currentTool = tools.find((t) => t.id === activeTool);

    if (currentTool?.requiresMultiple && files.length < 2) {
      setError(`Please select at least 2 PDF files for ${currentTool.label}`);
      return;
    }

    if (files.length === 0) {
      setError("Please upload at least one PDF file");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setProgress(0);

    try {
      const formData = new FormData();
      const filesToProcess =
        selectedFiles.length > 0 ? selectedFiles.map((i) => files[i]) : files;

      filesToProcess.forEach((file) => {
        formData.append("files", file);
      });

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const endpoint = `http://localhost:5000/api/pdf/${activeTool}`;
      console.log(`Sending ${activeTool} request to:`, endpoint);

      const response = await axios.post(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        responseType: "blob",
        timeout: 300000,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (response.status === 200) {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        const extension = activeTool === "merge" ? "merged" : activeTool;
        link.href = url;
        link.setAttribute("download", `${extension}_${Date.now()}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        const successMessage = `✅ Successfully ${activeTool === "merge" ? "merged" : "processed"} ${filesToProcess.length} PDF file(s)!`;
        setSuccess(successMessage);
        addNotification(successMessage, "success");

        setFiles([]);
        setSelectedFiles([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        setProgress(0);
      }
    } catch (error) {
      console.error("PDF processing error:", error);
      let errorMessage = `Failed to ${activeTool} PDFs`;

      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data) {
        try {
          const text = await error.response.data.text?.();
          if (text) {
            const json = JSON.parse(text);
            errorMessage = json.error || json.message || errorMessage;
          }
        } catch (e) {
          // Ignore parse errors
        }
      } else if (error.code === "ERR_NETWORK") {
        errorMessage =
          "Cannot connect to server. Please make sure the backend server is running on port 5000.";
      } else if (error.message === "Network Error") {
        errorMessage = "Network error. Please check if server is running.";
      }

      setError(`❌ ${errorMessage}`);
      addNotification(errorMessage, "error");
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (file) => {
    return <FiFile style={{ fontSize: "20px", color: "#6366f1" }} />;
  };

  const currentTool = tools.find((t) => t.id === activeTool);
  const ToolIcon = currentTool?.icon || FiLayers;

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Check if server is running
  const checkServer = async () => {
    try {
      await axios.get("http://localhost:5000/api/health", { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  };

  // Check server on mount
  useEffect(() => {
    checkServer().then((isRunning) => {
      if (!isRunning) {
        addNotification(
          "⚠️ Backend server not running. Please start the server.",
          "error",
        );
      } else {
        addNotification("✅ Connected to backend server", "success");
      }
    });
  }, []);

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      {!isMobile && (
        <div
          style={{
            ...styles.sidebar,
            width: isSidebarOpen ? "280px" : "80px",
          }}
        >
          <div style={styles.sidebarHeader}>
            <div style={styles.logo}>
              <FiBookOpen size={28} color="#6366f1" />
              {isSidebarOpen && <span style={styles.logoText}>PDF Pro</span>}
            </div>
            <button
              style={styles.sidebarToggle}
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? (
                <FiChevronLeft size={20} />
              ) : (
                <FiChevronRight size={20} />
              )}
            </button>
          </div>

          <div style={styles.sidebarNav}>
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  style={{
                    ...styles.navItem,
                    ...(activeTool === tool.id ? styles.navItemActive : {}),
                    ...(!isSidebarOpen ? styles.navItemCollapsed : {}),
                  }}
                  onClick={() => setActiveTool(tool.id)}
                  title={!isSidebarOpen ? tool.label : ""}
                >
                  <Icon size={20} />
                  {isSidebarOpen && (
                    <>
                      <span style={styles.navLabel}>{tool.label}</span>
                      <span style={styles.navBadge}>New</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>

          <div style={styles.sidebarFooter}>
            <button style={styles.sidebarUser}>
              <FiUser size={20} />
              {isSidebarOpen && <span>User Profile</span>}
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div
        style={{
          ...styles.mainContent,
          marginLeft: isMobile ? 0 : isSidebarOpen ? "280px" : "80px",
        }}
      >
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            {isMobile && (
              <button
                style={styles.menuButton}
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                <FiMenu size={24} />
              </button>
            )}
            <h1 style={styles.headerTitle}>PDF Tools</h1>
            <span style={styles.headerBadge}>v2.0</span>
          </div>
          <div style={styles.headerRight}>
            <div style={styles.searchWrapper}>
              <FiSearch size={18} style={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.searchInput}
              />
            </div>
            <button style={styles.notificationButton}>
              <FiBell size={20} />
              {notifications.length > 0 && (
                <span style={styles.notificationBadge}>
                  {notifications.length}
                </span>
              )}
            </button>
            <button
              style={styles.themeToggle}
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              {theme === "light" ? <FiMoon size={20} /> : <FiSun size={20} />}
            </button>
          </div>
        </header>

        {/* Tool Info */}
        <div style={styles.toolInfo}>
          <div style={styles.toolIconWrapper}>
            <ToolIcon size={24} color={currentTool?.color || "#6366f1"} />
          </div>
          <div>
            <h2 style={styles.toolTitle}>{currentTool?.label || "PDF Tool"}</h2>
            <p style={styles.toolDescription}>
              {currentTool?.description || "Process your PDF files"}
            </p>
          </div>
          <div style={styles.toolActions}>
            <button
              style={styles.viewToggle}
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            >
              {viewMode === "grid" ? (
                <FiList size={18} />
              ) : (
                <FiGrid size={18} />
              )}
            </button>
            <button style={styles.settingsButton}>
              <FiSettings size={18} />
            </button>
          </div>
        </div>

        {/* Upload Area */}
        <div
          style={{
            ...styles.uploadArea,
            ...(dragActive ? styles.uploadAreaDragActive : {}),
            ...(files.length > 0 ? styles.uploadAreaHasFiles : {}),
          }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            id="fileInput"
            type="file"
            accept=".pdf"
            multiple
            onChange={handleFileChange}
            disabled={loading}
            style={styles.hiddenInput}
          />

          {files.length === 0 ? (
            <div style={styles.uploadPlaceholder}>
              <div style={styles.uploadIconWrapper}>
                <FiUpload size={48} color="#6366f1" />
              </div>
              <h3 style={styles.uploadTitle}>Drop PDF files here</h3>
              <p style={styles.uploadText}>or click to browse files</p>
              <button
                style={styles.browseButton}
                onClick={() => fileInputRef.current?.click()}
              >
                <FiPlus size={16} />
                Browse Files
              </button>
              <p style={styles.uploadHint}>
                Supported: PDF files up to 100MB each
              </p>
            </div>
          ) : (
            <div style={styles.fileListContainer}>
              <div style={styles.fileListHeader}>
                <div style={styles.fileListHeaderLeft}>
                  <span style={styles.fileCount}>
                    {files.length} file{files.length > 1 ? "s" : ""} selected
                    {selectedFiles.length > 0 &&
                      ` (${selectedFiles.length} selected)`}
                  </span>
                  {selectedFiles.length > 0 && (
                    <span style={styles.selectedCount}>
                      {selectedFiles.length} selected
                    </span>
                  )}
                </div>
                <div style={styles.fileListActions}>
                  <button
                    style={styles.selectAllButton}
                    onClick={() => {
                      if (selectedFiles.length === files.length) {
                        setSelectedFiles([]);
                      } else {
                        setSelectedFiles(files.map((_, i) => i));
                      }
                    }}
                  >
                    {selectedFiles.length === files.length
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                  <button style={styles.clearButton} onClick={clearAllFiles}>
                    <FiX size={16} />
                    Clear All
                  </button>
                  <button
                    style={styles.addMoreButton}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FiPlus size={16} />
                    Add More
                  </button>
                </div>
              </div>

              {searchQuery && filteredFiles.length === 0 ? (
                <div style={styles.noResults}>
                  <FiSearch size={40} color="#9ca3af" />
                  <p>No files match your search</p>
                </div>
              ) : (
                <div
                  style={{
                    ...styles.fileList,
                    ...(viewMode === "grid" ? styles.fileListGrid : {}),
                  }}
                >
                  {filteredFiles.map((file, index) => {
                    const originalIndex = files.indexOf(file);
                    const isSelected = selectedFiles.includes(originalIndex);
                    return (
                      <div
                        key={index}
                        style={{
                          ...styles.fileItem,
                          ...(viewMode === "grid" ? styles.fileItemGrid : {}),
                          ...(isSelected ? styles.fileItemSelected : {}),
                        }}
                        onClick={() => toggleFileSelection(originalIndex)}
                      >
                        <div style={styles.fileItemContent}>
                          <div style={styles.fileItemIcon}>
                            {getFileIcon(file)}
                            {isSelected && (
                              <div style={styles.fileItemCheckmark}>
                                <FiCheck size={12} color="white" />
                              </div>
                            )}
                          </div>
                          <div style={styles.fileItemInfo}>
                            <span style={styles.fileItemName}>{file.name}</span>
                            <span style={styles.fileItemSize}>
                              {formatFileSize(file.size)}
                            </span>
                          </div>
                          <button
                            style={styles.fileItemRemove}
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(originalIndex);
                            }}
                          >
                            <FiX size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={styles.fileListFooter}>
                <div style={styles.progressContainer}>
                  <div style={styles.progressBar}>
                    <div
                      style={{
                        ...styles.progressFill,
                        width: `${progress}%`,
                        opacity: progress > 0 ? 1 : 0,
                      }}
                    />
                  </div>
                  {progress > 0 && (
                    <span style={styles.progressText}>{progress}%</span>
                  )}
                </div>
                <button
                  style={{
                    ...styles.processButton,
                    ...(loading ? styles.processButtonLoading : {}),
                    ...(currentTool?.requiresMultiple && files.length < 2
                      ? styles.processButtonDisabled
                      : {}),
                  }}
                  onClick={handleProcess}
                  disabled={
                    loading ||
                    (currentTool?.requiresMultiple && files.length < 2)
                  }
                >
                  {loading ? (
                    <>
                      <FiLoader size={20} style={styles.spinner} />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FiDownload size={20} />
                      {currentTool?.requiresMultiple
                        ? `Merge ${files.length} Files`
                        : `Process PDF`}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Messages */}
        {error && (
          <div style={styles.errorMessage}>
            <FiAlertCircle size={20} />
            <span>{error}</span>
            <button style={styles.messageClose} onClick={() => setError(null)}>
              <FiX size={16} />
            </button>
          </div>
        )}

        {success && (
          <div style={styles.successMessage}>
            <FiCheckCircle size={20} />
            <span>{success}</span>
            <button
              style={styles.messageClose}
              onClick={() => setSuccess(null)}
            >
              <FiX size={16} />
            </button>
          </div>
        )}

        {/* Notifications */}
        <div style={styles.notificationContainer}>
          {notifications.map((notification, index) => (
            <div
              key={notification.id}
              style={{
                ...styles.notificationItem,
                ...(notification.type === "success"
                  ? styles.notificationSuccess
                  : {}),
                ...(notification.type === "error"
                  ? styles.notificationError
                  : {}),
                ...(notification.type === "info"
                  ? styles.notificationInfo
                  : {}),
              }}
            >
              <span>{notification.message}</span>
              <button
                style={styles.notificationClose}
                onClick={() =>
                  setNotifications((prev) => prev.filter((_, i) => i !== index))
                }
              >
                <FiX size={12} />
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer style={styles.footer}>
          <div style={styles.footerContent}>
            <div style={styles.footerStats}>
              <span>
                <FiStar size={14} />
                {files.length} files in queue
              </span>
              <span>
                <FiClock size={14} />
                {selectedFiles.length} selected
              </span>
              <span>
                <FiTrendingUp size={14} />
                {files.reduce((acc, f) => acc + f.size, 0) > 0
                  ? formatFileSize(files.reduce((acc, f) => acc + f.size, 0))
                  : "0 KB"}{" "}
                total
              </span>
            </div>
            <div style={styles.footerLinks}>
              <a href="#" style={styles.footerLink}>
                Help
              </a>
              <a href="#" style={styles.footerLink}>
                Privacy
              </a>
              <a href="#" style={styles.footerLink}>
                Terms
              </a>
              <span style={styles.footerVersion}>v2.0.0</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

// Styles - Fixed all CSS warnings
const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f8fafc",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    display: "flex",
  },
  sidebar: {
    position: "fixed",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#ffffff",
    borderRight: "1px solid #e2e8f0",
    display: "flex",
    flexDirection: "column",
    transition: "width 0.3s ease",
    zIndex: 1000,
    overflow: "hidden",
  },
  sidebarHeader: {
    padding: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid #e2e8f0",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  logoText: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#1f2937",
  },
  sidebarToggle: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#6b7280",
    padding: "4px",
    borderRadius: "4px",
  },
  sidebarNav: {
    flex: 1,
    padding: "12px",
    overflowY: "auto",
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    marginBottom: "4px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "transparent",
    color: "#6b7280",
    cursor: "pointer",
    width: "100%",
    transition: "all 0.2s",
    position: "relative",
  },
  navItemActive: {
    backgroundColor: "#eef2ff",
    color: "#6366f1",
  },
  navItemCollapsed: {
    justifyContent: "center",
    padding: "12px",
  },
  navLabel: {
    fontSize: "14px",
    fontWeight: "500",
    flex: 1,
  },
  navBadge: {
    fontSize: "10px",
    padding: "2px 8px",
    borderRadius: "12px",
    backgroundColor: "#6366f1",
    color: "#ffffff",
    fontWeight: "600",
  },
  sidebarFooter: {
    padding: "16px",
    borderTop: "1px solid #e2e8f0",
  },
  sidebarUser: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "8px 12px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "transparent",
    color: "#6b7280",
    cursor: "pointer",
    width: "100%",
  },
  mainContent: {
    flex: 1,
    padding: "24px",
    transition: "margin-left 0.3s ease",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    padding: "16px",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  menuButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "4px",
  },
  headerTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#1f2937",
    margin: 0,
  },
  headerBadge: {
    fontSize: "12px",
    padding: "2px 10px",
    borderRadius: "12px",
    backgroundColor: "#eef2ff",
    color: "#6366f1",
    fontWeight: "500",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  searchWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  searchIcon: {
    position: "absolute",
    left: "12px",
    color: "#9ca3af",
  },
  searchInput: {
    padding: "8px 12px 8px 36px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "14px",
    width: "200px",
    outline: "none",
    backgroundColor: "#f8fafc",
    color: "#1f2937",
  },
  notificationButton: {
    position: "relative",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "8px",
    borderRadius: "8px",
  },
  notificationBadge: {
    position: "absolute",
    top: "2px",
    right: "2px",
    fontSize: "10px",
    backgroundColor: "#ef4444",
    color: "#ffffff",
    borderRadius: "50%",
    padding: "2px 6px",
    fontWeight: "600",
  },
  themeToggle: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "8px",
    borderRadius: "8px",
    color: "#6b7280",
  },
  toolInfo: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "24px",
    padding: "16px 20px",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  toolIconWrapper: {
    width: "48px",
    height: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eef2ff",
    borderRadius: "12px",
  },
  toolTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1f2937",
    margin: 0,
  },
  toolDescription: {
    fontSize: "14px",
    color: "#6b7280",
    margin: 0,
  },
  toolActions: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginLeft: "auto",
  },
  viewToggle: {
    background: "none",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "8px",
    cursor: "pointer",
    color: "#6b7280",
  },
  settingsButton: {
    background: "none",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "8px",
    cursor: "pointer",
    color: "#6b7280",
  },
  uploadArea: {
    borderWidth: "2px",
    borderStyle: "dashed",
    borderColor: "#d1d5db",
    borderRadius: "16px",
    padding: "32px",
    transition: "all 0.3s ease",
    backgroundColor: "#ffffff",
    minHeight: "300px",
    position: "relative",
  },
  uploadAreaDragActive: {
    borderColor: "#6366f1",
    backgroundColor: "#eef2ff",
  },
  uploadAreaHasFiles: {
    padding: "16px",
    borderStyle: "solid",
    borderColor: "#e2e8f0",
  },
  hiddenInput: {
    display: "none",
  },
  uploadPlaceholder: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    textAlign: "center",
  },
  uploadIconWrapper: {
    width: "80px",
    height: "80px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eef2ff",
    borderRadius: "50%",
  },
  uploadTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#1f2937",
    margin: 0,
  },
  uploadText: {
    color: "#6b7280",
    margin: 0,
  },
  browseButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 24px",
    backgroundColor: "#6366f1",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  },
  uploadHint: {
    fontSize: "12px",
    color: "#9ca3af",
    margin: "8px 0 0 0",
  },
  fileListContainer: {
    width: "100%",
  },
  fileListHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    flexWrap: "wrap",
    gap: "12px",
  },
  fileListHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  fileCount: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1f2937",
  },
  selectedCount: {
    fontSize: "12px",
    padding: "2px 10px",
    borderRadius: "12px",
    backgroundColor: "#eef2ff",
    color: "#6366f1",
  },
  fileListActions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  selectAllButton: {
    padding: "6px 12px",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    backgroundColor: "#ffffff",
    color: "#6b7280",
    cursor: "pointer",
    fontSize: "12px",
  },
  clearButton: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "6px 12px",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    backgroundColor: "#ffffff",
    color: "#6b7280",
    cursor: "pointer",
    fontSize: "12px",
  },
  addMoreButton: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "6px 12px",
    border: "none",
    borderRadius: "6px",
    backgroundColor: "#6366f1",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: "12px",
  },
  fileList: {
    maxHeight: "300px",
    overflowY: "auto",
    marginBottom: "16px",
  },
  fileListGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "12px",
  },
  fileItem: {
    padding: "12px",
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    marginBottom: "8px",
    border: "1px solid #e2e8f0",
    transition: "all 0.2s",
    cursor: "pointer",
  },
  fileItemGrid: {
    marginBottom: 0,
  },
  fileItemSelected: {
    borderColor: "#6366f1",
    backgroundColor: "#eef2ff",
  },
  fileItemContent: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  fileItemIcon: {
    position: "relative",
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  fileItemCheckmark: {
    position: "absolute",
    bottom: "-4px",
    right: "-4px",
    width: "20px",
    height: "20px",
    backgroundColor: "#6366f1",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  fileItemInfo: {
    flex: 1,
    minWidth: 0,
  },
  fileItemName: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#1f2937",
    display: "block",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  fileItemSize: {
    fontSize: "12px",
    color: "#6b7280",
  },
  fileItemRemove: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "4px",
    borderRadius: "4px",
    color: "#9ca3af",
  },
  noResults: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    padding: "32px",
    color: "#9ca3af",
  },
  fileListFooter: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  progressContainer: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  progressBar: {
    flex: 1,
    height: "6px",
    backgroundColor: "#e2e8f0",
    borderRadius: "3px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#6366f1",
    borderRadius: "3px",
    transition: "width 0.3s ease",
  },
  progressText: {
    fontSize: "12px",
    color: "#6b7280",
    minWidth: "40px",
  },
  processButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    width: "100%",
    padding: "14px",
    backgroundColor: "#6366f1",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s",
  },
  processButtonLoading: {
    opacity: 0.7,
    cursor: "wait",
  },
  processButtonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  spinner: {
    animation: "spin 1s linear infinite",
  },
  errorMessage: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "16px",
    padding: "12px 16px",
    backgroundColor: "#fef2f2",
    borderRadius: "8px",
    color: "#dc2626",
    fontSize: "14px",
    border: "1px solid #fecaca",
    position: "relative",
  },
  successMessage: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "16px",
    padding: "12px 16px",
    backgroundColor: "#f0fdf4",
    borderRadius: "8px",
    color: "#16a34a",
    fontSize: "14px",
    border: "1px solid #bbf7d0",
    position: "relative",
  },
  messageClose: {
    position: "absolute",
    right: "8px",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "inherit",
    padding: "4px",
  },
  notificationContainer: {
    position: "fixed",
    bottom: "24px",
    right: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    zIndex: 9999,
    maxWidth: "400px",
  },
  notificationItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    padding: "12px 16px",
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    fontSize: "14px",
    animation: "slideIn 0.3s ease",
    border: "1px solid #e2e8f0",
  },
  notificationSuccess: {
    borderLeft: "4px solid #16a34a",
  },
  notificationError: {
    borderLeft: "4px solid #dc2626",
  },
  notificationInfo: {
    borderLeft: "4px solid #6366f1",
  },
  notificationClose: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#9ca3af",
    padding: "4px",
  },
  footer: {
    marginTop: "24px",
    padding: "16px 0",
    borderTop: "1px solid #e2e8f0",
  },
  footerContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
  },
  footerStats: {
    display: "flex",
    gap: "16px",
    fontSize: "12px",
    color: "#6b7280",
  },
  footerLinks: {
    display: "flex",
    gap: "16px",
    fontSize: "12px",
    alignItems: "center",
  },
  footerLink: {
    color: "#6b7280",
    textDecoration: "none",
  },
  footerVersion: {
    color: "#9ca3af",
  },
};

// Add keyframes
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;
document.head.appendChild(styleSheet);

export default PDFTools;
