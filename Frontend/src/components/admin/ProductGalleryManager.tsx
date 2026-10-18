import { useState } from 'react';
import { Star, Trash2, Plus, Images } from 'lucide-react';
import type { Product, ProductImage } from '../../types/api';
import { adminApi } from '../../api/admin';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import ImageUploader from './ImageUploader';

interface ProductGalleryManagerProps {
  product: Product;
  onUpdate: (updatedProduct: Product) => void;
  className?: string;
}

export default function ProductGalleryManager({
  product,
  onUpdate,
  className = '',
}: ProductGalleryManagerProps) {
  const toast = useToast();
  const { confirm } = useConfirm();
  const [isAdding, setIsAdding] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const images = product.images ?? [];

  const handleAddImage = async (url: string) => {
    if (!url) return;
    try {
      const isFirst = images.length === 0;
      const created = await adminApi.addProductGalleryImage(product.id, url, undefined, isFirst);
      const updatedImages = [...images, created];
      onUpdate({
        ...product,
        image_path: isFirst ? created.url : product.image_path,
        images: updatedImages,
      });
      toast.success('Gallery photo attached to provision.');
      setNewImageUrl('');
      setIsAdding(false);
    } catch {
      toast.error('Failed to attach gallery photo.');
    }
  };

  const handleSetPrimary = async (img: ProductImage) => {
    if (img.is_primary) return;
    try {
      setActionLoadingId(img.id);
      await adminApi.setPrimaryGalleryImage(product.id, img.id);
      const updatedImages = images.map((i) => ({
        ...i,
        is_primary: i.id === img.id,
      }));
      onUpdate({
        ...product,
        image_path: img.url,
        images: updatedImages,
      });
      toast.success('Primary display photo updated.');
    } catch {
      toast.error('Failed to update primary photo.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (img: ProductImage) => {
    const confirmed = await confirm({
      title: 'Remove Gallery Photo?',
      message: 'Are you sure you want to remove this photo from the product gallery?',
      confirmText: 'Remove Photo',
      cancelText: 'Keep Photo',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      setActionLoadingId(img.id);
      await adminApi.deleteProductGalleryImage(product.id, img.id);
      const remaining = images.filter((i) => i.id !== img.id);
      // If primary was deleted, first remaining becomes primary
      if (img.is_primary && remaining.length > 0) {
        remaining[0].is_primary = true;
      }
      onUpdate({
        ...product,
        image_path: remaining.find((i) => i.is_primary)?.url ?? remaining[0]?.url ?? null,
        images: remaining,
      });
      toast.success('Photo removed from gallery.');
    } catch {
      toast.error('Failed to remove gallery photo.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-tide flex items-center gap-1.5">
          <Images className="w-4 h-4 text-harbor" />
          Multi-Angle Gallery ({images.length} photos)
        </label>
        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="text-xs font-semibold text-harbor hover:underline flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Perspective Shot
          </button>
        )}
      </div>

      {/* Gallery Grid */}
      {images.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {images.map((img) => (
            <div
              key={img.id}
              className={`relative group rounded-xl overflow-hidden border bg-white ${
                img.is_primary ? 'border-harbor ring-2 ring-harbor/20' : 'border-fog'
              }`}
            >
              <div className="aspect-square w-full bg-mist overflow-hidden">
                <img
                  src={img.url}
                  alt={img.alt_text || product.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Status & Action overlay */}
              <div className="p-2 flex items-center justify-between bg-white text-xs border-t border-fog/60">
                {img.is_primary ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-harbor">
                    <Star className="w-3.5 h-3.5 fill-lantern text-lantern" />
                    Primary
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(img)}
                    disabled={actionLoadingId === img.id}
                    className="text-[11px] text-slate hover:text-harbor font-medium transition-colors"
                  >
                    Set Primary
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleDelete(img)}
                  disabled={actionLoadingId === img.id}
                  className="text-slate hover:text-buoy p-1 rounded transition-colors"
                  title="Remove this photo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate italic bg-mist/50 p-3 rounded-lg border border-fog/50">
          No additional perspective shots uploaded yet. Add angles to showcase back, side, and detail views to customers.
        </p>
      )}

      {/* Add New Perspective Uploader Section */}
      {isAdding && (
        <div className="p-4 bg-wash/30 rounded-xl border border-wash space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-tide">Upload Additional Shot</h4>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-slate hover:text-tide"
            >
              Cancel
            </button>
          </div>
          <ImageUploader
            value={newImageUrl}
            onChange={(url) => {
              setNewImageUrl(url);
              handleAddImage(url);
            }}
          />
        </div>
      )}
    </div>
  );
}
