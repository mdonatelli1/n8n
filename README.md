# n8n - Instance self-hébergée (v2.0)

Ce dépôt contient la configuration Docker Compose pour faire tourner une instance locale ou distante de **n8n v2.0**, plateforme d'automatisation de workflows.

---

## 🚀 Démarrage rapide

```bash
docker compose up -d
```

L'interface de n8n sera accessible via l'URL fournie par **Cloudflare Tunnel** (voir section ci-dessous).

---

## 📦 Services inclus

- **n8n** : moteur d'automatisation (v2.0+)
- **n8n-runner-js** : exécuteur de code isolé pour les Code nodes (obligatoire v2.0)
- **postgres** : base de données pour stocker les workflows
- **qdrant** : moteur de recherche vectorielle pour enrichir tes workflows
- **ollama** : modèles LLM locaux pour l'IA
- **cloudflared** : expose n8n sur Internet via un tunnel sécurisé (sans besoin de nom de domaine)

---

## 🏷️ Versions des images

`postgres`, `n8n` et `n8n-runner-js` sont pinnés dans le `docker-compose.yml`, pas laissés en `latest`. C'est volontaire : n8n publie régulièrement des breaking changes entre versions majeures (voir la section Ressources), et un `docker compose pull` non maîtrisé pourrait basculer silencieusement sur une version incompatible.

