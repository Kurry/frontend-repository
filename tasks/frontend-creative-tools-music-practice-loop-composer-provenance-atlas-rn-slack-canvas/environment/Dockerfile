FROM harbor-eval-sandbox:v1

# Setup workspace
WORKDIR /app
COPY . .

# Extract standard React/Vite node_modules
RUN if [ -f /opt/node_modules_cache/react-vite-node-modules.tar.gz ]; then \
        tar -xzf /opt/node_modules_cache/react-vite-node-modules.tar.gz -C /app; \
    fi

# Build
RUN npm run build
