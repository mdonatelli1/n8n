# n8n - Instance self-hébergée

Ce dépôt contient la configuration Docker Compose pour faire tourner une instance locale ou distante de **n8n**, plateforme d’automatisation de workflows.

---

## Démarrage

```bash
docker compose up -d
```

L’interface de n8n sera accessible via l’URL fournie par **Cloudflare Tunnel** (voir section ci-dessous).

---

## Services inclus

- **n8n** : moteur d'automatisation
- **postgres** : base de données pour stocker les workflows
- **qdrant** : moteur de recherche vectorielle pour enrichir tes workflows
- **cloudflared** : expose n8n sur Internet via un tunnel sécurisé (sans besoin de nom de domaine)

---

## Accès à n8n via Cloudflare Tunnel

Le conteneur `cloudflared` expose automatiquement le port `5678` de n8n à une URL publique temporaire.

Pour récupérer cette URL, exécute :

```bash
docker compose logs -f cloudflared
```

Cette URL change à chaque redémarrage du tunnel et doit être mise à jour dans les applications utilisant des webhooks.

---

## Variables d’environnement

Le fichier `.env` contient les variables nécessaires à la configuration de n8n, PostgreSQL et du tunnel Cloudflare.

| Variable                         | Description                                                             |
|---------------------------------|-------------------------------------------------------------------------|
| `POSTGRES_USER`                  | Nom d’utilisateur de la base de données                                 |
| `POSTGRES_PASSWORD`              | Mot de passe PostgreSQL                                                 |
| `POSTGRES_DB`                   | Nom de la base de données                                               |
| `N8N_ENCRYPTION_KEY`             | Clé de chiffrement pour les données sensibles                           |
| `N8N_USER_MANAGEMENT_JWT_SECRET` | Clé utilisée pour signer les tokens JWT (authentification utilisateurs) |
| `WEBHOOK_URL`                   | URL publique où n8n reçoit les webhooks (URL du tunnel Cloudflare)      |
| `GENERIC_TIMEZONE`               | Fuseau horaire utilisé par les workflows et les déclencheurs programmés |

---

## Données persistantes

Les données critiques sont conservées localement pour assurer la continuité de service :

- Les **workflows**, **identifiants** et **configurations** de n8n sont stockés dans `./n8n_data`.
- La base PostgreSQL sauvegarde ses données dans `./postgres_data`.
- Qdrant conserve ses fichiers et index dans `./qdrant_data`.

Ainsi, même en cas de redémarrage ou mise à jour des conteneurs, l’état est préservé.

---

## À savoir

- Aucun nom de domaine requis
- Aucun certificat HTTPS à gérer
- Webhooks accessibles immédiatement via l’URL publique générée par Cloudflare Tunnel
