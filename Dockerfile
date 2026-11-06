FROM python:3.10-slim

# Create user with UID 1000 (Required by Hugging Face Spaces)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

WORKDIR $HOME/app

# Install dependencies
COPY --chown=user:user requirements.txt .
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Copy application files
COPY --chown=user:user . .

EXPOSE 7860

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
