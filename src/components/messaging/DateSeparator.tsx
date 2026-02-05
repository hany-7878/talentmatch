// DateSeparator.tsx
interface DateSeparatorProps {
  date: string | null | undefined;
}

export default function DateSeparator({ date }: DateSeparatorProps) {
  if (!date) return null;
  // ... your formatting logic
  return (
    <div className="text-center my-4 text-xs text-slate-500 uppercase tracking-widest">
       {new Date(date).toLocaleDateString()}
    </div>
  );
}