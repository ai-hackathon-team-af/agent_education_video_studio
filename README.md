# ずんだもん動画生成スタジオ v2.0

React + FastAPI で完全リニューアルされた、ずんだもん動画生成アプリケーションです。

## 🎯 主な機能

- 🎬 **会話動画生成**: ずんだもんとゲストキャラクターの会話動画を自動生成
- 📚 **AI 台本生成**: お笑い（コメディ）テーマの解説動画の台本を自動生成
- 🎙️ **音声合成**: VOICEVOX による高品質な音声生成
- 🖼️ **画像処理**: 口パクアニメーションと背景合成
- 🎵 **BGM ミキシング**: セクションごとの BGM 自動配置
- 📄 **PDF/Word 対応**: PDF・Word ファイルからのテキスト抽出
- 🎨 **背景 AI 生成**: テーマに合わせた背景画像の自動生成
- ⚙️ **管理機能**: 背景・アイテムデータの管理

## 🏗️ 技術スタック

### Frontend

- **React 18** + TypeScript
- **Vite** - 高速ビルドツール
- **Tailwind CSS** - ユーティリティファースト CSS
- **Zustand** - 軽量状態管理
- **React Query** - サーバー状態管理
- **Axios** - HTTP クライアント

### Backend

- **FastAPI** - 高速 API フレームワーク
- **Celery** - 非同期タスクキュー
- **Redis** - メッセージブローカー
- **WebSocket** - リアルタイム進捗通知
- **Pydantic** - データバリデーション

### 既存機能（継続使用）

- **VOICEVOX** - 音声合成エンジン
- **OpenCV** - 画像処理
- **MoviePy** - 動画生成
- **LangChain** - LLM 統合
- **Google GenAI (Gemini)** - AI モデル
- **Tavily** - Web 検索統合
- **Supabase** - データベース

## 📦 セットアップ

### 必要条件

- Docker & Docker Compose
- 環境変数設定（`.env`ファイル）

### 起動方法

```bash
# リポジトリをクローン
git clone <repository-url>
cd zundan_studio

# 環境変数ファイルを作成
cp .env.example .env
# .envファイルを編集（GOOGLE_API_KEY は必須）

# Docker Composeで全サービスを起動
docker-compose up --build
```

### アクセス URL

- **Frontend (React)**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs (Swagger)**: http://localhost:8000/docs
- **VOICEVOX**: http://localhost:50021

## 🚀 使用方法

### ウィザード形式の動画生成フロー

アプリは4ステップのウィザード形式で動作します：

1. **入力画面**: テーマの入力、AI モデルの選択、PDF/Word ファイルからのテキスト抽出（オプション）
2. **レビュー画面**: AI が生成したタイトル・アウトライン・台本を確認・編集
3. **ローディング画面**: 動画生成の進捗を WebSocket でリアルタイム確認
4. **結果画面**: 完成した動画のプレビューとダウンロード

## 📂 プロジェクト構造

```
zundan_studio/
├── backend/                 # FastAPI バックエンド
│   ├── app/
│   │   ├── api/            # APIエンドポイント
│   │   │   ├── scripts/   # 台本生成API
│   │   │   ├── videos/    # 動画生成API
│   │   │   ├── upload/    # ファイルアップロードAPI
│   │   │   └── management.py
│   │   ├── core/           # コアロジック
│   │   │   ├── script_generators/  # 台本生成（comedy等）
│   │   │   ├── asset_generators/   # 背景・音声生成
│   │   │   └── processors/         # 音声・動画処理
│   │   ├── services/       # ビジネスロジック
│   │   ├── models/         # データモデル
│   │   ├── prompts/        # LLMプロンプト
│   │   ├── tasks/          # Celeryタスク
│   │   ├── config/         # 設定・キャラクター・BGM
│   │   └── main.py         # エントリーポイント
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                # React フロントエンド
│   ├── src/
│   │   ├── pages/          # ページコンポーネント
│   │   ├── components/     # UIコンポーネント
│   │   │   └── wizard/    # ウィザードフロー
│   │   ├── stores/         # Zustand状態管理
│   │   ├── hooks/          # カスタムフック
│   │   ├── api/            # APIクライアント
│   │   ├── types/          # TypeScript型定義
│   │   └── App.tsx
│   ├── Dockerfile
│   └── package.json
├── deploy/                  # GCEデプロイスクリプト
├── assets/                  # 画像・音声アセット
├── outputs/                 # 生成動画出力
├── docker-compose.yml       # Docker Compose設定（開発用）
├── docker-compose.prod.yml  # Docker Compose設定（本番用）
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

### AIモデル設定

AIモデルの設定は `backend/app/config/models.py` で一元管理されています。

```python
# 利用可能なAIモデルの設定
AVAILABLE_MODELS: List[Dict[str, Any]] = [
    {
        "id": "gemini-3-flash-preview",
        "name": "Gemini 3 Flash",
        "provider": "google",
        "recommended": True,
    },
    # ... 他のモデル (Gemini 1.5 Pro, Gemini 1.5 Flash)
]

# デフォルトモデル設定
DEFAULT_MODEL_ID = "gemini-3-flash-preview"
```

**特徴:**
- フロントエンドは起動時に `/scripts/models` APIからモデル一覧を取得
- バックエンドの全ジェネレーター（台本生成、画像生成など）でデフォルトモデルを使用
- モデルの追加・変更は `models.py` を編集するだけで全体に反映

### デフォルトモード設定

生成モードのデフォルト設定は `frontend/src/stores/scriptStore.ts` で管理されています。

```typescript
mode: "comedy",  // デフォルトモード: "comedy" (お笑い)
```

## 🐛 トラブルシューティング

### VOICEVOX に接続できない

```bash
# VOICEVOXコンテナの状態確認
docker-compose ps voicevox

# VOICEVOXコンテナを再起動
docker-compose restart voicevox
```

### Celery タスクが実行されない

```bash
# Redisの接続確認
docker-compose exec redis redis-cli ping

# Celeryワーカーのログ確認
docker-compose logs celery-worker
```

### フロントエンドがバックエンドに接続できない

- 環境変数 `VITE_API_URL` と `VITE_WS_URL` が正しく設定されているか確認
- `GOOGLE_API_KEY` が `.env` に設定されているか確認
- バックエンドが起動しているか確認（http://localhost:8000/health）

## 📝 API ドキュメント

FastAPI の自動生成ドキュメントを参照してください：

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🔄 v1.0 からの主な変更点

### アーキテクチャ

- ❌ Streamlit → ✅ React + FastAPI
- ❌ 同期処理 → ✅ 非同期処理（Celery）
- ❌ セッション状態 → ✅ REST API + WebSocket

### メリット

- ⚡ **パフォーマンス向上**: 非同期処理により複数ユーザー対応
- 🎨 **モダン UI**: React による洗練されたインターフェース
- 📈 **スケーラビリティ**: Celery ワーカーの水平スケーリング
- 🔌 **API 化**: 他のクライアントからも利用可能
- 🔒 **型安全性**: TypeScript による開発体験向上

## 📄 ライセンス

MIT License

## 🙏 謝辞

- VOICEVOX プロジェクト
- ずんだもん・四国めたん キャラクター
- その他のオープンソースプロジェクト
