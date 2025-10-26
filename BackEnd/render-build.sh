#!/usr/bin/env bash
set -o errexit

echo "📦 Instalando dependencias del sistemas..."
apt-get update 
apt-get install -y python3 python3-pip ffmpeg

echo "🐍 Instalando yt-dlp..."
pip install -U yt-dlp

echo "✅ yt-dlp y ffmpeg instalados correctamente."