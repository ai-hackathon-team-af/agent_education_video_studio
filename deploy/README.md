# デプロイガイド

## GCE (Google Compute Engine) へのデプロイ

### 必要要件

- Google Cloud アカウント
- gcloud CLI がインストール済み
- Git

### 推奨スペック

| 項目 | 推奨値 |
|------|--------|
| マシンタイプ | e2-medium 以上 (2 vCPU, 4GB RAM) |
| ディスク | 50GB SSD |
| OS | Ubuntu 22.04 LTS |
| リージョン | asia-northeast1 (東京) |

### デプロイ手順

#### 1. GCE インスタンスの作成

```bash
# gcloud CLI でログイン
gcloud auth login

# プロジェクトを設定
gcloud config set project YOUR_PROJECT_ID

# インスタンス作成スクリプトを実行
./deploy/create-gce-instance.sh zundan-studio asia-northeast1-b
```

または手動で作成:

```bash
gcloud compute instances create zundan-studio \
  --zone=asia-northeast1-b \
  --machine-type=e2-medium \
  --boot-disk-size=50GB \
  --boot-disk-type=pd-ssd \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --tags=http-server

# ファイアウォールルール
gcloud compute firewall-rules create allow-http \
  --allow=tcp:80,tcp:443 \
  --target-tags=http-server
```

#### 2. サーバーにSSH接続

```bash
gcloud compute ssh zundan-studio --zone=asia-northeast1-b
```

#### 3. サーバーセットアップ

```bash
# Docker インストール
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 一度ログアウトして再接続
exit
# 再度 SSH 接続

# Docker Compose インストール
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 4. アプリケーションのデプロイ

```bash
# リポジトリをクローン
git clone https://github.com/ai-hackathon-team-af/agent_education_video_studio.git ~/zundan_studio
cd ~/zundan_studio

# 環境変数を設定
cp .env.production.example .env.production
nano .env.production  # GOOGLE_API_KEY などを設定

# 本番環境で起動
docker-compose -f docker-compose.prod.yml up -d --build
```

#### 5. 動作確認

ブラウザで `http://<EXTERNAL_IP>` にアクセス

### 環境変数

`.env.production` に以下を設定:

| 変数名 | 説明 | 必須 |
|--------|------|------|
| GOOGLE_API_KEY | Google Gemini API キー | ✅ |
| ALLOWED_ORIGINS | CORS許可オリジン (カンマ区切り) | - |
| VOICEVOX_HOST | VOICEVOX URL | - |
| REDIS_URL | Redis URL | - |

### 更新方法

```bash
cd ~/zundan_studio
git pull origin main
docker-compose -f docker-compose.prod.yml up -d --build
```

### ログ確認

```bash
# 全サービスのログ
docker-compose -f docker-compose.prod.yml logs -f

# 特定サービスのログ
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f celery-worker
```

### トラブルシューティング

#### コンテナが起動しない

```bash
# コンテナの状態確認
docker-compose -f docker-compose.prod.yml ps

# ログ確認
docker-compose -f docker-compose.prod.yml logs
```

#### VOICEVOX が遅い

CPU版を使用しているため、音声合成に時間がかかります。
GPU対応インスタンスを使用する場合は、VOICEVOX のイメージを GPU 版に変更してください。

#### ディスク容量不足

```bash
# 不要なDockerイメージを削除
docker system prune -a
```
