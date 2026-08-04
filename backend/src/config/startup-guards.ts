const INSECURE_DEFAULTS = [
  'god-rogwebservice-dev-secret',
  'change-moi-en-production-avec-une-vraie-cle-secrete',
  'change-moi-en-production-avec-une-vraie-cle-secrete-aleatoire',
];

/**
 * Empêche un déploiement en production de démarrer silencieusement avec
 * des secrets par défaut ou absents — erreur explicite au démarrage plutôt
 * qu'une faille de sécurité découverte plus tard. N'a aucun effet en
 * développement (NODE_ENV !== 'production').
 */
export function assertProductionSecretsAreSet(): void {
  if (process.env.NODE_ENV !== 'production') return;

  const errors: string[] = [];

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || INSECURE_DEFAULTS.includes(jwtSecret)) {
    errors.push('JWT_SECRET doit être défini avec une valeur secrète unique en production.');
  }

  if (process.env.DB_TYPE === 'postgres') {
    if (!process.env.DB_PASSWORD) {
      errors.push('DB_PASSWORD doit être défini en production (DB_TYPE=postgres).');
    }
  }

  if (errors.length > 0) {
    // eslint-disable-next-line no-console
    console.error('\n🚫 Démarrage refusé — configuration de production incomplète :\n');
    errors.forEach((e) => console.error(`   - ${e}`));
    console.error('\nVoir backend/.env.example pour la liste complète des variables attendues.\n');
    process.exit(1);
  }
}
