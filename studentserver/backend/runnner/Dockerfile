FROM ubuntu:22.04

RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    openjdk-17-jdk \
    python3 \
    nodejs \
    npm

RUN ln -s /usr/bin/python3 /usr/bin/python || true
RUN ln -s /usr/bin/nodejs /usr/bin/node || true

WORKDIR /app

CMD ["bash"]