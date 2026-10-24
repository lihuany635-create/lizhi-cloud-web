# Staging-only CADCraft runtime. Build from the repo root.
# OCI images MUST be reviewed before public/private deployment.
FROM node:22-bookworm-slim AS cadcraft-download
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl tar && rm -rf /var/lib/apt/lists/*
WORKDIR /download
RUN set -eu; \
    base='https://github.com/storytold/cadcraft/releases/download/v0.12.0'; \
    asset='cadcraft-0.12.0-linux-x86_64.tar.gz'; \
    curl --fail --location --retry 3 --silent --show-error "$base/$asset" -o "$asset"; \
    curl --fail --location --retry 3 --silent --show-error "$base/SHA256SUMS.txt" -o SHA256SUMS.txt; \
    awk -v f="$asset" '$2 == f || $2 == ("*" f) { print $1 "  " f }' SHA256SUMS.txt > expected.sha256; \
    test "$(wc -l < expected.sha256)" -eq 1; \
    sha256sum --check expected.sha256; \
    mkdir -p /binfile; tar -xzf "$asset" -C /binfile; \
    bin="$(find /binfile -name cadcraft-cli -type f | head -n 1)"; \
    test -n "$bin"; install -m 0755 "$bin" /download/cadcraft-cli

FROM node:22-bookworm-slim AS staging
WORKDIR /opt/lizhi
COPY engineering/cad/deploy/package.json /opt/lizhi/package.json
RUN npm install --omit=dev --ignore-scripts --no-audit --no-fund \
    && npm cache clean --force
COPY engineering/cad/ /opt/lizhi/engineering/cad/
COPY --from=cadcraft-download /download/cadcraft-cli /opt/lizhi/bin/cadcraft-cli
RUN mkdir -p /opt/lizhi/bin && chown -R node:node /opt/lizhi
ENV NODE_ENV=production
USER node
STOPSIGNAL SIGTERM
CMD ["node","engineering/cad/cloud-cad-mcp-server.cjs"]
