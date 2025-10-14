"use client"
import { useState } from "react"
import type React from "react"

export default function ExplorePage() {
  const [imageUrl, setImageUrl] = useState("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const MAX_SIZE = 50 * 1024 * 1024 

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file.")
      return
    }
    if (file.size > MAX_SIZE) {
      alert("File exceeds 50MB.")
      return
    }
    setUploadedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setImageUrl("")
    setResult(null)
    setError(null)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      alert("Please drop an image file.")
      return
    }
    if (file.size > MAX_SIZE) {
      alert("File exceeds 50MB.")
      return
    }
    setUploadedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setImageUrl("")
    setResult(null)
    setError(null)
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setImageUrl(url)
    if (url) {
      setPreviewUrl(url)
      setUploadedFile(null)
      setResult(null)
      setError(null)
    }
  }

  const handleClear = () => {
    setImageUrl("")
    setUploadedFile(null)
    setPreviewUrl("")
    setResult(null)
    setError(null)
  }

  const handleAnalyze = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      let res: Response
      if (uploadedFile) {
        const fd = new FormData()
        fd.append("image", uploadedFile)
        res = await fetch("/api/explore/recognize-file", {
          method: "POST",
          body: fd,
        })
      } else if (imageUrl) {
        try {
          const u = new URL(imageUrl)
          if (!/^https?:$/.test(u.protocol)) throw new Error("Invalid URL")
        } catch {
          setError("Please provide a valid http(s) image URL.")
          return
        }
        res = await fetch("/api/explore/recognize-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl }),
        })
      } else {
        setError("Provide an image URL or upload a file.")
        return
      }

      const data = await res.json()
      if (!res.ok || data?.success === false) {
        const errorMsg = data?.error || data?.message || "Analysis failed."
        setError(errorMsg)
      } else {
        setResult(data)
      }
    } catch (e: any) {
      setError(e?.message || "Unexpected error.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen pt-20" style={{ background: "var(--background)" }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
              style={{
                background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                boxShadow: "0 4px 20px rgba(59, 130, 246, 0.3)"
              }}
            >
              🔍
            </div>
            <h1 className="text-4xl font-black" style={{ color: "var(--foreground)" }}>Explore Landmarks</h1>
          </div>
          <p className="text-base max-w-2xl mx-auto" style={{ color: "var(--muted-foreground)" }}>
            Discover the world's most iconic landmarks with AI-powered recognition. Upload a photo or paste an image URL to get started.
          </p>
        </div>

        <div 
          className="rounded-3xl p-8 shadow-xl"
          style={{ 
            background: "var(--surface)", 
            border: "1px solid var(--border)",
            boxShadow: "0 20px 50px -12px rgba(0, 0, 0, 0.25)"
          }}
        >
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input
              type="url"
              value={imageUrl}
              onChange={handleUrlChange}
              placeholder="🔗 Paste image URL here..."
              className="col-span-2 rounded-xl px-5 py-3.5 outline-none transition-all focus:ring-2 focus:ring-blue-500/50"
              style={{ 
                background: "var(--background)", 
                color: "var(--foreground)", 
                border: "1.5px solid var(--border)"
              }}
            />
            <button 
              onClick={handleClear}
              className="rounded-xl px-5 py-3.5 font-semibold text-white transition-all hover:scale-105 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #ef4444, #dc2626)",
                boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)"
              }}
            >
              Clear
            </button>
          </div>

          <div
            className="border-2 border-dashed rounded-2xl p-10 text-center mb-6 transition-all hover:border-blue-500/50 hover:bg-blue-500/5"
            style={{ borderColor: "var(--border)" }}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <input
              type="file"
              id="file-upload-explore"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label htmlFor="file-upload-explore" className="cursor-pointer inline-block">
              <div 
                className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-3xl"
                style={{
                  background: "linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))",
                  border: "2px solid rgba(59, 130, 246, 0.2)"
                }}
              >
                📸
              </div>
              <div className="text-lg font-bold mb-2" style={{ color: "var(--foreground)" }}>
                Click to upload or drag & drop
              </div>
              <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                JPG, PNG, WebP up to 50MB
              </div>
            </label>
          </div>

          {previewUrl && (
            <div className="mb-6 text-center">
              <div className="relative inline-block">
                <img
                  src={previewUrl || "/placeholder.svg"}
                  alt="Preview"
                  className="max-w-full h-auto rounded-2xl mx-auto shadow-2xl"
                  style={{ 
                    maxHeight: 420,
                    border: "2px solid var(--border)"
                  }}
                />
                <div 
                  className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background: "linear-gradient(135deg, #10b981, #059669)",
                    color: "white",
                    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.4)"
                  }}
                >
                  ✓
                </div>
              </div>
            </div>
          )}

          <div className="text-center">
            <button
              onClick={handleAnalyze}
              disabled={loading || (!previewUrl && !imageUrl)}
              className="relative group inline-flex items-center justify-center gap-2 px-6 py-2 rounded-2xl font-bold text-base text-white overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{
                background: loading 
                  ? "linear-gradient(135deg, #1e293b 0%, #334155 100%)"
                  : "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)",
                boxShadow: loading 
                  ? "0 10px 40px rgba(15, 23, 42, 0.5)"
                  : "0 10px 40px rgba(15, 23, 42, 0.6)",
              }}
            >
              {/* Animated gradient overlay on hover */}
              {!loading && (
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)"
                  }}
                />
              )}

              {/* Spinning loader */}
              {loading && (
                <svg 
                  className="animate-spin" 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none"
                  style={{ animation: "spin 1s linear infinite" }}
                >
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                  />
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              )}

              {/* AI Sparkles icon (same as translate page) */}
              {!loading && (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="w-10 h-10  shrink-0">
                  <path d="M11 2l1.2 2.8L15 6l-2.8 1.2L11 10l-1.2-2.8L7 6l2.8-1.2L11 2z" fill="currentColor" opacity="0.95" />
                  <path d="M19 6l.8 1.9L22 9l-2.2.9L19 12l-.8-1.9L16 9l2.2-.9L19 6z" fill="currentColor" opacity="0.9" />
                </svg>
              )}

              <span className="relative z-10 font-bold tracking-wide">
                {loading ? "Analyzing..." : "Analyze Landmark"}
              </span>

              {/* Shine effect */}
              {!loading && (
                <div 
                  className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                  style={{
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                    width: "50%"
                  }}
                />
              )}
            </button>
          </div>
          
          <style jsx>{`
            @keyframes spin {
              from {
                transform: rotate(0deg);
              }
              to {
                transform: rotate(360deg);
              }
            }
          `}</style>

          {error && (
            <div 
              className="mt-6 rounded-2xl p-5 text-sm"
              style={{ 
                background: "rgba(239, 68, 68, 0.1)", 
                border: "1.5px solid rgba(239, 68, 68, 0.3)", 
                color: "#dc2626",
                backdropFilter: "blur(10px)"
              }}
            >
              <div className="flex items-center gap-2 font-bold text-base mb-2">
                <span className="text-lg">⚠️</span>
                <span>Error Occurred</span>
              </div>
              <div className="mb-1">{error}</div>
              {error.includes("not implemented") && (
                <div className="mt-3 text-xs opacity-80 p-3 rounded-lg" style={{ background: "rgba(0, 0, 0, 0.1)" }}>
                  💡 Note: The backend landmark recognition service needs to be running at {process.env.LANDMARKS_API_BASE_URL || "http://localhost:3000"}/landmarks
                </div>
              )}
            </div>
          )}
          {result && (
            <div className="mt-8 space-y-6">
              {/* PRO Result Card with Premium Design */}
              <div 
                className="relative rounded-3xl overflow-hidden"
                style={{ 
                  background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)",
                  boxShadow: "0 30px 60px -15px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)"
                }}
              >
                {/* Premium Animated Gradient Overlay */}
                <div 
                  className="absolute inset-0"
                  style={{
                    background: "radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.15), transparent 50%), radial-gradient(circle at 0% 100%, rgba(139, 92, 246, 0.15), transparent 50%)",
                    animation: "pulse 4s ease-in-out infinite"
                  }}
                />

                {/* Subtle Grid Pattern */}
                <div 
                  className="absolute inset-0 opacity-[0.03]"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 100 0 L 0 0 0 100' fill='none' stroke='white' stroke-width='1'/%3E%3C/svg%3E")`,
                    backgroundSize: "50px 50px"
                  }}
                />

                <div className="relative p-10">
                  {/* Premium Success Badge with Glow */}
                  <div className="flex justify-center mb-8">
                    <div 
                      className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full text-sm font-bold"
                      style={{ 
                        background: "linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.2))",
                        backdropFilter: "blur(20px)",
                        border: "1.5px solid rgba(16, 185, 129, 0.3)",
                        boxShadow: "0 0 30px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                        color: "#10b981"
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                      </svg>
                      <span className="text-white font-extrabold">
                        {result.landmark?.confidence ? `${result.landmark.confidence.toFixed(1)}% Confidence` : 'Successfully Identified'}
                      </span>
                    </div>
                  </div>

                  {/* Landmark Info with Premium Styling */}
                  <div className="text-center">
                    <div className="mb-6">
                      <div 
                        className="inline-flex items-center justify-center w-20 h-20 rounded-3xl text-4xl mb-6 relative animate-float"
                        style={{ 
                          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2))",
                          backdropFilter: "blur(20px)",
                          border: "2px solid rgba(255, 255, 255, 0.1)",
                          boxShadow: "0 10px 40px rgba(99, 102, 241, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
                          animation: "float 3s ease-in-out infinite"
                        }}
                      >
                        <span 
                          style={{ 
                            filter: "drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3))",
                            animation: "bounce-subtle 2s ease-in-out infinite"
                          }}
                        >
                          📍
                        </span>
                      </div>
                    </div>
                    <h2 
                      className="text-5xl font-black mb-4 leading-tight"
                      style={{
                        background: "linear-gradient(135deg, #ffffff 0%, #e0e7ff 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        textShadow: "0 4px 20px rgba(255, 255, 255, 0.1)"
                      }}
                    >
                      {result.landmark?.name || "Unknown Location"}
                    </h2>
                    {/* Location Info - Combined Badge */}
                    {(result.landmark?.city || result.landmark?.country || result.landmark?.region) && (
                      <div 
                        className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-base mt-4"
                        style={{
                          background: "rgba(255, 255, 255, 0.08)",
                          backdropFilter: "blur(10px)",
                          border: "1px solid rgba(255, 255, 255, 0.1)"
                        }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        <span className="font-semibold text-white/90">
                          {[result.landmark?.city, result.landmark?.country, result.landmark?.region]
                            .filter(Boolean)
                            .join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Map Section with Tabs */}
              <div 
                className="rounded-3xl overflow-hidden"
                style={{ 
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  boxShadow: "0 10px 40px rgba(0, 0, 0, 0.08)"
                }}
              >
                {/* Map Header */}
                <div 
                  className="px-6 py-4"
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                        style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" }}
                      >
                        🗺️
                      </div>
                      <div>
                        <h3 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>
                          Location
                        </h3>
                        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                          Interactive map
                        </p>
                      </div>
                    </div>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(result.landmark?.name || "Unknown Location")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105"
                      style={{
                        background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                        color: "white",
                        boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)"
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                      Open
                    </a>
                  </div>
                </div>

                {/* Map */}
                <div style={{ height: "450px" }}>
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0, display: "block" }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(result.landmark?.name || "Unknown Location")}&zoom=15&maptype=roadmap`}
                  ></iframe>
                </div>

                {/* Map Footer */}
                <div 
                  className="px-6 py-3 flex items-center justify-between text-xs"
                  style={{ 
                    background: "var(--background)",
                    borderTop: "1px solid var(--border)",
                    color: "var(--muted-foreground)"
                  }}
                >
                  <span>Powered by Google Maps</span>
                  <span>Zoom • Pan • Explore</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
