import React, { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDatabase } from '@/hooks/useDatabase';
import { Client, FicheSuivi, FicheSeance, generateId } from '@/lib/ctk-data';
import { Plus, Trash2, Edit2, Printer, FileText } from 'lucide-react';

const painTypes = ['Mécanique', 'Inflammatoire', 'Neuropathique'];

const FicheSuiviPage: React.FC<{clients: Client[]}> = ({ clients }) => {
  const db = useDatabase();
  const { currentUser } = useAuth();
  const [editing, setEditing] = useState<FicheSuivi | null>(null);
  const [seances, setSeances] = useState<FicheSeance[]>([]);
  const [editingSeanceId, setEditingSeanceId] = useState<string | null>(null);

  const clientMap = useMemo(() => Object.fromEntries(clients.map(c => [c.id, c])), [clients]);

  const openNewFiche = (clientId: string) => {
    const client = clientMap[clientId];
    setEditing({
      id: generateId(),
      clientId,
      clientNom: client ? `${client.prenom} ${client.nom}` : 'Inconnu',
      dateCreation: new Date().toISOString().split('T')[0],
      motif: '',
      sexe: '',
      age: 0,
      temperature: 0,
      tension: '',
      poids: 0,
      douleur: '',
      typeDouleur: 'Autre',
      siegeDouleur: '',
      diagnostic: '',
      examenPhysique: '',
      bilanVasculaire: '',
      bilanNeurologique: '',
      bilanArticulaire: '',
      bilanMusculaire: '',
      evaluationFonctionnelle: '',
      facteursPsychologiques: '',
      objectifs: '',
      planSoins: '',
      noteComplementaire: '',
    });
    setSeances([]);
  };

  const loadFiche = (fiche: FicheSuivi) => {
    setEditing(fiche);
    // load associated seances from db
    const related = db.fichesSeances.filter(s => s.ficheId === fiche.id);
    setSeances(related.length > 0 ? related : []);
  };

  const validateAndSave = async () => {
    if (!editing) return;
    // simple validations
    if (!editing.clientId) return alert('Client manquant');
    if (!editing.motif) return alert('Motif requis');
    if (!editing.diagnostic) return alert('Diagnostic requis');

    try {
      // Debug logging
      // Debug info removed for production-like cleanup

      // Vérifier que les arrays existent
      if (!db.fichesSuivi) {
        console.error('db.fichesSuivi is undefined!');
        throw new Error('Database not initialized properly');
      }
      if (!db.fichesSeances) {
        console.error('db.fichesSeances is undefined!');
        throw new Error('Database not initialized properly');
      }

      const exists = db.fichesSuivi.some(f => f.id === editing.id);
      console.log('Fiche exists:', exists);
      
      const ficheToSave = exists ? editing : { ...editing, createdBy: currentUser?.id };
      
      if (exists) {
        console.log('Updating fiche:', ficheToSave.id);
        await db.updateFicheSuivi(ficheToSave);
      } else {
        console.log('Adding new fiche:', ficheToSave.id);
        await db.addFicheSuivi(ficheToSave);
      }

      // save seances
      console.log('Saving seances:', seances.length);
      for (const s of seances) {
        const seanceExists = db.fichesSeances.some(x => x.id === s.id);
        const seanceToSave = seanceExists ? s : { ...s, createdBy: currentUser?.id };
        
        console.log(`Seance ${s.id} exists:`, seanceExists);
        if (seanceExists) {
          await db.updateFicheSeance(seanceToSave);
        } else {
          await db.addFicheSeance(seanceToSave);
        }
      }

      alert('Fiche et séances sauvegardées avec succès');
      setEditing(null);
      setSeances([]);
      console.log('Reloading data...');
      await db.reloadData();
      console.log('Data reloaded');
    } catch (err) {
      console.error('Error saving fiche:', err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      alert(`Erreur lors de la sauvegarde: ${errorMsg}`);
    }
  };

  const addSeanceRow = () => {
    if (!editing) return alert('Ouvrir une fiche d\'abord');
    const newS: FicheSeance = { id: generateId(), ficheId: editing.id, date: new Date().toISOString().split('T')[0], traitement: '', observation: '', visaKine: '', visaPatient: '' };
    setSeances(prev => [...prev, newS]);
  };

  const saveSeance = async (s: FicheSeance) => {
    try {
      const seanceExists = db.fichesSeances.some(x => x.id === s.id);
      const seanceToSave = seanceExists ? s : { ...s, createdBy: currentUser?.id };
      
      if (seanceExists) {
        await db.updateFicheSeance(seanceToSave);
      } else {
        await db.addFicheSeance(seanceToSave);
      }
      
      await db.reloadData();
      alert('Séance sauvegardée avec succès');
      setEditingSeanceId(null);
    } catch (err) {
      console.error('Error saving seance:', err);
      alert(`Erreur lors de la sauvegarde de la séance: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    }
  };

  const removeSeance = async (id: string) => {
    if (!confirm('Supprimer cette séance ?')) return;
    try {
      await db.deleteFicheSeance(id);
      setSeances(prev => prev.filter(s => s.id !== id));
      await db.reloadData();
      alert('Séance supprimée avec succès');
    } catch (err) {
      console.error('Error deleting seance:', err);
      alert(`Erreur lors de la suppression: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    }
  };

  const printFiche = () => {
    if (!editing) return;

    const client = clientMap[editing.clientId];
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Impossible d\'ouvrir la fenêtre d\'impression');
      return;
    }

    const dateCreation = new Date(editing.dateCreation).toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const printContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Fiche de Suivi - ${editing.clientNom}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
          }
          
          @media print {
            body {
              background: white;
            }
            .print-container {
              page-break-inside: avoid;
              margin: 0;
              padding: 0;
            }
          }
          
          .print-container {
            background: white;
            padding: 40px;
            margin: 20px;
            max-width: 900px;
            margin-left: auto;
            margin-right: auto;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          
          .header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          
          .header h1 {
            font-size: 24px;
            color: #1e40af;
            margin-bottom: 10px;
          }
          
          .header p {
            color: #666;
            font-size: 14px;
          }
          
          .patient-info {
            background: #f0f9ff;
            border-left: 4px solid #2563eb;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 4px;
          }
          
          .patient-info h3 {
            color: #1e40af;
            margin-bottom: 10px;
            font-size: 14px;
            text-transform: uppercase;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-top: 10px;
          }
          
          .info-item {
            font-size: 13px;
          }
          
          .info-label {
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 3px;
          }
          
          .section {
            margin-bottom: 25px;
            page-break-inside: avoid;
          }
          
          .section-title {
            background: #1e40af;
            color: white;
            padding: 10px 15px;
            font-weight: bold;
            font-size: 13px;
            text-transform: uppercase;
            border-radius: 4px;
            margin-bottom: 12px;
          }
          
          .section-content {
            background: #f8fafc;
            padding: 12px;
            border-left: 3px solid #2563eb;
            border-radius: 4px;
            font-size: 13px;
            line-height: 1.8;
          }
          
          .eva-display {
            background: #fff3cd;
            border: 1px solid #ffc107;
            padding: 15px;
            border-radius: 4px;
            text-align: center;
            margin-bottom: 20px;
          }
          
          .eva-value {
            font-size: 28px;
            font-weight: bold;
            color: #ff6b6b;
            margin: 10px 0;
          }
          
          .eva-label {
            font-weight: bold;
            color: #333;
            font-size: 12px;
          }
          
          .seances-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            font-size: 12px;
          }
          
          .seances-table thead {
            background: #1e40af;
            color: white;
          }
          
          .seances-table th {
            padding: 10px;
            text-align: left;
            font-weight: bold;
            border: 1px solid #ddd;
          }
          
          .seances-table td {
            padding: 10px;
            border: 1px solid #ddd;
          }
          
          .seances-table tbody tr:nth-child(odd) {
            background: #f8fafc;
          }
          
          .seances-table tbody tr:nth-child(even) {
            background: #ffffff;
          }
          
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #666;
            font-size: 11px;
          }
          
          .signature-area {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
          }
          
          .signature-box {
            border-top: 1px solid #333;
            padding-top: 10px;
            min-height: 60px;
          }
          
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            .print-container {
              margin: 0;
              padding: 0;
              box-shadow: none;
              max-width: 100%;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          <!-- Header -->
          <div class="header">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <img src="https://d64gsuwffb70l.cloudfront.net/696faca652fe36008fa92531_1768926542042_42a9b869.png" alt="Logo CTK" style="max-width: 120px; height: auto;">
              <div style="flex: 1; text-align: center;">
                <h1>🏥 Fiche de Suivi de Rééducation Fonctionnelle</h1>
                <p>Centre de Traitement en Kinésithérapie (CTK)</p>
              </div>
              <div style="width: 120px;"></div>
            </div>
            <hr style="border: none; border-top: 2px solid #16a34a; margin: 20px 0;">
          </div>
          
          <!-- Patient Info -->
          <div class="patient-info">
            <h3>📋 Informations du Patient</h3>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Nom & Prénom:</div>
                <div>${editing.clientNom}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Date:</div>
                <div>${dateCreation}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Sexe:</div>
                <div>${editing.sexe === 'M' ? 'Masculin' : editing.sexe === 'F' ? 'Féminin' : 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Âge:</div>
                <div>${editing.age || 'N/A'} ans</div>
              </div>
              <div class="info-item">
                <div class="info-label">Température:</div>
                <div>${editing.temperature || 'N/A'}°C</div>
              </div>
              <div class="info-item">
                <div class="info-label">Tension:</div>
                <div>${editing.tension || 'N/A'} mmHg</div>
              </div>
              <div class="info-item">
                <div class="info-label">Poids:</div>
                <div>${editing.poids || 'N/A'} kg</div>
              </div>
              <div class="info-item">
                <div class="info-label">Adresse:</div>
                <div>${client?.adresse || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Téléphone:</div>
                <div>${client?.telephone || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Profession:</div>
                <div>${client?.profession || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Groupe Sanguin:</div>
                <div>${client?.groupeSanguin || 'N/A'}</div>
              </div>
            </div>
          </div>
          
          <!-- Main Sections -->
          <div class="section">
            <div class="section-title">🎯 Motif de consultation</div>
            <div class="section-content">${editing.motif || '(Vide)'}</div>
          </div>
          
          <div class="section">
            <div class="section-title">💔 Douleur</div>
            <div class="info-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div style="font-size: 13px;">
                <div class="info-label">Description:</div>
                <div style="background: #f8fafc; padding: 8px; border-radius: 3px;">${editing.douleur || '(Vide)'}</div>
              </div>
              <div style="font-size: 13px;">
                <div class="info-label">Type:</div>
                <div style="background: #f8fafc; padding: 8px; border-radius: 3px;">${editing.typeDouleur}</div>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 13px;">
              <div class="info-label">Siège:</div>
              <div style="background: #f8fafc; padding: 8px; border-radius: 3px;">${editing.siegeDouleur || '(Vide)'}</div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">🔍 Diagnostic</div>
            <div class="section-content">${editing.diagnostic || '(Vide)'}</div>
          </div>
          
          <div class="section">
            <div class="section-title">🏥 Examens Cliniques</div>
            <div style="font-size: 13px;">
              <div style="margin-bottom: 15px;">
                <div class="info-label">Examen Physique:</div>
                <div style="background: #f8fafc; padding: 8px; border-radius: 3px; margin-top: 5px;">${editing.examenPhysique || '(Vide)'}</div>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                  <div class="info-label">Bilan Vasculaire:</div>
                  <div style="background: #f8fafc; padding: 8px; border-radius: 3px; margin-top: 5px;">${editing.bilanVasculaire || '(Vide)'}</div>
                </div>
                <div>
                  <div class="info-label">Bilan Neurologique:</div>
                  <div style="background: #f8fafc; padding: 8px; border-radius: 3px; margin-top: 5px;">${editing.bilanNeurologique || '(Vide)'}</div>
                </div>
              </div>
              <div style="margin-top: 15px;">
                <div class="info-label">Bilan Articulaire:</div>
                <div style="background: #f8fafc; padding: 8px; border-radius: 3px; margin-top: 5px;">${editing.bilanArticulaire || '(Vide)'}</div>
              </div>
              <div style="margin-top: 15px;">
                <div class="info-label">Bilan Musculaire:</div>
                <div style="background: #f8fafc; padding: 8px; border-radius: 3px; margin-top: 5px;">${editing.bilanMusculaire || '(Vide)'}</div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">📊 Évaluation Fonctionnelle</div>
            <div class="section-content">${editing.evaluationFonctionnelle || '(Vide)'}</div>
          </div>
          
          <div class="section">
            <div class="section-title">🧠 Facteurs Psychologiques</div>
            <div class="section-content">${editing.facteursPsychologiques || '(Vide)'}</div>
          </div>
          
          <div class="section">
            <div class="section-title">🎯 Objectifs</div>
            <div class="section-content">${editing.objectifs || '(Vide)'}</div>
          </div>
          
          <div class="section">
            <div class="section-title">💊 Plan de Soins</div>
            <div class="section-content">${editing.planSoins || '(Vide)'}</div>
          </div>
          
          <div class="section">
            <div class="section-title">📝 Notes Complémentaires</div>
            <div class="section-content">${editing.noteComplementaire || '(Vide)'}</div>
          </div>
          
          <!-- Seances Table -->
          ${seances.length > 0 ? `
          <div class="section">
            <div class="section-title">📅 Historique des Séances</div>
            <table class="seances-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Traitement</th>
                  <th>Observations</th>
                  <th>Visa Kiné</th>
                  <th>Visa Patient</th>
                </tr>
              </thead>
              <tbody>
                ${seances.map(s => `
                  <tr>
                    <td>${new Date(s.date).toLocaleDateString('fr-FR')}</td>
                    <td>${s.traitement || '-'}</td>
                    <td>${s.observation || '-'}</td>
                    <td>${s.visaKine || '-'}</td>
                    <td>${s.visaPatient || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}
          
          <!-- Signatures -->
          <div class="signature-area">
            <div class="signature-box">
              <div>Signature du Kinésithérapeute</div>
              <div style="margin-top: 40px;"></div>
            </div>
            <div class="signature-box">
              <div>Signature du Patient</div>
              <div style="margin-top: 40px;"></div>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="footer">
            <p>Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
            <p>Clinique de Kinésithérapie CTK - Tous droits réservés</p>
          </div>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
            window.close();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Fiche de Suivi de Rééducation Fonctionnelle</h1>
        <div className="flex gap-2">
          <button className="px-3 py-2 bg-gray-100 rounded" onClick={() => db.reloadData()}>Rafraîchir</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-1 bg-white rounded-xl p-4 shadow">
          <h3 className="font-semibold mb-3">Patients</h3>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {clients.map(c => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b">
                <div>
                  <div className="font-medium">{c.prenom} {c.nom}</div>
                  <div className="text-sm text-gray-500">{c.telephone}</div>
                </div>
                <div className="flex gap-2">
                  <button title="Nouveau" onClick={() => openNewFiche(c.id)} className="p-2 bg-green-500 text-white rounded"><Plus className="w-4 h-4" /></button>
                  <button title="Voir" onClick={() => {
                    const fiche = db.fichesSuivi.find(f => f.clientId === c.id);
                    if (fiche) loadFiche(fiche);
                    else alert('Aucune fiche existante pour ce patient');
                  }} className="p-2 bg-blue-100 rounded"><FileText className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-3 bg-white rounded-xl p-6 shadow">
          {editing ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Fiche: {editing.clientNom}</h2>
                <div className="flex gap-2">
                  <button 
                    onClick={printFiche} 
                    title="Imprimer la fiche"
                    className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    Imprimer
                  </button>
                  <button onClick={validateAndSave} className="px-3 py-2 bg-blue-600 text-white rounded">Enregistrer</button>
                  <button onClick={() => { setEditing(null); setSeances([]); }} className="px-3 py-2 bg-gray-200 rounded">Annuler</button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Informations générales</label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <input className="p-2 border rounded" value={editing.clientNom} readOnly />
                    <input className="p-2 border rounded" value={editing.dateCreation} onChange={(e) => setEditing({...editing, dateCreation: e.target.value})} />
                    <input className="p-2 border rounded col-span-2" value={clientMap[editing.clientId]?.adresse || ''} readOnly />
                    <input className="p-2 border rounded" value={clientMap[editing.clientId]?.profession || ''} readOnly />
                    <input className="p-2 border rounded" value={clientMap[editing.clientId]?.telephone || ''} readOnly />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium">Motif et douleur</label>
                  <textarea className="w-full p-2 border rounded mt-2" value={editing.motif} onChange={(e) => setEditing({...editing, motif: e.target.value})} />

                  <div className="mt-3">
                    <label className="block text-sm">Type de douleur</label>
                    <select className="w-full p-2 border rounded" value={editing.typeDouleur} onChange={(e) => setEditing({...editing, typeDouleur: e.target.value as any})}>
                      {painTypes.map(pt => <option key={pt} value={pt}>{pt}</option>)}
                    </select>
                  </div>

                  <div className="mt-3">
                    <label className="block text-sm">Siège de la douleur</label>
                    <input className="w-full p-2 border rounded" value={editing.siegeDouleur} onChange={(e) => setEditing({...editing, siegeDouleur: e.target.value})} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium">Diagnostic</label>
                  <input className="w-full p-2 border rounded mt-2" value={editing.diagnostic} onChange={(e) => setEditing({...editing, diagnostic: e.target.value})} />
                </div>

                <div>
                  <label className="block text-sm font-medium">Informations du Patient - Mesures</label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <label className="text-xs">Sexe</label>
                      <select className="w-full p-2 border rounded" value={editing.sexe} onChange={(e) => setEditing({...editing, sexe: e.target.value as any})}>
                        <option value="">Sélectionner</option>
                        <option value="M">Masculin</option>
                        <option value="F">Féminin</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs">Âge (ans)</label>
                      <input type="number" className="w-full p-2 border rounded" value={editing.age} onChange={(e) => setEditing({...editing, age: Number(e.target.value)})} />
                    </div>
                    <div>
                      <label className="text-xs">Température (°C)</label>
                      <input type="number" step="0.1" className="w-full p-2 border rounded" value={editing.temperature} onChange={(e) => setEditing({...editing, temperature: Number(e.target.value)})} />
                    </div>
                    <div>
                      <label className="text-xs">Tension (mmHg)</label>
                      <input type="text" placeholder="Ex: 120/80" className="w-full p-2 border rounded" value={editing.tension} onChange={(e) => setEditing({...editing, tension: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-xs">Poids (kg)</label>
                      <input type="number" step="0.1" className="w-full p-2 border rounded" value={editing.poids} onChange={(e) => setEditing({...editing, poids: Number(e.target.value)})} />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium">Examen physique</label>
                  <textarea className="w-full p-2 border rounded mt-2" value={editing.examenPhysique} onChange={(e) => setEditing({...editing, examenPhysique: e.target.value})} />
                </div>

                <div>
                  <label className="block text-sm font-medium">Bilan vasculaire</label>
                  <textarea className="w-full p-2 border rounded mt-2" value={editing.bilanVasculaire} onChange={(e) => setEditing({...editing, bilanVasculaire: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium">Bilan neurologique</label>
                  <textarea className="w-full p-2 border rounded mt-2" value={editing.bilanNeurologique} onChange={(e) => setEditing({...editing, bilanNeurologique: e.target.value})} />
                </div>

                <div>
                  <label className="block text-sm font-medium">Bilan articulaire</label>
                  <textarea className="w-full p-2 border rounded mt-2" value={editing.bilanArticulaire} onChange={(e) => setEditing({...editing, bilanArticulaire: e.target.value})} />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium">Bilan Musculaire</label>
                  <textarea className="w-full p-2 border rounded mt-2" placeholder="Évaluation de la force musculaire et du tonus" value={editing.bilanMusculaire} onChange={(e) => setEditing({...editing, bilanMusculaire: e.target.value})} />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium">Évaluation fonctionnelle</label>
                  <textarea className="w-full p-2 border rounded mt-2" value={editing.evaluationFonctionnelle} onChange={(e) => setEditing({...editing, evaluationFonctionnelle: e.target.value})} />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium">Facteurs psychologiques</label>
                  <textarea className="w-full p-2 border rounded mt-2" value={editing.facteursPsychologiques} onChange={(e) => setEditing({...editing, facteursPsychologiques: e.target.value})} />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium">Objectifs</label>
                  <textarea className="w-full p-2 border rounded mt-2" value={editing.objectifs} onChange={(e) => setEditing({...editing, objectifs: e.target.value})} />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium">Plan de soins</label>
                  <textarea className="w-full p-2 border rounded mt-2" value={editing.planSoins} onChange={(e) => setEditing({...editing, planSoins: e.target.value})} />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium">Notes complémentaires</label>
                  <textarea className="w-full p-2 border rounded mt-2" value={editing.noteComplementaire} onChange={(e) => setEditing({...editing, noteComplementaire: e.target.value})} />
                </div>
              </div>

              <div className="mt-6">
                <h3 className="font-semibold">Tableau des séances</h3>
                <div className="mt-3 space-y-2">
                  {seances.map(s => (
                    <div key={s.id} className="border rounded p-3 grid grid-cols-1 md:grid-cols-5 gap-2 items-center">
                      <input type="date" className="p-2 border rounded" value={s.date} onChange={(e) => setSeances(prev => prev.map(x => x.id === s.id ? {...x, date: e.target.value} : x))} />
                      <input className="p-2 border rounded md:col-span-2" placeholder="Traitement" value={s.traitement} onChange={(e) => setSeances(prev => prev.map(x => x.id === s.id ? {...x, traitement: e.target.value} : x))} />
                      <input className="p-2 border rounded" placeholder="Observation" value={s.observation} onChange={(e) => setSeances(prev => prev.map(x => x.id === s.id ? {...x, observation: e.target.value} : x))} />
                      <div className="flex gap-2 md:col-span-2 justify-end">
                        <input className="p-2 border rounded" placeholder="Visa Kiné" value={s.visaKine} onChange={(e) => setSeances(prev => prev.map(x => x.id === s.id ? {...x, visaKine: e.target.value} : x))} />
                        <input className="p-2 border rounded" placeholder="Visa Patient" value={s.visaPatient} onChange={(e) => setSeances(prev => prev.map(x => x.id === s.id ? {...x, visaPatient: e.target.value} : x))} />
                        <button onClick={() => saveSeance(s)} className="px-3 py-1 bg-green-600 text-white rounded">Save</button>
                        <button onClick={() => removeSeance(s.id)} className="px-3 py-1 bg-red-500 text-white rounded">Delete</button>
                      </div>
                    </div>
                  ))}

                  <div className="mt-2">
                    <button onClick={addSeanceRow} className="px-3 py-2 bg-green-600 text-white rounded"><Plus className="w-4 h-4 inline" /> Ajouter séance</button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">Sélectionnez un patient ou ouvrez une fiche existante pour commencer.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FicheSuiviPage;
