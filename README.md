# CSX AI Analyst

Institutional-grade quantitative research, forecasting, and news intelligence terminal for equities listed on the Cambodia Securities Exchange (CSX).

* **GitHub Repository:** `toysavi/csx-analyst-ai`
* **Docker Image Registry:** `ghcr.io/toysavi/csx-analyst-ai:latest`

---

## ⚡ Quick Start: Pull and Run with Docker

Every time you push code to `toysavi/csx-analyst-ai`, GitHub Actions automatically builds and publishes the latest Docker container image.

### Option A: Using Docker Run
```bash
docker pull ghcr.io/toysavi/csx-analyst-ai:latest

docker run -d \
  --name csx-analyst \
  -p 3000:3000 \
  -e GEMINI_API_KEY="YOUR_GEMINI_API_KEY" \
  -e PORT=3000 \
  ghcr.io/toysavi/csx-analyst-ai:latest
```

Open your browser at: **`http://localhost:3000`**

### Option B: Using Docker Compose
Create a `.env` file containing:
```bash
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```
Then start the application with:
```bash
docker compose up -d
```

To view logs:
```bash
docker compose logs -f
```

To stop:
```bash
docker compose down
```

---

## ⚙️ One-Time Setup in GitHub (`toysavi/csx-analyst-ai`)

For GitHub Actions to push images to GitHub Packages without any permissions errors:

1. Open your repository in GitHub:
   👉 **`https://github.com/toysavi/csx-analyst-ai/settings/actions`**
2. Scroll down to **Workflow permissions**.
3. Select **Read and write permissions**.
4. Click **Save**.

### Making the Docker Image Public (Recommended)
By default, GitHub Packages are private. To allow pulling without entering a GitHub Personal Access Token:
1. Go to your repository's packages: **`https://github.com/toysavi/csx-analyst-ai/packages`**
2. Click on **`csx-analyst-ai`**.
3. Click **Package settings** (on the right sidebar).
4. Scroll to **Danger Zone** -> **Change visibility** -> Select **Public**.

Now you and anyone else can pull `docker pull ghcr.io/toysavi/csx-analyst-ai:latest` without logging in!

---

## ☸️ ArgoCD GitOps Deployment (Traefik & Cert-Manager for csx.toysavi.com)

The repository includes production Kubernetes & ArgoCD manifests under `/k8s/`:
* `k8s/argocd-application.yaml`: ArgoCD Application referencing `https://github.com/toysavi/csx-analyst-ai.git`
* `k8s/deployment.yaml`: Deployment with `ghcr.io/toysavi/csx-analyst-ai:latest`, probes & resources
* `k8s/service.yaml`: ClusterIP service (port 80 -> 3000)
* `k8s/traefik-ingressroute.yaml`: Traefik CRD IngressRoute for `csx.toysavi.com` with TLS
* `k8s/ingress.yaml`: Standard Kubernetes Ingress alternative with cert-manager annotations
* `k8s/certificate.yaml`: Cert-Manager Certificate for `csx.toysavi.com` (using `letsencrypt-prod`)
* `k8s/kustomization.yaml`: Kustomize bundle

### Step 1: Create the Kubernetes Secret for Gemini AI
```bash
kubectl create namespace csx-analyst --dry-run=client -o yaml | kubectl apply -f -

kubectl create secret generic csx-analyst-secrets \
  --namespace csx-analyst \
  --from-literal=GEMINI_API_KEY="YOUR_ACTUAL_GEMINI_API_KEY"
```

### Step 2: Apply the ArgoCD Application
```bash
kubectl apply -f k8s/argocd-application.yaml
```
ArgoCD will automatically clone `https://github.com/toysavi/csx-analyst-ai.git`, apply all manifests in the `k8s/` folder, and reconcile on every commit.

### Step 3: Configure DNS for csx.toysavi.com
Point the DNS **A record** for `csx.toysavi.com` to your Traefik Ingress LoadBalancer external IP:
```bash
# Find Traefik LoadBalancer External IP
kubectl get svc -n traefik
```

### Step 4: Verify Cert-Manager Automated SSL & Traefik Ingress
```bash
# Check TLS certificate issuance
kubectl get certificate -n csx-analyst
kubectl describe certificate csx-toysavi-tls -n csx-analyst

# Check Traefik IngressRoute
kubectl get ingressroute -n csx-analyst

# Check running application pods
kubectl get pods -n csx-analyst
```
Once cert-manager finishes the HTTP-01 challenge, your application will be securely accessible at **`https://csx.toysavi.com`** with an official Let's Encrypt SSL certificate!

---

## 🚀 How the Automated Pipeline Works

1. **You push code to GitHub:**
   ```bash
   git add .
   git commit -m "Update application"
   git push origin main
   ```
2. **GitHub Actions automatically:**
   * Runs the workflow defined in `.github/workflows/docker-build-push.yml`
   * Compiles the Vite React frontend
   * Packages the full-stack Node.js server with `@google/genai`
   * Publishes the new image as `ghcr.io/toysavi/csx-analyst-ai:latest`
3. **You pull and run the updated image:**
   ```bash
   docker pull ghcr.io/toysavi/csx-analyst-ai:latest
   docker restart csx-analyst
   ```
