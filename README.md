## n8n - Instance self-hosted

Ce dépôt contient la configuration Docker Compose pour faire tourner une instance locale ou distante de n8n (workflow automation).

## Démarrage

```bash
docker compose up -d
```

Accès : [http://localhost:5678](http://localhost:5678)

Connexion :

-   **Utilisateur** : `admin`
-   **Mot de passe** : `supersecret`

## Variables d'environnement importantes

| Variable           | Valeur                  | Description                     |
| ------------------ | ----------------------- | ------------------------------- |
| `N8N_HOST`         | `localhost`             | Hôte utilisé pour les URLs      |
| `N8N_PORT`         | `5678`                  | Port exposé                     |
| `WEBHOOK_URL`      | `http://localhost:5678` | URL utilisée pour les callbacks |
| `N8N_BASIC_AUTH_*` | `admin / supersecret`   | Authentification de l'interface |
| `GENERIC_TIMEZONE` | `Europe/Paris`          | Fuseau horaire pour les tâches  |

## Données persistantes

Les workflows, identifiants et configurations sont stockés dans `./n8n_data`.

## Webhooks en local

Pour exposer n8n à Internet (par exemple pour tester des webhooks) :

```bash
ngrok http 5678
```

Puis mettre dans les variables :

```env
WEBHOOK_URL=https://xxxxx.ngrok.io/
```