⚠️ **Piège à éviter :** les tags numériques de `n8nio/n8n` (ex. `2.25.3`) et de `n8nio/runners` (ex. `2.26.9`) ne sont **pas synchronisés** entre les deux images. Choisir le même numéro à la main pour les deux ne garantit pas leur compatibilité, et un numéro inventé (comme `2.0`, qui n'existe pas en tant que tag) fait simplement échouer le `docker compose up`.

C'est pourquoi ce projet utilise le tag `stable` sur les deux images :

```yaml
n8n:
    image: n8nio/n8n:stable
...
n8n-runner-js:
    image: n8nio/runners:stable
```

`stable` est publié conjointement par l'équipe n8n sur les deux images pour garantir leur compatibilité mutuelle, tout en évitant les breaking changes non testés que `latest` peut introduire du jour au lendemain.

Avant de vérifier la version résolue par `stable` :

```bash
# Vérifier la version actuellement installée
docker compose exec n8n n8n --version
```

Si tu veux un jour figer une version numérique exacte plutôt que `stable`, vérifie d'abord sur Docker Hub que le numéro choisi existe bien pour les **deux** images (https://hub.docker.com/r/n8nio/n8n/tags et https://hub.docker.com/r/n8nio/runners/tags) avant de modifier le compose, plutôt que de supposer qu'ils correspondent.

`cloudflared`, `qdrant` et `ollama` restent en `latest`, le risque de breaking change y étant nettement plus faible.

---

## 🌐 Accès à n8n via Cloudflare Tunnel

Le conteneur `cloudflared` expose automatiquement le port `5678` de n8n à une URL publique temporaire.

Pour récupérer cette URL, exécute :

```bash
docker compose logs -f cloudflared
```

⚠️ **Important :** Cette URL change à chaque redémarrage du tunnel et doit être mise à jour dans :
- La variable `WEBHOOK_URL` du fichier `.env`
- Les applications externes utilisant des webhooks n8n

---

## ⚙️ Variables d'environnement

Le fichier `.env` contient les variables nécessaires à la configuration de n8n, PostgreSQL et des task runners.

### Variables obligatoires

| Variable                         | Description                                                             |
|---------------------------------|-------------------------------------------------------------------------|
| `POSTGRES_USER`                  | Nom d'utilisateur de la base de données                                 |
| `POSTGRES_PASSWORD`              | Mot de passe PostgreSQL                                                 |
| `POSTGRES_DB`                   | Nom de la base de données                                               |
| `N8N_ENCRYPTION_KEY`             | Clé de chiffrement pour les données sensibles                           |
| `N8N_USER_MANAGEMENT_JWT_SECRET` | Clé utilisée pour signer les tokens JWT (authentification utilisateurs) |
| `N8N_RUNNERS_AUTH_TOKEN`         | **[v2.0]** Token de sécurisation entre n8n et les task runners         |
| `WEBHOOK_URL`                   | URL publique où n8n reçoit les webhooks (URL du tunnel Cloudflare)      |
| `GENERIC_TIMEZONE`               | Fuseau horaire utilisé par les workflows (ex: `Europe/Paris`)           |

### Variables fixées dans le compose (non configurables via .env)

Ces valeurs sont codées en dur dans `docker-compose.yml` et n'ont pas besoin d'être dans `.env` :

| Variable                              | Valeur      | Raison                                                        |
|----------------------------------------|-------------|----------------------------------------------------------------|
| `N8N_PROXY_HOPS`                       | `1`         | Nécessaire car n8n est derrière le tunnel Cloudflare           |
| `N8N_DIAGNOSTICS_ENABLED`              | `false`     | Désactive la télémétrie                                        |
| `N8N_PERSONALIZATION_ENABLED`          | `false`     | Désactive l'écran de personnalisation au premier lancement     |
| `N8N_RUNNERS_MODE`                     | `external`  | Le runner tourne dans un conteneur séparé                      |
| `N8N_RUNNERS_BROKER_LISTEN_ADDRESS`    | `0.0.0.0`   | Permet au runner de joindre n8n depuis un autre conteneur      |
| `N8N_SKIP_AUTH_ON_OAUTH_CALLBACK`      | `false`     | Authentification requise sur les callbacks OAuth               |

### Variables optionnelles

```bash
# Autoriser l'accès aux variables d'env depuis les Code nodes (déconseillé)
# N8N_BLOCK_ENV_ACCESS_IN_NODE=false

# Autoriser les nodes ExecuteCommand et LocalFileTrigger (risque sécurité)
# NODES_EXCLUDE="[]"

# Restreindre l'accès fichiers aux workflows
# N8N_RESTRICT_FILE_ACCESS_TO=/home/node/.n8n-files
```

---

## 💾 Données persistantes

Les données critiques sont conservées localement pour assurer la continuité de service :

- **`./.n8n`** → Workflows, identifiants, configurations et **fichiers binaires** de n8n
- **`./postgres_data`** → Base de données PostgreSQL
- **`./qdrant_storage`** → Index et données vectorielles Qdrant
- **`./.ollama`** → Modèles LLM téléchargés par Ollama

⚠️ **Nouveau en v2.0 :** Les fichiers binaires des workflows sont maintenant stockés sur le système de fichiers (`.n8n/binaryData/`) au lieu de la mémoire, ce qui améliore les performances mais nécessite plus d'espace disque.

⚠️ **Permissions :** n8n tourne avec l'utilisateur `node` (uid 1000) dans le conteneur. Si `./.n8n` a été créé par un autre utilisateur (root par exemple), n8n peut échouer au démarrage avec une erreur de permission. Corrige avec :

```bash
sudo chown -R 1000:1000 ./.n8n
```

### Vérifier l'espace disque utilisé

```bash
du -sh .n8n/binaryData/
df -h
```

---

## 🩺 Ordre de démarrage et healthchecks

Pour éviter les échecs de connexion au redémarrage (par exemple après un reboot du serveur), les services dépendent les uns des autres via des healthchecks plutôt qu'un simple `depends_on` :

- **n8n** attend que **postgres** soit `healthy` (base réellement prête à accepter des connexions, pas juste le conteneur démarré).
- **n8n-runner-js** et **cloudflared** attendent que **n8n** soit `healthy` (API répondant sur `/healthz`).

Vérifier le statut de santé d'un conteneur :

```bash
docker inspect --format='{{.State.Health.Status}}' <nom_du_conteneur>
```

La réponse attendue est `healthy`. Si un service reste bloqué sur `starting` ou passe à `unhealthy`, regarde ses logs avant de chercher plus loin :

```bash
docker compose logs <nom_du_service>
```

---

## 🔐 Sécurité (nouveautés v2.0)

### Task Runners

Les **task runners** isolent l'exécution du code JavaScript/Python pour plus de sécurité. En v2.0, ils sont **obligatoires** :

- Toutes les exécutions de Code nodes passent par le service `n8n-runner-js`
- Communication sécurisée via le token `N8N_RUNNERS_AUTH_TOKEN`
- Isolation complète du processus principal n8n

### OAuth Callbacks

Par défaut, l'authentification est maintenant **requise** sur les callbacks OAuth :
- `N8N_SKIP_AUTH_ON_OAUTH_CALLBACK=false` (défini explicitement dans cette config)
- Assure que seuls les utilisateurs authentifiés peuvent finaliser les flux OAuth

---

## 🛠️ Commandes utiles

### Gestion des conteneurs

```bash
# Voir l'état des services
docker compose ps

# Suivre les logs en temps réel
docker compose logs -f n8n n8n-runner-js

# Redémarrer n8n uniquement
docker compose restart n8n

# Arrêter tous les services
docker compose down

# Nettoyer les anciennes images
docker image prune -a
```

### Monitoring

```bash
# Vérifier la version de n8n
docker compose exec n8n n8n --version

# Utilisation mémoire des conteneurs
docker stats --no-stream

# Vérifier le statut healthy de postgres et n8n
docker inspect --format='{{.State.Health.Status}}' postgres
docker inspect --format='{{.State.Health.Status}}' n8n

# Vérifier la connexion entre n8n et le runner
docker compose logs n8n-runner-js | grep -i "connected"
```

---

## 🐛 Dépannage

### Le runner ne se connecte pas

Vérifier d'abord que n8n est bien `healthy` avant de chercher côté runner, puisque `n8n-runner-js` attend ce statut pour démarrer :

```bash
docker inspect --format='{{.State.Health.Status}}' n8n
```

Puis vérifier le token et la connectivité réseau :

```bash
# Vérifier que le token est identique
docker compose exec n8n env | grep N8N_RUNNERS_AUTH_TOKEN
docker compose exec n8n-runner-js env | grep N8N_RUNNERS_AUTH_TOKEN

# Tester la communication réseau
docker compose exec n8n ping n8n-runner-js
```

### Espace disque insuffisant

```bash
# Nettoyer les anciennes exécutions dans l'interface n8n
# Workflow > Executions > Delete old executions

# Ou via la ligne de commande
docker compose exec n8n n8n execution:prune --older-than=30
```

### Tunnel Cloudflare qui redémarre

L'URL change à chaque redémarrage. Pour une URL fixe, considère :
- Utiliser un tunnel Cloudflare nommé (configuration Cloudflare Zero Trust)
- Ou exposer n8n avec un reverse proxy (Nginx, Traefik) + domaine fixe

### Ollama consomme trop de mémoire

Le service `ollama` a une limite mémoire fixée à 6G dans le compose. Si un modèle chargé dépasse cette limite, le conteneur sera arrêté par Docker plutôt que de faire un OOM sur l'hôte entier. Ajuste la limite dans `docker-compose.yml` selon les ressources disponibles sur le VPS et la taille des modèles utilisés.

---

## 📚 Ressources

- [Documentation officielle n8n](https://docs.n8n.io/)
- [Breaking changes v2.0](https://docs.n8n.io/2-0-breaking-changes/)
- [Configuration des task runners](https://docs.n8n.io/hosting/configuration/task-runners/)
- [Forum communautaire](https://community.n8n.io/)

---

## ✅ À savoir

- ✅ Aucun nom de domaine requis
- ✅ Aucun certificat HTTPS à gérer
- ✅ Webhooks accessibles immédiatement via l'URL publique générée par Cloudflare Tunnel
- ✅ **[v2.0]** Exécution de code isolée et sécurisée via task runners
- ✅ **[v2.0]** Stockage binaire optimisé sur disque
- ✅ **[v2.0]** OAuth sécurisé par défaut
- ✅ Redémarrage automatique après reboot du serveur (`restart: unless-stopped` sur tous les services)
- ✅ Ordre de démarrage fiabilisé via healthchecks (postgres → n8n → runner/cloudflared)
- ✅ n8n et son runner pinnés sur le tag `stable` pour rester compatibles entre eux
