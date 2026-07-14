# ==========================================
# STAGE 1: Build the React Frontend
# ==========================================
FROM node:18-alpine AS frontend-builder
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ==========================================
# STAGE 2: Build the FastAPI Backend
# ==========================================
FROM python:3.10-slim
WORKDIR /workspace

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend files and built frontend assets
COPY backend/ ./backend
COPY dataset/ ./dataset
COPY --from=frontend-builder /frontend/dist ./backend/app/static

# Set environment configurations
ENV SECRET_KEY=9a7c36a4f108d8de95d52bbefb9087cdce2304918e7e174b8893d3958742b6a2
ENV ALGORITHM=HS256
ENV ACCESS_TOKEN_EXPIRE_MINUTES=1440
ENV DATABASE_URL=sqlite:///./backend/movie_rec.db
ENV PYTHONPATH=/workspace/backend

EXPOSE 8000

# Start server
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
