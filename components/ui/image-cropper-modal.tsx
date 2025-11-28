"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { X, Save } from "lucide-react";
import { getCroppedImg } from "@/lib/canvas-utils";
import { useLanguage } from "@/components/language-provider";
import type { Area } from "react-easy-crop";

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string;
  aspectRatio: number;
  isCircular?: boolean;
  onCancel: () => void;
  onCropComplete: (croppedImageBase64: string) => void;
}

export function ImageCropperModal({
  isOpen,
  imageSrc,
  aspectRatio,
  isCircular = false,
  onCancel,
  onCropComplete,
}: ImageCropperModalProps) {
  const { t } = useLanguage();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [completedCrop, setCompletedCrop] = useState<Area | null>(null);

  const onCropChange = useCallback((crop: { x: number; y: number }) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(zoom);
  }, []);

  const onCropCompleteCallback = useCallback(
    (_: Area, croppedAreaPixels: Area) => {
      setCompletedCrop(croppedAreaPixels);
    },
    []
  );

  const handleSave = async () => {
    if (!completedCrop) return;

    try {
      const croppedImage = await getCroppedImg(imageSrc, completedCrop);
      onCropComplete(croppedImage);
    } catch (error) {
      console.error("Error cropping image:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div 
        className="w-[600px] h-[80%] bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h3 className="text-lg font-semibold text-card-foreground">
            {t("dashboard.cropper_adjust_image")}
          </h3>
          <button
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Crop Area */}
        <div className="flex-1 relative bg-zinc-900">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            cropShape={isCircular ? "round" : "rect"}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteCallback}
            style={{
              containerStyle: {
                width: "100%",
                height: "100%",
                position: "relative",
              },
            }}
          />
        </div>

        {/* Controls */}
        <div className="p-4 border-t border-zinc-800 space-y-4">
          {/* Zoom Slider */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-card-foreground flex items-center justify-between">
              <span>{t("dashboard.cropper_zoom")}</span>
              <span className="text-xs text-muted-foreground">{zoom.toFixed(1)}x</span>
            </label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 bg-zinc-800/50 hover:bg-zinc-800 text-card-foreground rounded-lg transition-colors font-medium"
            >
              {t("dashboard.btn_cancel")}
            </button>
            <button
              onClick={handleSave}
              disabled={!completedCrop}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              {t("dashboard.cropper_save_apply")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

