#!/usr/bin/env bash
set -euo pipefail

# EnerjiPanel deploy script
# Faz 0: Sadece altyapı servislerini ayağa kaldırır. Uygulama servisleri eklendikçe genişletilecek.

cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo ".env bulunamadı. .env.example dosyasini kopyalayip degerleri doldurun." >&2
  exit 1
fi

docker compose pull
docker compose up -d

echo "Servis durumu:"
docker compose ps
