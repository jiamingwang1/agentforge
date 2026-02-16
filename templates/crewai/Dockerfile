FROM python:3.11-slim

WORKDIR /app

RUN pip install --no-cache-dir crewai crewai-tools

COPY crew.py .

EXPOSE 8000

CMD ["python", "crew.py"]
