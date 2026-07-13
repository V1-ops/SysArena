export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-[#11161d]">
      <div
        className="h-full rounded-full bg-[linear-gradient(90deg,#45A29E_0%,#66FCF1_100%)] shadow-[0_0_20px_rgba(102,252,241,0.24)] transition-all duration-500"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
