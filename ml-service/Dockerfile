FROM python:3.11-slim

WORKDIR /app

# Cài dependencies trước (tận dụng Docker layer cache)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 3002
ENV ML_SERVICE_PORT=3002

CMD ["python", "app.py"]
