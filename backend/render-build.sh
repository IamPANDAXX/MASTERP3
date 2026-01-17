#instala dependencias y librerias
echo "Instalando dependencias del sistemas..."
apt-get update 
apt-get install -y python3 python3-pip ffmpeg

echo "Instalando yt-dlp..."
pip install -U yt-dlp

echo "Actualizando el yt-dlp..."
pip install --upgrade yt-dlp


echo "yt-dlp y ffmpeg instalados correctamente."
