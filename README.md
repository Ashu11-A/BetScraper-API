# WSL2
```sh
# Windowns WSL2: https://www.tensorflow.org/install/pip?hl=pt-br#windows-wsl2_1
# Install cuda: https://developer.nvidia.com/cuda-downloads

sudo apt install nvidia-cuda-toolkit
```

# API Typescript
```sh
sudo apt update && sudo apt install -y ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils


```

# API Python

```sh
apt install python3.10 python3.10-venv

python3 -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt

# WSL2
# export LD_LIBRARY_PATH=/usr/lib/wsl/lib:$LD_LIBRARY_PATH
python3 api.py
```

# Saving current Libs
```sh
pip freeze > requirements.txt
```

# Correção de erros [job.id is null]

```sh
# https://stackoverflow.com/questions/33115325/how-to-set-redis-max-memory

```

# Unable to connect. Is the computer able to access the url
```sh
# https://github.com/oven-sh/bun/issues/1425
```