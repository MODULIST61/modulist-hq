import { useState } from 'react'
import { useData } from '../../context/DataContext'
import { Button } from '../../components/ui/Button'
import { Input, Select, Textarea } from '../../components/ui/Input'
import { Modal, EmptyState } from '../../components/ui/Modal'
import { formatDate, generateId } from '../../lib/utils'

export default function Campaigns() {
  const { campaigns, contents, upsertCampaign, deleteCampaign, upsertContent, deleteContent } = useData()
  const [tab, setTab] = useState('kampanya')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})

  const openCampaign = (c = null) => {
    setForm(c || { ad: '', kanal: '', donem_baslangic: '', donem_bitis: '', butce_plan: 0, butce_harcanan: 0, tiklama: 0, kayit_sayisi: 0, notlar: '' })
    setModal('kampanya')
  }

  const openContent = (c = null) => {
    setForm(c || { baslik: '', hook: '', sektor: 'emlak', durum: 'fikir', yayin_tarihi: '', notlar: '' })
    setModal('icerik')
  }

  const saveCampaign = () => {
    if (!form.ad?.trim()) return
    upsertCampaign({ ...form, id: form.id || generateId() })
    setModal(null)
  }

  const saveContent = () => {
    if (!form.baslik?.trim()) return
    upsertContent({ ...form, id: form.id || generateId() })
    setModal(null)
  }

  return (
    <div>
      <div className="flex gap-2 mb-4 border-b">
        <button onClick={() => setTab('kampanya')} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === 'kampanya' ? 'border-accent text-accent' : 'border-transparent text-slate-500'}`}>Kampanyalar</button>
        <button onClick={() => setTab('icerik')} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === 'icerik' ? 'border-accent text-accent' : 'border-transparent text-slate-500'}`}>İçerik (Reels)</button>
      </div>

      {tab === 'kampanya' ? (
        <>
          <div className="flex justify-end mb-4"><Button onClick={() => openCampaign()}>+ Kampanya</Button></div>
          {campaigns.length === 0 ? (
            <EmptyState icon="📣" title="Kampanya yok" action={<Button onClick={() => openCampaign()}>İlk kampanyayı ekle</Button>} />
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-xl border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-left">
                  <tr>
                    <th className="px-4 py-3">Ad</th>
                    <th className="px-4 py-3">Kanal</th>
                    <th className="px-4 py-3">Dönem</th>
                    <th className="px-4 py-3">Bütçe</th>
                    <th className="px-4 py-3">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-800">
                  {campaigns.map((c) => (
                    <tr key={c.id}>
                      <td className="px-4 py-3 font-medium">{c.ad}</td>
                      <td className="px-4 py-3">{c.kanal}</td>
                      <td className="px-4 py-3">{formatDate(c.donem_baslangic)} – {formatDate(c.donem_bitis)}</td>
                      <td className="px-4 py-3">₺{c.butce_harcanan}/{c.butce_plan}</td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm" onClick={() => openCampaign(c)}>Düzenle</Button>
                        <Button variant="ghost" size="sm" className="text-danger" onClick={() => confirm('Sil?') && deleteCampaign(c.id)}>Sil</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex justify-end mb-4"><Button onClick={() => openContent()}>+ İçerik</Button></div>
          {contents.length === 0 ? (
            <EmptyState icon="🎬" title="İçerik yok" action={<Button onClick={() => openContent()}>İlk içeriği ekle</Button>} />
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-xl border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-left">
                  <tr>
                    <th className="px-4 py-3">Başlık / Hook</th>
                    <th className="px-4 py-3">Sektör</th>
                    <th className="px-4 py-3">Durum</th>
                    <th className="px-4 py-3">Yayın</th>
                    <th className="px-4 py-3">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-800">
                  {contents.map((c) => (
                    <tr key={c.id}>
                      <td className="px-4 py-3 font-medium">{c.baslik || c.hook}</td>
                      <td className="px-4 py-3">{c.sektor}</td>
                      <td className="px-4 py-3"><span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{c.durum}</span></td>
                      <td className="px-4 py-3">{formatDate(c.yayin_tarihi)}</td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm" onClick={() => openContent(c)}>Düzenle</Button>
                        <Button variant="ghost" size="sm" className="text-danger" onClick={() => confirm('Sil?') && deleteContent(c.id)}>Sil</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <Modal open={modal === 'kampanya'} onClose={() => setModal(null)} title={form.id ? 'Kampanya Düzenle' : 'Yeni Kampanya'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Ad" value={form.ad || ''} onChange={(e) => setForm({ ...form, ad: e.target.value })} className="col-span-2" />
          <Input label="Kanal" value={form.kanal || ''} onChange={(e) => setForm({ ...form, kanal: e.target.value })} />
          <Input label="Dönem Başlangıç" type="date" value={form.donem_baslangic || ''} onChange={(e) => setForm({ ...form, donem_baslangic: e.target.value })} />
          <Input label="Dönem Bitiş" type="date" value={form.donem_bitis || ''} onChange={(e) => setForm({ ...form, donem_bitis: e.target.value })} />
          <Input label="Bütçe Plan" type="number" value={form.butce_plan || 0} onChange={(e) => setForm({ ...form, butce_plan: Number(e.target.value) })} />
          <Input label="Harcanan" type="number" value={form.butce_harcanan || 0} onChange={(e) => setForm({ ...form, butce_harcanan: Number(e.target.value) })} />
          <Input label="Tıklama" type="number" value={form.tiklama || 0} onChange={(e) => setForm({ ...form, tiklama: Number(e.target.value) })} />
          <Input label="Kayıt Sayısı" type="number" value={form.kayit_sayisi || 0} onChange={(e) => setForm({ ...form, kayit_sayisi: Number(e.target.value) })} />
          <Textarea label="Notlar" value={form.notlar || ''} onChange={(e) => setForm({ ...form, notlar: e.target.value })} className="col-span-2" />
        </div>
        <Button onClick={saveCampaign} className="w-full mt-4">Kaydet</Button>
      </Modal>

      <Modal open={modal === 'icerik'} onClose={() => setModal(null)} title={form.id ? 'İçerik Düzenle' : 'Yeni İçerik'} size="lg">
        <div className="space-y-4">
          <Input label="Başlık" value={form.baslik || ''} onChange={(e) => setForm({ ...form, baslik: e.target.value })} />
          <Input label="Hook" value={form.hook || ''} onChange={(e) => setForm({ ...form, hook: e.target.value })} />
          <Select label="Sektör" value={form.sektor || 'emlak'} onChange={(e) => setForm({ ...form, sektor: e.target.value })}>
            <option value="emlak">Emlak</option>
            <option value="yapsat">Yap-Sat</option>
          </Select>
          <Select label="Durum" value={form.durum || 'fikir'} onChange={(e) => setForm({ ...form, durum: e.target.value })}>
            {['fikir', 'cekildi', 'kurgu', 'yayinda'].map((d) => <option key={d} value={d}>{d}</option>)}
          </Select>
          <Input label="Yayın Tarihi" type="date" value={form.yayin_tarihi || ''} onChange={(e) => setForm({ ...form, yayin_tarihi: e.target.value })} />
          <Textarea label="Notlar" value={form.notlar || ''} onChange={(e) => setForm({ ...form, notlar: e.target.value })} />
          <Button onClick={saveContent} className="w-full">Kaydet</Button>
        </div>
      </Modal>
    </div>
  )
}
