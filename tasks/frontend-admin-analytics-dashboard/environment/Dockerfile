FROM mcr.microsoft.com/playwright:v1.61.0-noble
ENV DEBIAN_FRONTEND=noninteractive

RUN curl -LsSf https://astral.sh/uv/install.sh | sh \
 && install -m 0755 /root/.local/bin/uv /usr/local/bin/uv \
 && install -m 0755 /root/.local/bin/uvx /usr/local/bin/uvx

RUN apt-get update && apt-get install -y --no-install-recommends build-essential \
 && rm -rf /var/lib/apt/lists/*

RUN npm install -g \
      @anthropic-ai/claude-code@2.1.183 \
      serve@14.2.4

WORKDIR /app
EXPOSE 3000
