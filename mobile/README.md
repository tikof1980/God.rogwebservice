# GOD.ROGWEBSERVICE — App mobile (Flutter)

## Pourquoi un wrapper plutôt qu'une app 100% native

Réécrire toute l'interface (Super Dashboard, espace entreprise, IA, paiements...)
en Flutter aurait dupliqué tout le travail déjà fait côté web — et créé deux
bases de code à maintenir en parallèle pour chaque futur module. Le choix
professionnel ici : un **wrapper natif léger** autour de la PWA déjà construite.

Ce que ça donne concrètement :
- Une vraie app sur le Play Store / App Store, installable normalement
- 100% du code métier (auth, dashboard, IA, paiements...) reste dans le
  frontend Next.js déjà testé — une seule base à maintenir
- Bouton retour Android géré nativement, ouverture des liens `tel:`/`mailto:`/
  WhatsApp dans les apps natives, écran d'erreur hors-ligne avec bouton "Réessayer"
- Coût de développement et de maintenance très inférieur à une réécriture complète

## ⚠️ Important : ce qui a été fait ici, et ce qui reste à faire chez vous

Flutter n'est pas installé dans cet environnement de développement, donc
**ce projet n'a pas pu être scaffoldé ni compilé ici**. Ce qui est fourni :
- `lib/main.dart` — le code complet du wrapper (WebView, gestion d'erreurs,
  retour Android, liens externes)
- `pubspec.yaml` — les dépendances nécessaires

Ce qui **manque** et ne peut être généré que par le SDK Flutter lui-même
(fichiers Gradle, projet Xcode, manifestes, icônes plateforme...) :

### Étapes à faire de votre côté

1. Installer Flutter : https://docs.flutter.dev/get-started/install
2. Créer le squelette du projet :
   ```bash
   flutter create --org ci.rogwebservice god_rogwebservice
   ```
3. Remplacer les fichiers générés `lib/main.dart` et `pubspec.yaml` par ceux
   fournis ici
4. Installer les dépendances :
   ```bash
   flutter pub get
   ```
5. Dans `lib/main.dart`, mettre à jour `kAppUrl` avec le vrai domaine de
   production une fois déployé (voir `k8s/40-ingress.yaml`)
6. Nom de l'app et icône :
   - Android : `android/app/src/main/AndroidManifest.xml` (`android:label`)
     et remplacer les icônes dans `android/app/src/main/res/mipmap-*/`
   - iOS : `ios/Runner/Info.plist` (`CFBundleName`) et `ios/Runner/Assets.xcassets`
   - Les icônes PWA déjà générées (`frontend/public/icon-512.png`) peuvent
     servir de base — un outil comme https://icon.kitchen permet de générer
     toutes les tailles plateforme à partir d'une seule image
7. Tester :
   ```bash
   flutter run
   ```
8. Build de production :
   ```bash
   flutter build apk --release      # Android
   flutter build appbundle --release # pour publication Play Store
   flutter build ios --release       # iOS (nécessite macOS + Xcode)
   ```

### Permissions

`flutter create` génère par défaut la permission `INTERNET` sur Android,
nécessaire au fonctionnement de la WebView — rien à ajouter normalement.

### Notifications push (amélioration future)

Pour aller plus loin qu'un simple wrapper, l'étape suivante serait d'ajouter
Firebase Cloud Messaging pour recevoir des notifications push natives (les
rappels de rendez-vous, alertes d'expiration, etc. déjà générés côté backend
dans le module Notifications pourraient y être branchés en plus du canal
WhatsApp).
