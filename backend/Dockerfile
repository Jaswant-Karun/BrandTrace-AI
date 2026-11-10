# syntax=docker/dockerfile:1
FROM python:3.13-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Expose FastAPI port
EXPOSE 8000

ENV HOST=0.0.0.0
ENV PORT=8000

# Start Uvicorn server
CMD ["uvicorn", "brandtrace.main:app", "--host", "0.0.0.0", "--port", "8000"]

