import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';

interface BottomSheetOption {
  id: string;
  label: string;
}

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  options: BottomSheetOption[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function BottomSheet({ isOpen, onClose, title, options, selectedId, onSelect }: BottomSheetProps) {
  const [mounted, setMounted] = useState(isOpen);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      // Next tick so the slide-up transition actually animates from closed state
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
      const timeout = setTimeout(() => setMounted(false), 280);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Sheet */}
      <div
        className={`relative w-full max-w-lg bg-synema-card rounded-t-3xl border-t border-synema-border max-h-[70vh] overflow-hidden flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          visible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-9 h-1.5 rounded-full bg-white/15" />
        </div>

        <h3 className="text-lg font-bold text-white px-5 pt-2 pb-3">{title}</h3>

        <div className="overflow-y-auto pb-8">
          {options.map(option => {
            const isSelected = option.id === selectedId;
            return (
              <button
                key={option.id}
                onClick={() => {
                  onSelect(option.id);
                  onClose();
                }}
                className="w-full flex items-center justify-between px-5 py-3.5 text-left active:bg-white/5 transition-colors duration-100"
              >
                <span className={`text-[15px] ${isSelected ? 'text-white font-semibold' : 'text-gray-300'}`}>
                  {option.label}
                </span>
                {isSelected && <Check className="w-5 h-5 text-synema-violet" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
