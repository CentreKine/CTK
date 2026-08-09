// Activity Report Generation System
import { 
  Client, Paiement, FicheSuivi, Transaction, Stock, 
  RendezVous, Personnel, User, formatDate, formatMontant 
} from './ctk-data';

export interface ActivityReport {
  id: string;
  date: string;
  type: 'daily' | 'weekly' | 'monthly';
  generatedBy: string;
  generatedAt: string;
  summary: {
    totalClients: number;
    totalPaiements: number;
    totalAmount: number;
    totalFiches: number;
    totalTransactions: number;
    totalStockMovements: number;
  };
  activities: ActivityLog[];
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'PRINT' | 'LOGIN';
  entity: string;
  entityType: string;
  userId: string;
  userName: string;
  details: string;
}

export class ReportGenerator {
  static generateDailyReport(
    clients: Client[],
    paiements: Paiement[],
    fiches: FicheSuivi[],
    transactions: Transaction[],
    stocks: Stock[],
    userId: string,
    userName: string
  ): ActivityReport {
    const today = new Date().toISOString().split('T')[0];
    
    const todaysPaiements = paiements.filter(p => p.date === today);
    const todaysFiches = fiches.filter(f => f.dateCreation === today);
    const todaysTransactions = transactions.filter(t => t.date === today);
    
    const totalPaiementsAmount = todaysPaiements.reduce((sum, p) => sum + p.montant, 0);

    return {
      id: `RPT-${today}-${Math.random().toString(36).substr(2, 9)}`,
      date: today,
      type: 'daily',
      generatedBy: userId,
      generatedAt: new Date().toISOString(),
      summary: {
        totalClients: clients.length,
        totalPaiements: todaysPaiements.length,
        totalAmount: totalPaiementsAmount,
        totalFiches: todaysFiches.length,
        totalTransactions: todaysTransactions.length,
        totalStockMovements: 0
      },
      activities: ReportGenerator.generateActivityLogs(
        todaysPaiements,
        todaysFiches,
        todaysTransactions,
        userName
      ),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  static generateWeeklyReport(
    clients: Client[],
    paiements: Paiement[],
    fiches: FicheSuivi[],
    transactions: Transaction[],
    stocks: Stock[],
    userId: string,
    userName: string
  ): ActivityReport {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekStart = weekAgo.toISOString().split('T')[0];
    const weekEnd = today.toISOString().split('T')[0];

    const weeksPaiements = paiements.filter(p => p.date >= weekStart && p.date <= weekEnd);
    const weeksFiches = fiches.filter(f => f.dateCreation >= weekStart && f.dateCreation <= weekEnd);
    const weeksTransactions = transactions.filter(t => t.date >= weekStart && t.date <= weekEnd);

    const totalPaiementsAmount = weeksPaiements.reduce((sum, p) => sum + p.montant, 0);

    return {
      id: `RPT-WEEK-${weekStart}-${Math.random().toString(36).substr(2, 9)}`,
      date: `${weekStart} à ${weekEnd}`,
      type: 'weekly',
      generatedBy: userId,
      generatedAt: new Date().toISOString(),
      summary: {
        totalClients: clients.length,
        totalPaiements: weeksPaiements.length,
        totalAmount: totalPaiementsAmount,
        totalFiches: weeksFiches.length,
        totalTransactions: weeksTransactions.length,
        totalStockMovements: 0
      },
      activities: ReportGenerator.generateActivityLogs(
        weeksPaiements,
        weeksFiches,
        weeksTransactions,
        userName
      ),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  static generateMonthlyReport(
    clients: Client[],
    paiements: Paiement[],
    fiches: FicheSuivi[],
    transactions: Transaction[],
    stocks: Stock[],
    userId: string,
    userName: string
  ): ActivityReport {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const monthEnd = today.toISOString().split('T')[0];

    const monthsPaiements = paiements.filter(p => p.date >= monthStart && p.date <= monthEnd);
    const monthsFiches = fiches.filter(f => f.dateCreation >= monthStart && f.dateCreation <= monthEnd);
    const monthsTransactions = transactions.filter(t => t.date >= monthStart && t.date <= monthEnd);

    const totalPaiementsAmount = monthsPaiements.reduce((sum, p) => sum + p.montant, 0);

    return {
      id: `RPT-MONTH-${monthStart}-${Math.random().toString(36).substr(2, 9)}`,
      date: `Mois de ${ReportGenerator.getMonthName(today.getMonth())} ${today.getFullYear()}`,
      type: 'monthly',
      generatedBy: userId,
      generatedAt: new Date().toISOString(),
      summary: {
        totalClients: clients.length,
        totalPaiements: monthsPaiements.length,
        totalAmount: totalPaiementsAmount,
        totalFiches: monthsFiches.length,
        totalTransactions: monthsTransactions.length,
        totalStockMovements: 0
      },
      activities: ReportGenerator.generateActivityLogs(
        monthsPaiements,
        monthsFiches,
        monthsTransactions,
        userName
      ),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  private static generateActivityLogs(
    paiements: Paiement[],
    fiches: FicheSuivi[],
    transactions: Transaction[],
    userName: string
  ): ActivityLog[] {
    const logs: ActivityLog[] = [];

    paiements.forEach(p => {
      logs.push({
        id: `LOG-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: p.date,
        action: 'CREATE',
        entity: `Paiement ${formatMontant(p.montant)}`,
        entityType: 'PAIEMENT',
        userId: '',
        userName: userName,
        details: `Paiement de ${formatMontant(p.montant)} mode: ${p.modePaiement}`
      });
    });

    fiches.forEach(f => {
      logs.push({
        id: `LOG-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: f.dateCreation,
        action: 'CREATE',
        entity: `Fiche Suivi - ${f.clientNom}`,
        entityType: 'FICHE_SUIVI',
        userId: '',
        userName: userName,
        details: `Fiche créée pour motif: ${f.motif}`
      });
    });

    transactions.forEach(t => {
      logs.push({
        id: `LOG-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: t.date,
        action: 'CREATE',
        entity: `Transaction ${t.type}`,
        entityType: 'TRANSACTION',
        userId: '',
        userName: userName,
        details: `${t.type === 'entree' ? 'Entrée' : 'Sortie'}: ${formatMontant(t.montant)} - ${t.description}`
      });
    });

    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  static generateHTMLReport(report: ActivityReport): string {
    const logo = 'https://d64gsuwffb70l.cloudfront.net/696faca652fe36008fa92531_1768926542042_42a9b869.png';
    
    let activitiesHTML = report.activities.map(activity => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${activity.timestamp}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${activity.action}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${activity.entity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${activity.userName}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; font-size: 12px;">${activity.details}</td>
      </tr>
    `).join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #16a34a; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { max-width: 150px; height: auto; }
        .title { font-size: 24px; font-weight: bold; color: #1f2937; }
        .subtitle { font-size: 13px; color: #666; margin-top: 3px; }
        .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
        .info-box { background: #f3f4f6; padding: 15px; border-radius: 6px; border-left: 4px solid #16a34a; }
        .info-label { font-size: 11px; color: #666; text-transform: uppercase; }
        .info-value { font-size: 18px; font-weight: bold; color: #16a34a; margin-top: 5px; }
        .summary-box { background: #f0fdf4; border: 2px solid #16a34a; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .summary-title { font-size: 16px; font-weight: bold; color: #16a34a; margin-bottom: 15px; }
        .summary-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 15px; }
        .summary-item { text-align: center; }
        .summary-item-label { font-size: 10px; color: #666; text-transform: uppercase; }
        .summary-item-value { font-size: 18px; font-weight: bold; color: #16a34a; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #16a34a; color: white; padding: 12px; text-align: left; font-weight: bold; font-size: 12px; }
        td { padding: 10px; font-size: 12px; }
        tr:nth-child(even) { background: #f9fafb; }
        .footer { text-align: center; font-size: 11px; color: #999; padding-top: 20px; border-top: 1px solid #ddd; margin-top: 30px; }
        @media print { body { background: white; } }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div><img src="${logo}" alt="Logo" class="logo"></div>
          <div>
            <div class="title">📊 Rapport d'Activité</div>
            <div class="subtitle">CTK - Centre de Traitement en Kinésithérapie</div>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-box">
            <div class="info-label">Période</div>
            <div class="info-value">${report.type === 'daily' ? '📅 Jour' : report.type === 'weekly' ? '📆 Semaine' : '📈 Mois'}</div>
          </div>
          <div class="info-box">
            <div class="info-label">Date</div>
            <div class="info-value">${report.date}</div>
          </div>
          <div class="info-box">
            <div class="info-label">Généré par</div>
            <div class="info-value">${report.generatedBy}</div>
          </div>
        </div>

        <div class="summary-box">
          <div class="summary-title">✨ Résumé des Activités</div>
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-item-label">👥 Clients</div>
              <div class="summary-item-value">${report.summary.totalClients}</div>
            </div>
            <div class="summary-item">
              <div class="summary-item-label">💳 Paiements</div>
              <div class="summary-item-value">${report.summary.totalPaiements}</div>
            </div>
            <div class="summary-item">
              <div class="summary-item-label">💰 Montant</div>
              <div class="summary-item-value">${formatMontant(report.summary.totalAmount)}</div>
            </div>
            <div class="summary-item">
              <div class="summary-item-label">📋 Fiches</div>
              <div class="summary-item-value">${report.summary.totalFiches}</div>
            </div>
            <div class="summary-item">
              <div class="summary-item-label">📊 Transactions</div>
              <div class="summary-item-value">${report.summary.totalTransactions}</div>
            </div>
            <div class="summary-item">
              <div class="summary-item-label">⏰ Généré</div>
              <div class="summary-item-value">${formatDate(report.generatedAt).split(' ')[0]}</div>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Action</th>
              <th>Entité</th>
              <th>Utilisateur</th>
              <th>Détails</th>
            </tr>
          </thead>
          <tbody>
            ${activitiesHTML || '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #999;">Aucune activité</td></tr>'}
          </tbody>
        </table>

        <div class="footer">
          <p>Rapport généré le ${new Date().toLocaleString('fr-FR')}</p>
          <p>CTK - Centre de Traitement en Kinésithérapie | Document Confidentiel</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  static printReport(report: ActivityReport): void {
    const html = ReportGenerator.generateHTMLReport(report);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    }
  }

  static downloadReportAsHTML(report: ActivityReport): void {
    const html = ReportGenerator.generateHTMLReport(report);
    const blob = new Blob([html], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-activite-${report.date.replace(/\s+/g, '-')}.html`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  private static getMonthName(month: number): string {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months[month];
  }
}
