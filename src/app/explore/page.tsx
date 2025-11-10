"use client"
import { useState } from "react"
import type React from "react"

export default function ExplorePage() {
  // Prevent scroll restoration from jumping to top
  if (typeof window !== "undefined") {
    window.history.scrollRestoration = "manual";
  }
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

      // Handle common upstream errors explicitly
      if (!res.ok || data?.success === false) {
        // Prefer explicit upstream/timeout messages if available
        const upstreamMsg = data?.error || data?.message || data?.upstreamBody || data?.detail
        // If the backend specifically told us the endpoint isn't implemented, surface that to the user
        if ((data?.upstreamBody && /not implemented/i.test(data.upstreamBody)) ||
            /not implemented/i.test(upstreamMsg)) {
          setError("File upload not implemented yet")
        } else if (/timeout|Upstream timeout/i.test(upstreamMsg || "")) {
          setError("Upstream timeout")
        } else {
          setError(upstreamMsg || "Analysis failed.")
        }
        return
      }

      // Normalize the backend result so the UI always has a label to show
      // Backend shapes supported:
      // - { display_name, confidence, raw }
      // - { best_prediction: { landmark_name, confidence }, ... }
      // - { landmarks: [{ name, confidence }], ... }
      // - { predictions: [{ landmark_name, confidence }], ... }
      const raw = data.raw ?? data
      const displayName =
        data.display_name ||
        raw?.best_prediction?.landmark_name ||
        raw?.best_prediction?.landmarkName ||
        (Array.isArray(raw?.landmarks) && (raw.landmarks[0]?.name || raw.landmarks[0]?.landmark_name)) ||
        (Array.isArray(raw?.predictions) && (raw.predictions[0]?.landmark_name || raw.predictions[0]?.name)) ||
        null

      const confidence =
        data.confidence ??
        raw?.best_prediction?.confidence ??
        raw?.landmarks?.[0]?.confidence ??
        raw?.predictions?.[0]?.confidence ??
        null

      // Try to surface any place metadata if returned by backend
      const place = raw?.place_record ?? raw?.best_prediction?.place_record ?? null

      // Map into the `result` shape your component expects
      const mapped = {
        landmark: {
          name: displayName ?? "Unknown Location",
          confidence: typeof confidence === "number" ? Number(confidence) : null,
          city: place?.city ?? null,
          country: place?.country ?? null,
          region: place?.region ?? null,
          id: raw?.class_id ?? raw?.best_prediction?.class_id ?? raw?.predictions?.[0]?.class_id ?? null,
        },
        raw,
      }

      setResult(mapped)
    } catch (e: any) {
      setError(e?.message || "Unexpected error.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen transition-colors duration-300" style={{ background: "var(--background)" }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #29D1FF, #2EA7D9)",
                boxShadow: "0 8px 24px rgba(41, 209, 255, 0.3)"
              }}
            >
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-[#29D1FF] to-[#2EA7D9] bg-clip-text text-transparent">
              Explore Landmarks
            </h1>
          </div>
          <p className="text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
            Discover the world's most iconic landmarks with AI-powered recognition. Upload a photo or paste an image URL to get started.
          </p>
        </div>

        {/* Main Card */}
        <div 
          className="rounded-3xl p-8 shadow-xl backdrop-blur-sm"
          style={{ 
            background: "rgba(var(--surface-rgb), 0.6)", 
            border: "1px solid var(--border)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.1)"
          }}
        >
          
          {/* URL Input Row */}
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input
              type="url"
              value={imageUrl}
              onChange={handleUrlChange}
              placeholder="🔗 Paste image URL here..."
              className="col-span-2 rounded-2xl px-5 py-4 outline-none transition-all focus:ring-2"
              style={{ 
                background: "var(--background)", 
                color: "var(--foreground)", 
                border: "2px solid var(--border)"
              }}
              onFocus={(e) => e.target.style.borderColor = "#29D1FF"}
              onBlur={(e) => e.target.style.borderColor = "var(--border)"}
            />
            <button 
              onClick={handleClear}
              className="rounded-2xl px-5 py-4 font-bold text-white transition-all hover:scale-105 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #ef4444, #dc2626)",
                boxShadow: "0 6px 20px rgba(239, 68, 68, 0.3)"
              }}
            >
              Clear
            </button>
          </div>

          {/* Upload Area */}
          <div
            className="border-2 border-dashed rounded-3xl p-12 text-center mb-6 transition-all hover:border-[#29D1FF] hover:bg-[#29D1FF]/5"
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
            <input
              type="file"
              id="camera-upload-explore"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label htmlFor="file-upload-explore" className="cursor-pointer inline-block">
              <div 
                className="w-20 h-20 mx-auto mb-4 rounded-3xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, rgba(41, 209, 255, 0.15), rgba(46, 167, 217, 0.15))",
                  border: "2px solid rgba(41, 209, 255, 0.3)"
                }}
              >
                <svg className="w-10 h-10" style={{ color: "#29D1FF" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </div>
              <div className="text-xl font-bold mb-2" style={{ color: "var(--foreground)" }}>
                Click to upload or drag & drop
              </div>
              <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                JPG, PNG, WebP up to 50MB
              </div>
            </label>
          </div>

          {/* Preview */}
          {previewUrl && (
            <div className="mb-6 text-center">
              <div className="relative inline-block">
                <img
                  src={previewUrl || "/placeholder.svg"}
                  alt="Preview"
                  className="max-w-full h-auto rounded-3xl mx-auto shadow-2xl"
                  style={{ 
                    maxHeight: 420,
                    border: "3px solid var(--border)"
                  }}
                />
                <div 
                  className="absolute -top-3 -right-3 w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-xl"
                  style={{
                    background: "linear-gradient(135deg, #10b981, #059669)",
                    color: "white"
                  }}
                >
                  ✓
                </div>
              </div>
            </div>
          )}

          {/* Analyze Button */}
          <div className="text-center">
            <button
              onClick={handleAnalyze}
              disabled={loading || (!previewUrl && !imageUrl)}
              className="relative group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold text-base text-white overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{
                background: loading 
                  ? "linear-gradient(135deg, #64748b, #475569)"
                  : "linear-gradient(135deg, #29D1FF, #2EA7D9)",
                boxShadow: loading 
                  ? "0 10px 40px rgba(100, 116, 139, 0.4)"
                  : "0 10px 40px rgba(41, 209, 255, 0.4)",
              }}
            >
              {/* Shimmer effect */}
              {!loading && (
                <div 
                  className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                  style={{
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)"
                  }}
                />
              )}

              {/* Loading Spinner */}
              {loading && (
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
              )}

              {/* AI Icon */}
              {!loading && (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l1.5 3.5L17 7l-3.5 1.5L12 12l-1.5-3.5L7 7l3.5-1.5L12 2z"/>
                  <path d="M19 10l.8 1.9L22 13l-2.2.9L19 16l-.8-1.9L16 13l2.2-.9L19 10z"/>
                </svg>
              )}

              <span className="relative z-10 font-extrabold">
                {loading ? "Analyzing..." : "Analyze Landmark"}
              </span>
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div 
              className="mt-6 rounded-2xl p-5 backdrop-blur-sm"
              style={{ 
                background: "rgba(239, 68, 68, 0.1)", 
                border: "1.5px solid rgba(239, 68, 68, 0.3)", 
                color: "#dc2626"
              }}
            >
              <div className="flex items-center gap-2 font-bold text-base mb-2">
                <span className="text-xl">⚠️</span>
                <span>Error Occurred</span>
              </div>
              <div className="mb-1">{error}</div>
              {error.includes("not implemented") && (
                <div className="mt-3 text-xs opacity-80 p-3 rounded-xl" style={{ background: "rgba(0, 0, 0, 0.1)" }}>
                  💡 Note: The backend landmark recognition service needs to be running at {process.env.LANDMARKS_API_BASE_URL || "http://localhost:3000"}/landmarks
                </div>
              )}
            </div>
          )}
          
          {/* Result Display */}
          {result && (
            <div className="mt-8 space-y-6">
              {/* Result Card with TripFlow Design */}
              <div 
                className="relative rounded-3xl overflow-hidden"
                style={{ 
                  background: "linear-gradient(135deg, #29D1FF, #2EA7D9)",
                  boxShadow: "0 30px 60px rgba(41, 209, 255, 0.4)"
                }}
              >
                {/* Pattern overlay */}
                <div 
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                    backgroundSize: "40px 40px"
                  }}
                />

                <div className="relative p-10">
                  {/* Success Badge */}
                  <div className="flex justify-center mb-8">
                    <div 
                      className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full font-bold"
                      style={{ 
                        background: "rgba(255, 255, 255, 0.2)",
                        backdropFilter: "blur(20px)",
                        border: "1.5px solid rgba(255, 255, 255, 0.3)",
                        color: "white"
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                      </svg>
                      <span className="font-extrabold">
                        {result.landmark?.confidence ? `${result.landmark.confidence.toFixed(1)}% Confidence` : 'Successfully Identified'}
                      </span>
                    </div>
                  </div>

                  {/* Landmark Info */}
                  <div className="text-center">
                    <div className="mb-6">
                      <div 
                        className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6"
                        style={{ 
                          background: "rgba(255, 255, 255, 0.2)",
                          backdropFilter: "blur(20px)",
                          border: "2px solid rgba(255, 255, 255, 0.3)",
                          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)"
                        }}
                      >
                        <span className="text-5xl" style={{ filter: "drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3))" }}>
                          📍
                        </span>
                      </div>
                    </div>
                    <h2 className="text-5xl font-extrabold mb-4 leading-tight text-white drop-shadow-lg">
                      {result.landmark?.name || "Unknown Location"}
                    </h2>
                    {/* Location Info */}
                    {(result.landmark?.city || result.landmark?.country || result.landmark?.region) && (
                      <div 
                        className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-base mt-4"
                        style={{
                          background: "rgba(255, 255, 255, 0.2)",
                          backdropFilter: "blur(10px)",
                          border: "1px solid rgba(255, 255, 255, 0.3)"
                        }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        <span className="font-semibold text-white">
                          {[result.landmark?.city, result.landmark?.country, result.landmark?.region]
                            .filter(Boolean)
                            .join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Map Section */}
              <div 
                className="rounded-3xl overflow-hidden backdrop-blur-sm"
                style={{ 
                  background: "rgba(var(--surface-rgb), 0.6)",
                  border: "1px solid var(--border)",
                  boxShadow: "0 20px 60px rgba(0, 0, 0, 0.1)"
                }}
              >
                {/* Map Header */}
                <div 
                  className="px-6 py-5"
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-2xl flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg, #29D1FF, #2EA7D9)" }}
                      >
                        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
                          <line x1="8" y1="2" x2="8" y2="18"/>
                          <line x1="16" y1="6" x2="16" y2="22"/>
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>
                          Location Map
                        </h3>
                        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                          Interactive view
                        </p>
                      </div>
                    </div>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(result.landmark?.name || "Unknown Location")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
                      style={{
                        background: "linear-gradient(135deg, #29D1FF, #2EA7D9)",
                        boxShadow: "0 4px 12px rgba(41, 209, 255, 0.3)"
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                      Open in Maps
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
