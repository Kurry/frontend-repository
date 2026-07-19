FROM mcr.microsoft.com/playwright:v1.61.0-noble
ENV DEBIAN_FRONTEND=noninteractive

COPY --from=ghcr.io/astral-sh/uv:0.11.15 /uv /uvx /bin/

RUN apt-get update && apt-get install -y --no-install-recommends build-essential \
 && rm -rf /var/lib/apt/lists/*


WORKDIR /app
EXPOSE 3000
