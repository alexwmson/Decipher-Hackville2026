function LoadingOverlay({ show, label = 'Processing...' }) {
  if (!show) return null

  return (
    <div className="absolute inset-0 rounded-2xl bg-black/50 backdrop-blur-sm flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 rounded-full border-2 border-white/20 border-t-cyan-300 animate-spin" />
        <div className="text-sm text-white/90">{label}</div>
      </div>
    </div>
  )
}

export default LoadingOverlay

