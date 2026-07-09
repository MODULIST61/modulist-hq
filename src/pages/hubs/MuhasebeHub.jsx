import Finance from '../Finance'

export default function MuhasebeHub() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary dark:text-white">Muhasebe</h1>
        <p className="text-sm text-slate-500 mt-1">Gelir-gider kayıtları, CSV export — onay patron panelinde</p>
      </div>
      <Finance mode="accounting" embedded />
    </div>
  )
}
