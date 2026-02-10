#!/bin/bash
# GCEホストにスワップファイルを追加するスクリプト
# 使い方: sudo bash scripts/setup-swap.sh

set -e

SWAP_SIZE="${1:-4G}"
SWAP_FILE="/swapfile"

if swapon --show | grep -q "$SWAP_FILE"; then
    echo "スワップファイルは既に有効です"
    free -h
    exit 0
fi

echo "=== ${SWAP_SIZE} のスワップファイルを作成します ==="

fallocate -l "$SWAP_SIZE" "$SWAP_FILE"
chmod 600 "$SWAP_FILE"
mkswap "$SWAP_FILE"
swapon "$SWAP_FILE"

# 再起動後も有効にする
if ! grep -q "$SWAP_FILE" /etc/fstab; then
    echo "$SWAP_FILE none swap sw 0 0" >> /etc/fstab
fi

echo "=== スワップファイルの追加が完了しました ==="
free -h
