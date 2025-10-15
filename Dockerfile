# Reproducible release builder for Tab Organizer
# Produces artifacts/zip inside the container at /app/artifacts

FROM node:20-bullseye AS builder

ARG GO_VERSION=1.25.2
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      ca-certificates curl wget git zip python3 && \
    rm -rf /var/lib/apt/lists/*

# Install Go toolchain (pinned)
RUN curl -fsSL https://go.dev/dl/go${GO_VERSION}.linux-amd64.tar.gz -o /tmp/go.tgz && \
    tar -C /usr/local -xzf /tmp/go.tgz && \
    rm /tmp/go.tgz
ENV PATH=/usr/local/go/bin:${PATH}

WORKDIR /app
COPY . .

# Build release (deps, tests, build, package)
RUN make release

# Convenience default: list artifacts
CMD ["/bin/sh", "-lc", "ls -lah artifacts && echo 'Artifacts are in /app/artifacts' && echo 'Use: docker run --rm -v \"$PWD/out:/out\" IMAGE sh -lc \"cp -r artifacts/* /out/\"'"]


