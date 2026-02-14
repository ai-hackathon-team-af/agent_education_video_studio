# Tasuke

AI を活用して教育用キャラクター解説動画を自動生成する Web アプリケーションです。テーマを入力するだけで、台本生成から動画出力までをワンストップで行います。

## 🎯 主な機能

- 🎬 **AI 動画自動生成**: テーマ入力 → 台本生成 → 音声合成 → 動画出力を一貫して自動化
- 📚 **AI 台本生成**: Google Gemini による教育用解説台本の自動生成（タイトル・アウトライン・セリフ）
- 🎙️ **音声合成**: VOICEVOX によるキャラクターボイス生成
- 🖼️ **画像処理**: 口パクアニメーションと背景合成
- 🎵 **BGM ミキシング**: セクションごとの BGM 自動配置
- 🎨 **背景 AI 生成**: Google Gemini を活用したテーマに合わせた背景画像の自動生成
- 📄 **PDF/Word 対応**: 資料からのテキスト抽出で台本生成をサポート

## 🏗️ 技術スタック

### AI / クラウド

- **Google Gemini (gemini-3-flash-preview)** - 台本生成・背景画像生成の中核 AI モデル
- **Google Cloud (GCE)** - 本番環境のホスティング
- **LangChain** - LLM オーケストレーション
- **Tavily** - Web 検索による情報収集

### Frontend

- **React 18** + TypeScript
- **Vite** - 高速ビルドツール
- **Tailwind CSS** - ユーティリティファースト CSS
- **Zustand** - 軽量状態管理
- **TanStack Query** - サーバー状態管理
- **Axios** - HTTP クライアント

### Backend

- **FastAPI** - 高速 API フレームワーク
- **Celery** - 非同期タスクキュー（動画レンダリング）
- **Redis** - メッセージブローカー
- **WebSocket** - リアルタイム進捗通知
- **Pydantic v2** - データバリデーション

### メディア処理

- **VOICEVOX** - 音声合成エンジン
- **OpenCV** - 画像処理
- **MoviePy** - 動画生成
- **Supabase** - データベース

## 🚀 使用方法

アプリは 4 ステップのウィザード形式で動作します：

1. **入力画面**: テーマの入力、AI モデルの選択、PDF/Word ファイルからの参考テキスト抽出（オプション）
2. **レビュー画面**: Gemini が生成したタイトル・アウトライン・台本を確認・編集
3. **ローディング画面**: 動画生成の進捗を WebSocket でリアルタイム確認
4. **結果画面**: 完成した動画のプレビューとダウンロード

## 📦 セットアップ

### 必要条件

- Docker & Docker Compose
- Google API Key（Gemini 利用のため）

### 起動方法

```bash
# リポジトリをクローン
git clone <repository-url>
cd agent_education_video_studio

# 環境変数ファイルを作成
cp .env.example .env
# .env ファイルを編集（GOOGLE_API_KEY は必須）

# Docker Compose で全サービスを起動
docker-compose up --build
```

### アクセス URL

| サービス | URL |
|----------|-----|
| Frontend (React) | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| VOICEVOX | http://localhost:50021 |

## 📂 プロジェクト構造

```
agent_education_video_studio/
├── backend/                 # FastAPI バックエンド
│   ├── app/
│   │   ├── api/            # API エンドポイント
│   │   │   ├── scripts/   # 台本生成 API
│   │   │   ├── videos/    # 動画生成 API
│   │   │   ├── upload/    # ファイルアップロード API
│   │   │   └── management.py
│   │   ├── core/           # コアロジック
│   │   │   ├── script_generators/  # 台本生成（Gemini 連携）
│   │   │   ├── asset_generators/   # 背景・音声生成
│   │   │   └── processors/         # 音声・動画処理
│   │   ├── services/       # ビジネスロジック
│   │   ├── models/         # データモデル
│   │   ├── prompts/        # LLM プロンプト
│   │   ├── tasks/          # Celery タスク
│   │   ├── config/         # 設定・キャラクター・BGM
│   │   └── main.py         # エントリーポイント
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                # React フロントエンド
│   ├── src/
│   │   ├── pages/          # ページコンポーネント
│   │   ├── components/     # UI コンポーネント
│   │   │   └── wizard/    # ウィザードフロー
│   │   ├── stores/         # Zustand 状態管理
│   │   ├── hooks/          # カスタムフック
│   │   ├── api/            # API クライアント
│   │   ├── types/          # TypeScript 型定義
│   │   └── App.tsx
│   ├── Dockerfile
│   └── package.json
├── deploy/                  # GCE デプロイスクリプト
├── assets/                  # 画像・音声アセット
├── outputs/                 # 生成動画出力
├── docker-compose.yml       # Docker Compose 設定（開発用）
├── docker-compose.prod.yml  # Docker Compose 設定（本番用）
└── README.md
```

## 🔧 開発

### バックエンド開発

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### フロントエンド開発

```bash
cd frontend
npm install
npm run dev
```

### Celery ワーカー起動

```bash
cd backend
celery -A app.tasks.celery_app worker --loglevel=info
```

## ⚙️ 設定

### AI モデル設定

AI モデルの設定は `backend/app/config/models.py` で一元管理されています。

```python
AVAILABLE_MODELS: List[Dict[str, Any]] = [
    {
        "id": "gemini-3-flash-preview",
        "name": "Gemini 3 Flash",
        "provider": "google",
        "recommended": True,
    },
    # ... 他のモデル (Gemini 1.5 Pro, Gemini 1.5 Flash)
]

DEFAULT_MODEL_ID = "gemini-3-flash-preview"
```

- フロントエンドは起動時に `/scripts/models` API からモデル一覧を取得
- バックエンドの全ジェネレーター（台本生成、画像生成など）でデフォルトモデルを使用
- モデルの追加・変更は `models.py` を編集するだけで全体に反映

## 🐛 トラブルシューティング

### VOICEVOX に接続できない

```bash
docker-compose ps voicevox
docker-compose restart voicevox
```

### Celery タスクが実行されない

```bash
docker-compose exec redis redis-cli ping
docker-compose logs celery-worker
```

### フロントエンドがバックエンドに接続できない

- `GOOGLE_API_KEY` が `.env` に設定されているか確認
- 環境変数 `VITE_API_URL` と `VITE_WS_URL` が正しく設定されているか確認
- バックエンドが起動しているか確認（http://localhost:8000/health）

## 📝 API ドキュメント

FastAPI の自動生成ドキュメントを参照してください：

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 📄 ライセンス

MIT License

## 🙏 謝辞

- VOICEVOX プロジェクト
- ずんだもん・四国めたん キャラクター
- Google Gemini
- その他のオープンソースプロジェクト
