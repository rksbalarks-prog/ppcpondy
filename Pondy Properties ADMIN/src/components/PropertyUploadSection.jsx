import React, { useState, useRef, useCallback } from "react";
import { IoCloseCircle } from "react-icons/io5";
import { MdAddPhotoAlternate } from "react-icons/md";
import { FaFileVideo, FaCheckCircle } from "react-icons/fa";

// ─── SVG Circular Progress Ring ───────────────────────────────
function ProgressRing({ progress = 0, size = 56, stroke = 4, color = "#2F747F" }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (progress / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e0e0e0" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.3s ease" }}
      />
    </svg>
  );
}

// ─── Single Photo Card ────────────────────────────────────────
function PhotoCard({
  photo, index, isDefault, isProcessing, progress,
  originalSize, compressedSize,
  onSelect, onRemove,
}) {
  const src = photo && photo.size > 0 ? URL.createObjectURL(photo) : null;

  return (
    <div
      onClick={() => !isProcessing && onSelect(index)}
      style={{
        position: "relative",
        borderRadius: 14,
        overflow: "hidden",
        border: isDefault ? "2.5px solid #2F747F" : "2px solid #e0e9ea",
        background: "#f4f8f8",
        cursor: isProcessing ? "default" : "pointer",
        boxShadow: isDefault ? "0 0 0 3px rgba(47,116,127,0.18)" : "0 2px 8px rgba(0,0,0,0.07)",
        transition: "box-shadow 0.2s, border 0.2s",
        width: "100%",
        aspectRatio: "1 / 1",
      }}
    >
      {/* Thumbnail */}
      {src ? (
        <img
          src={src} alt={`Photo ${index + 1}`}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : (
        <div style={{ width: "100%", height: "100%", background: "#e8f0f1" }} />
      )}

      {/* Processing overlay */}
      {isProcessing && (
        <div style={{
          position: "absolute", inset: 0,
          background: "rgba(255,255,255,0.82)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 4,
          backdropFilter: "blur(2px)",
        }}>
          <ProgressRing progress={progress} size={52} stroke={5} />
          <span style={{ fontSize: 11, color: "#2F747F", fontWeight: 600 }}>
            {progress}%
          </span>
          <span style={{ fontSize: 10, color: "#6b9ca4" }}>Compressing…</span>
        </div>
      )}

      {/* Default badge */}
      {isDefault && !isProcessing && (
        <div style={{
          position: "absolute", bottom: 6, left: 6,
          background: "#2F747F", color: "#fff",
          borderRadius: 20, padding: "2px 8px",
          fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", gap: 3,
        }}>
          <FaCheckCircle size={9} /> Default
        </div>
      )}

      {/* Size badge after compression */}
      {!isProcessing && compressedSize != null && (
        <div style={{
          position: "absolute", bottom: isDefault ? 28 : 6, left: 6,
          background: "rgba(0,0,0,0.55)", color: "#fff",
          borderRadius: 20, padding: "1px 7px", fontSize: 9, fontWeight: 600,
        }}>
          {originalSize != null && (
            <span style={{ textDecoration: "line-through", opacity: 0.7, marginRight: 3 }}>
              {(originalSize / 1024).toFixed(0)}KB
            </span>
          )}
          {(compressedSize / 1024).toFixed(0)}KB
        </div>
      )}

      {/* Remove button */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); if (!isProcessing) onRemove(index); }}
        style={{
          position: "absolute", top: 5, right: 5,
          background: "rgba(255,255,255,0.9)", border: "none",
          borderRadius: "50%", width: 26, height: 26,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: isProcessing ? "not-allowed" : "pointer",
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)", padding: 0,
        }}
      >
        <IoCloseCircle size={20} color={isProcessing ? "#ccc" : "#F22952"} />
      </button>
    </div>
  );
}

