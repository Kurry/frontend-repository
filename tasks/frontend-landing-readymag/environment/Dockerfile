FROM mcr.microsoft.com/playwright:v1.61.0-noble
ENV DEBIAN_FRONTEND=noninteractive

RUN curl -LsSf https://astral.sh/uv/install.sh | sh \
 && install -m 0755 /root/.local/bin/uv /usr/local/bin/uv \
 && install -m 0755 /root/.local/bin/uvx /usr/local/bin/uvx

RUN apt-get update && apt-get install -y --no-install-recommends build-essential \
 && rm -rf /var/lib/apt/lists/*

# serve is pinned globally so the 25 oracles whose start script is
# "npx --yes serve ..." resolve it deterministically without a registry
# fetch at verify time. The claude-code CLI is NOT baked here: Harbor's
# agent installer provisions the requested version at run time, and a
# baked pin drifts against it.
RUN npm install -g serve@14.2.4

WORKDIR /app
EXPOSE 3000
