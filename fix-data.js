// Script pour réinitialiser complètement les données et résoudre le problème d'application vide
console.log('🔧 Réinitialisation complète des données CTK...');

// Effacer toutes les données CTK du localStorage
const ctkKeys = [
  'ctk_clients',
  'ctk_personnel', 
  'ctk_soins',
  'ctk_abonnements',
  'ctk_paiements',
  'ctk_transactions',
  'ctk_stocks',
  'ctk_mouvements',
  'ctk_rendezvous',
  'ctk_utilisateurs'
];

ctkKeys.forEach(key => {
  localStorage.removeItem(key);
  console.log(`✅ ${key} supprimé`);
});

console.log('🎉 Données réinitialisées avec succès !');
console.log('🔄 Actualisez la page pour voir les données par défaut.');
console.log('');
console.log('📝 Identifiants de connexion:');
console.log('Admin: admin@ctk.ci / admin123');
console.log('Agent: agent@ctk.ci / agent123');