// ─── Single Video Card ────────────────────────────────────────
function VideoCard({ video, index, isProcessing, progress, originalSize, compressedSize, onRemove }) {
  const src = video && video.size > 0 ? URL.createObjectURL(video) : null;

  return (
    <div style={{
      position: "relative",
      borderRadius: 14,
      overflow: "hidden",
      border: "2px solid #e0e9ea",
      background: "#f4f8f8",
      width: 160,
      flexShrink: 0,
    }}>
      {src ? (
        <video width="160" height="120" controls style={{ display: "block", width: "100%", height: 120, objectFit: "cover" }}>
          <source src={src} type="video/mp4" />
        </video>
      ) : (
        <div style={{ width: "100%", height: 120, background: "#e8f0f1" }} />
      )}

      {/* Processing overlay */}
      {isProcessing && (
        <div style={{
          position: "absolute", inset: 0,
          background: "rgba(255,255,255,0.85)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 4,
          backdropFilter: "blur(2px)",
        }}>
          <ProgressRing progress={progress} size={48} stroke={5} color="#6CBAAF" />
          <span style={{ fontSize: 11, color: "#2F747F", fontWeight: 600 }}>{progress}%</span>
          <span style={{ fontSize: 10, color: "#6b9ca4" }}>Compressing…</span>
        </div>
      )}

      {/* Size badge */}
      {!isProcessing && compressedSize != null && (
        <div style={{
          position: "absolute", bottom: 6, left: 6,
          background: "rgba(0,0,0,0.55)", color: "#fff",
          borderRadius: 20, padding: "1px 7px", fontSize: 9, fontWeight: 600,
        }}>
          {originalSize != null && (
            <span style={{ textDecoration: "line-through", opacity: 0.7, marginRight: 3 }}>
              {(originalSize / 1024 / 1024).toFixed(1)}MB
            </span>
          )}
          {(compressedSize / 1024 / 1024).toFixed(1)}MB
        </div>
      )}

      {/* Remove */}
      <button
        type="button"
        onClick={() => !isProcessing && onRemove(index)}
        style={{
          position: "absolute", top: 5, right: 5,
          background: "rgba(255,255,255,0.9)", border: "none",
          borderRadius: "50%", width: 26, height: 26,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: isProcessing ? "not-allowed" : "pointer",
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)", padding: 0,
        }}
      >
        <IoCloseCircle size={20} color={isProcessing ? "#ccc" : "#F22952"} />
      </button>
    </div>
  );
}

// ─── Drop Zone ────────────────────────────────────────────────
function DropZone({ accept, multiple, onChange, icon, label, sublabel, disabled }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const dt = e.dataTransfer;
    if (dt.files && dt.files.length > 0) {
      const synth = { target: { files: dt.files } };
      onChange(synth);
    }
  }, [onChange, disabled]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      style={{
        border: `2px dashed ${dragging ? "#2F747F" : "#b0cdd1"}`,
        borderRadius: 16,
        background: dragging ? "rgba(47,116,127,0.06)" : "#f7fbfc",
        padding: "28px 16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "border 0.2s, background 0.2s",
        userSelect: "none",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={onChange}
        style={{ display: "none" }}
      />
      <div style={{
        width: 56, height: 56, borderRadius: "50%",
        background: "linear-gradient(135deg, #2F747F 60%, #6CBAAF)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 4px 16px rgba(47,116,127,0.18)",
      }}>
        {icon}
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontWeight: 700, color: "#2F747F", fontSize: 15 }}>{label}</div>
        <div style={{ color: "#89b3ba", fontSize: 12, marginTop: 2 }}>{sublabel}</div>
      </div>
      <div style={{
        background: "#2F747F", color: "#fff",
        borderRadius: 20, padding: "6px 22px",
        fontSize: 13, fontWeight: 600,
        boxShadow: "0 2px 8px rgba(47,116,127,0.18)",
      }}>
        Browse Files
      </div>
    </div>
  );
}

