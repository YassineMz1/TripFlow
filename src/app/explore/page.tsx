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

  const MAX_SIZE = 10 * 1024 * 1024 // 10MB

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file.")
      return
    }
    if (file.size > MAX_SIZE) {
      alert("File exceeds 10MB.")
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
      alert("File exceeds 10MB.")
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
        setError(data?.error || "Analysis failed.")
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
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Explore Landmarks</h1>
          <p className="text-sm text-gray-600">Paste an image URL or upload a photo to identify landmarks.</p>
        </div>

        <div className="rounded-2xl p-6 bg-white shadow-lg border border-gray-200">
          <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="url"
              value={imageUrl}
              onChange={handleUrlChange}
              placeholder="Paste image URL..."
              className="col-span-2 rounded-xl px-4 py-3 outline-none bg-gray-50 text-gray-900 border border-gray-200"
            />
            <button onClick={handleClear} className="rounded-xl px-4 py-3 bg-blue-600 text-white hover:bg-blue-700">
              Clear
            </button>
          </div>

          <div
            className="border-2 border-dashed rounded-xl p-6 text-center mb-4 border-gray-300"
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
              <div className="text-3xl mb-2">📸</div>
              <div className="font-semibold text-gray-900">Click to upload or drag & drop an image here</div>
              <div className="text-sm mt-2 text-gray-600">Supported: JPG, PNG, WebP (max 10MB)</div>
            </label>
          </div>

          {previewUrl && (
            <div className="mb-4 text-center">
              <img
                src={previewUrl || "/placeholder.svg"}
                alt="Preview"
                className="max-w-full h-auto rounded-xl mx-auto"
                style={{ maxHeight: 420 }}
              />
            </div>
          )}

          <div className="text-center">
            <button
              onClick={handleAnalyze}
              className="rounded-xl font-semibold px-6 py-2 text-white bg-blue-600 shadow-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || (!previewUrl && !imageUrl)}
            >
              {loading ? "Analyzing..." : "Analyze Landmark"}
            </button>
          </div>

          {error && (
            <div className="mt-4 text-center text-sm text-red-600">
              {error}
            </div>
          )}
          {result && (
            <pre className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs overflow-auto text-left">
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </main>
  )
}
