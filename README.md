# n8n - Instance self-hosted

Ce dépôt contient la configuration Docker Compose pour faire tourner une instance locale ou distante de **n8n**, plateforme d’automatisation de workflows.

## Démarrage

```bash
docker compose up -d
```

L’interface de n8n sera accessible via l’URL fournie par **Cloudflare Tunnel** (voir ci-dessous).

## Services inclus

-   **n8n** : moteur d'automatisation
-   **postgres** : base de données pour stocker les workflows
-   **ollama** : moteur local d'IA compatible avec n8n
-   **cloudflared** : expose n8n sur Internet via un tunnel sécurisé (sans besoin de nom de domaine)

## Accès à n8n via Cloudflare Tunnel

Le conteneur `cloudflared` expose automatiquement le port `5678` de n8n à une URL publique temporaire.

La récupération de l'URL s’effectue en exécutant :

```bash
docker compose logs -f cloudflared
```

Cette URL change à chaque redémarrage du tunnel et doit être mise à jour dans les applications utilisant des webhooks.

## Variables d’environnement

Le fichier `.env` contient les variables nécessaires à la configuration de n8n, de la base de données PostgreSQL et du tunnel Cloudflare.

| Variable                         | Description                                                             |
| -------------------------------- | ----------------------------------------------------------------------- |
| `POSTGRES_USER`                  | Nom d’utilisateur de la base de données                                 |
| `POSTGRES_PASSWORD`              | Mot de passe PostgreSQL                                                 |
| `POSTGRES_DB`                    | Nom de la base de données                                               |
| `N8N_ENCRYPTION_KEY`             | Clé de chiffrement pour les données sensibles                           |
| `N8N_USER_MANAGEMENT_JWT_SECRET` | Clé utilisée pour signer les tokens JWT (authentification utilisateurs) |
| `GENERIC_TIMEZONE`               | Fuseau horaire utilisé par les workflows et les déclencheurs programmés |

## Données persistantes

Les données critiques sont conservées localement pour assurer la continuité de service.

-   Les **workflows**, **identifiants** et **configurations** de n8n se trouvent dans `./n8n_data`.
-   La base PostgreSQL stocke ses **données** dans `./postgres_data`.
-   Quant à Ollama, ses **fichiers** et **paramètres** sont sauvegardés dans `./ollama_data`.

Ainsi, même si les conteneurs redémarrent ou sont mis à jour, l’état de chaque service est préservé.

## À savoir

-   Aucun nom de domaine requis
-   Aucun certificat HTTPS à gérer
-   Webhooks accessibles immédiatement via l’URL publique générée
