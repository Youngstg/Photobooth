FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Run Gunicorn
CMD ["gunicorn", "-b", "0.0.0.0:7860", "server:app", "--log-file", "-"]