// ─── MAIN EXPORT: PropertyUploadSection ──────────────────────
export function PropertyUploadSection({
  photos = [],
  processingPhotoIndices = [],
  photoProgress = {},
  selectedPhotoIndex = 0,
  handlePhotoUpload,
  removePhoto,
  handlePhotoSelect,

  videos = [],
  processingVideoIndices = [],
  videoProgress = {},
  handleVideoChange,
  removeVideo,

  originalPhotoSizes = [],
  originalVideoSizes = [],
}) {
  const anyProcessing = processingPhotoIndices.length > 0 || processingVideoIndices.length > 0;

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif" }}>
      {/* ── PHOTOS ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <div style={{
            width: 4, height: 22, borderRadius: 2,
            background: "linear-gradient(#2F747F, #6CBAAF)"
          }} />
          <h4 style={{ margin: 0, color: "#2F747F", fontWeight: 700, fontSize: 17 }}>
            Property Images
          </h4>
          <span style={{
            marginLeft: "auto", fontSize: 12, color: "#89b3ba", fontWeight: 500
          }}>
            {photos.length} / 15
          </span>
        </div>

        {photos.length < 15 && (
          <DropZone
            accept="image/*"
            multiple
            onChange={handlePhotoUpload}
            icon={<MdAddPhotoAlternate size={26} color="#fff" />}
            label="Drag & drop photos here"
            sublabel="JPG, PNG, WEBP — max 50MB each · up to 15 photos"
            disabled={anyProcessing}
          />
        )}

        {photos.length > 0 && (
          <>
            {/* Hint */}
            <p style={{ fontSize: 12, color: "#89b3ba", margin: "10px 0 8px", textAlign: "center" }}>
              Tap a photo to set it as the <strong>default</strong> cover image
            </p>

            {/* Grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 10,
            }}>
              {photos.map((photo, index) => (
                <PhotoCard
                  key={index}
                  photo={photo}
                  index={index}
                  isDefault={selectedPhotoIndex === index}
                  isProcessing={processingPhotoIndices.includes(index)}
                  progress={photoProgress[index] || 0}
                  originalSize={originalPhotoSizes[index]}
                  compressedSize={
                    !processingPhotoIndices.includes(index) && photo.size > 0
                      ? photo.size
                      : null
                  }
                  onSelect={handlePhotoSelect}
                  onRemove={removePhoto}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── VIDEOS ── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <div style={{
            width: 4, height: 22, borderRadius: 2,
            background: "linear-gradient(#2F747F, #6CBAAF)"
          }} />
          <h4 style={{ margin: 0, color: "#2F747F", fontWeight: 700, fontSize: 17 }}>
            Property Video
          </h4>
          <span style={{
            marginLeft: "auto", fontSize: 12, color: "#89b3ba", fontWeight: 500
          }}>
            {videos.length} / 5
          </span>
        </div>

        {videos.length < 5 && (
          <DropZone
            accept="video/*"
            multiple
            onChange={handleVideoChange}
            icon={<FaFileVideo size={22} color="#fff" />}
            label="Drag & drop videos here"
            sublabel="MP4, MOV, AVI — max 100MB each · up to 5 videos"
            disabled={anyProcessing}
          />
        )}

        {videos.length > 0 && (
          <div style={{
            display: "flex", gap: 12, flexWrap: "wrap", marginTop: 14
          }}>
            {videos.map((video, index) => (
              <VideoCard
                key={index}
                video={video}
                index={index}
                isProcessing={processingVideoIndices.includes(index)}
                progress={videoProgress[index] || 0}
                originalSize={originalVideoSizes[index]}
                compressedSize={
                  !processingVideoIndices.includes(index) && video.size > 0
                    ? video.size
                    : null
                }
                onRemove={removeVideo}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Global compression notice ── */}
      {anyProcessing && (
        <div style={{
          marginTop: 16,
          padding: "10px 16px",
          background: "linear-gradient(90deg, #eaf5f5, #f4fbf8)",
          borderRadius: 10,
          border: "1px solid #c5e2e4",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{
            width: 10, height: 10, borderRadius: "50%",
            background: "#2F747F",
            animation: "pulse 1s infinite",
          }} />
          <span style={{ fontSize: 13, color: "#2F747F", fontWeight: 600 }}>
            Watermarking &amp; compressing your files — please wait…
          </span>
          <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.5)} }`}</style>
        </div>
      )}
    </div>
  );
}

export default PropertyUploadSection;
