import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'

export default function AccessDenied() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="text-5xl mb-4">🔒</div>
      <h1 className="text-xl font-bold text-primary dark:text-white mb-2">Bu alana erişiminiz yok</h1>
      <p className="text-slate-500 mb-6 max-w-md">
        Patron, ekip sayfasından görev unvanınızı ve erişim yetkilerinizi belirler.
        Erişim gerekiyorsa patronunuzla iletişime geçin.
      </p>
      <Link to="/"><Button>Ana Sayfaya Dön</Button></Link>
    </div>
  )
}
